import {
  execFile,
  execFileSync,
  spawn,
  type ChildProcess,
} from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

import {
  EMULATOR_PORTS,
  EMULATOR_TARGET,
  JDK21_HOME,
  REPO_ROOT,
} from './constants';
import {
  assertEmulatorTarget,
  clearCredentialEnv,
  isDirectScript,
} from './guards';
import { seedBaseline } from './seed';

const READY_TIMEOUT_MS = 90_000;

/**
 * Starts the emulator suite with JDK 21, seeds it, and stays in the foreground.
 * Stopping this process stops the emulators and drops their data.
 */
async function main(): Promise<void> {
  assertEmulatorTarget(EMULATOR_TARGET);
  clearCredentialEnv();
  const env = await jdk21Env(process.env);
  const child = startFirebase(env);
  let stopped = false;
  const stop = (): void => {
    if (stopped) {
      return;
    }
    stopped = true;
    killProcessTree(child);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  process.on('SIGHUP', stop);
  try {
    await waitForEmulatorPorts(child);
    await seedBaseline();
    process.stdout.write('emulators ready\n');
    const code = await waitForExit(child);
    stop();
    process.exit(code ?? 0);
  } catch (error) {
    stop();
    throw error;
  }
}

/**
 * Prepends the bundled JDK 21 when the first java on PATH is older than 21.
 *
 * @param base Environment inherited by the emulator process.
 * @returns Environment for the child process.
 */
export async function jdk21Env(base: NodeJS.ProcessEnv): Promise<NodeJS.ProcessEnv> {
  const pathKey = Object.keys(base).find((key) => key.toLowerCase() === 'path') ?? 'Path';
  const currentPath = base[pathKey] ?? '';
  const javaBin = firstJava(currentPath);
  const major = javaBin
    ? await javaMajor(javaBin)
    : null;
  if (major !== null && major >= 21) {
    return base;
  }
  if (!fs.existsSync(JDK21_HOME)) {
    throw new Error(`JDK 21 is not at ${JDK21_HOME}`);
  }
  const nextPath = `${path.join(JDK21_HOME, 'bin')}${path.delimiter}${currentPath}`;
  return {
    ...base,
    JAVA_HOME: JDK21_HOME,
    Path: nextPath,
    PATH: nextPath,
  };
}

function startFirebase(env: NodeJS.ProcessEnv): ChildProcess {
  const shim = path.join(REPO_ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'firebase.cmd' : 'firebase');
  const script = path.join(REPO_ROOT, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
  if (!fs.existsSync(shim) || !fs.existsSync(script)) {
    throw new Error(`local firebase binary is missing at ${shim}`);
  }
  const args = [
    script,
    'emulators:start',
    '--only',
    'auth,firestore,storage',
    '--project',
    EMULATOR_TARGET.projectId,
  ];
  // The .cmd shim breaks when the repo path contains spaces, so launch the script it runs.
  return spawn(process.execPath, args, {
    cwd: REPO_ROOT,
    env,
    stdio: 'inherit',
    windowsHide: true,
  });
}

async function waitForEmulatorPorts(child: ChildProcess): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  const ports = [
    EMULATOR_PORTS.auth,
    EMULATOR_PORTS.firestore,
    EMULATOR_PORTS.storage,
    EMULATOR_PORTS.ui,
  ];
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`firebase emulators exited early with code ${child.exitCode}`);
    }
    const open = await Promise.all(ports.map((port) => canConnect(port)));
    if (open.every((ready) => ready)) {
      return;
    }
    await delay(500);
  }
  throw new Error('emulators did not open their ports within 90 seconds');
}

function canConnect(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: EMULATOR_TARGET.hosts.firestore, port });
    const finish = (ready: boolean): void => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ready);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

function waitForExit(child: ChildProcess): Promise<number | null> {
  if (child.exitCode !== null) {
    return Promise.resolve(child.exitCode);
  }
  return new Promise((resolve, reject) => {
    child.once('exit', (code) => resolve(code));
    child.once('error', (error) => reject(error));
  });
}

function killProcessTree(child: ChildProcess): void {
  const pid = child.pid;
  if (!pid) {
    return;
  }
  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill', ['/pid', String(pid), '/t', '/f'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } catch {
      // The emulator process already exited.
    }
    return;
  }
  child.kill('SIGTERM');
}

function firstJava(pathValue: string): string | null {
  const fileName = process.platform === 'win32'
    ? 'java.exe'
    : 'java';
  const found = pathValue.split(path.delimiter)
    .filter((entry) => entry.length > 0)
    .map((entry) => path.join(entry, fileName))
    .find((candidate) => fs.existsSync(candidate));
  return found ?? null;
}

function javaMajor(javaBin: string): Promise<number | null> {
  return new Promise((resolve) => {
    execFile(javaBin, ['-version'], { windowsHide: true }, (_error, stdout, stderr) => {
      const match = `${stdout}\n${stderr}`.match(/version "(?:1\.)?(\d+)/);
      resolve(match?.[1]
        ? Number(match[1])
        : null);
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function fail(error: unknown): never {
  const message = error instanceof Error
    ? error.stack ?? error.message
    : 'emulators failed';
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

if (isDirectScript('emulators.ts')) {
  main().catch((error: unknown) => fail(error));
}
