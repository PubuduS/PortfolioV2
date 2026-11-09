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
 * Compiles functions/ so the functions emulator can load it.
 */
function buildFunctions(): void {
  const tsc = path.join(REPO_ROOT, 'functions', 'node_modules', 'typescript', 'lib', 'tsc.js');
  if (!fs.existsSync(tsc)) {
    throw new Error('functions dependencies are missing. Run npm install in functions/.');
  }
  execFileSync(process.execPath, [tsc, '-p', path.join(REPO_ROOT, 'functions')], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(REPO_ROOT, 'functions', 'rewrite-contract-paths.mjs')], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
}

/**
 * Java executable name for this operating system.
 * @returns java.exe on Windows, otherwise java.
 */
function javaExecutable(): string {
  return process.platform === 'win32'
    ? 'java.exe'
    : 'java';
}

/**
 * Finds the first java executable on a PATH string.
 * @param pathValue PATH value.
 * @returns Absolute java path, or null.
 */
function firstJava(pathValue: string): string | null {
  const found = pathValue.split(path.delimiter)
    .filter((entry) => entry.length > 0)
    .map((entry) => path.join(entry, javaExecutable()))
    .find((candidate) => fs.existsSync(candidate));
  return found ?? null;
}

/**
 * Reads the major version from `java -version`.
 * @param javaBin Absolute path to java.
 * @returns Major version, or null when it cannot be read.
 */
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

/**
 * Runs a command and returns its stdout.
 * @param command Executable name.
 * @param args Arguments.
 * @returns Stdout, or null when the command fails.
 */
function commandOutput(command: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(command, args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      windowsHide: true,
    }, (error, stdout) => {
      resolve(error
        ? null
        : stdout);
    });
  });
}

/**
 * Resolves a JDK home from a mise install path.
 * @param installPath Directory mise reported.
 * @returns JDK home, or null when java is not there.
 */
function jdkHome(installPath: string): string | null {
  const bundledHome = path.join(installPath, 'Contents', 'Home');
  if (fs.existsSync(path.join(installPath, 'bin', javaExecutable()))) {
    return installPath;
  }
  if (fs.existsSync(path.join(bundledHome, 'bin', javaExecutable()))) {
    return bundledHome;
  }
  return null;
}

/**
 * Finds a JDK 21 home installed by mise.
 * @returns JDK home, or null when mise has no JDK 21.
 */
async function miseJavaHome(): Promise<string | null> {
  const stdout = await commandOutput('mise', ['where', 'java']);
  const installPath = stdout?.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 0);
  if (!installPath) {
    return null;
  }
  const javaHome = jdkHome(installPath);
  if (!javaHome) {
    return null;
  }
  const installedMajor = await javaMajor(path.join(javaHome, 'bin', javaExecutable()));
  return installedMajor !== null && installedMajor >= 21
    ? javaHome
    : null;
}

/**
 * Uses JDK 21 from PATH, or the Temurin JDK that `mise install` put on this machine.
 * Firebase emulators refuse the Java 8 that is often already on PATH.
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
  const javaHome = await miseJavaHome();
  if (!javaHome) {
    throw new Error(
      'JDK 21 was not found. Install mise from https://mise.jdx.dev/getting-started.html and run `mise install` in the repository root.',
    );
  }
  const nextPath = `${path.join(javaHome, 'bin')}${path.delimiter}${currentPath}`;
  return {
    ...base,
    JAVA_HOME: javaHome,
    Path: nextPath,
    PATH: nextPath,
  };
}

/**
 * Starts the local firebase-tools emulator process.
 * @param env Environment for the child, including JAVA_HOME.
 * @returns Emulator child process.
 */
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
    'auth,firestore,storage,functions',
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

/**
 * Stops the emulator process and its children.
 * @param child Emulator process.
 */
function killProcessTree(child: ChildProcess): void {
  const { pid } = child;
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

/**
 * True when a TCP connection to the loopback port succeeds.
 * @param port Port to probe.
 * @returns Whether the port accepted a connection.
 */
function canConnect(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: EMULATOR_TARGET.hosts.firestore, port });
    /**
     * Resolves the probe and closes the socket.
     * @param ready Whether the connection succeeded.
     */
    const finish = (ready: boolean): void => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ready);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

/**
 * Waits for a number of milliseconds.
 * @param ms Delay in milliseconds.
 * @returns Promise that resolves when the delay is complete.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Waits until every emulator port accepts a connection.
 * @param child Emulator process, used to notice an early exit.
 */
async function waitForEmulatorPorts(child: ChildProcess): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  const ports = [
    EMULATOR_PORTS.auth,
    EMULATOR_PORTS.firestore,
    EMULATOR_PORTS.storage,
    EMULATOR_PORTS.ui,
    EMULATOR_PORTS.functions,
  ];

  /**
   * Checks the ports once, then waits and tries again until the deadline.
   */
  async function poll(): Promise<void> {
    if (Date.now() >= deadline) {
      throw new Error('emulators did not open their ports within 90 seconds');
    }
    if (child.exitCode !== null) {
      throw new Error(`firebase emulators exited early with code ${child.exitCode}`);
    }
    const open = await Promise.all(ports.map((port) => canConnect(port)));
    if (open.every((ready) => ready)) {
      return;
    }
    await delay(500);
    await poll();
  }

  await poll();
}

/**
 * Resolves with the emulator process exit code.
 * @param child Emulator process.
 * @returns Exit code, or null when the process had none.
 */
function waitForExit(child: ChildProcess): Promise<number | null> {
  if (child.exitCode !== null) {
    return Promise.resolve(child.exitCode);
  }
  return new Promise((resolve, reject) => {
    child.once('exit', (code) => resolve(code));
    child.once('error', (error) => reject(error));
  });
}

/**
 * Starts the emulator suite with JDK 21, seeds it, and stays in the foreground.
 * Stopping this process stops the emulators and drops their data.
 */
async function main(): Promise<void> {
  assertEmulatorTarget(EMULATOR_TARGET);
  clearCredentialEnv();
  buildFunctions();
  const env = await jdk21Env(process.env);
  const child = startFirebase(env);
  let stopped = false;
  /**
   * Stops the emulator process tree once.
   */
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
 * Writes the failure and exits the process.
 * @param error Caught value.
 */
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
