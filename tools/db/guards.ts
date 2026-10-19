import { EMULATOR_TARGET, type EmulatorTarget } from './constants';

const LOCAL_HOSTS: ReadonlySet<string> = new Set(['127.0.0.1', 'localhost']);

/**
 * Throws unless the target is a demo project on a loopback host.
 *
 * @param target Project id and emulator hosts.
 */
export function assertEmulatorTarget(target: EmulatorTarget): void {
  if (!target.projectId.startsWith('demo-')) {
    throw new Error(`refusing project id ${target.projectId}`);
  }
  const hosts = Object.values(target.hosts);
  if (hosts.length === 0) {
    throw new Error('refusing target with no hosts');
  }
  for (const host of hosts) {
    if (!LOCAL_HOSTS.has(host)) {
      throw new Error(`refusing non-local host ${host}`);
    }
  }
}

/**
 * Throws when any emulator host variable is present.
 * Snapshot must talk to live project reads, never to a local emulator.
 *
 * @param env Process environment to inspect.
 */
export function assertSnapshotHasNoEmulatorHost(env: NodeJS.ProcessEnv): void {
  const hits = Object.keys(env).filter((key) => key.endsWith('_EMULATOR_HOST') && env[key]);
  if (hits.length > 0) {
    throw new Error(`snapshot refused because emulator host is set: ${hits.join(', ')}`);
  }
}

/**
 * Throws unless the live HTTP method is a read.
 *
 * @param method HTTP method about to be sent.
 */
export function assertLiveMethod(method: string): void {
  if (method !== 'GET') {
    throw new Error(`live snapshot refused HTTP ${method}`);
  }
}

/** Drops credential env vars for this process so admin calls cannot reach prod. */
export function clearCredentialEnv(): void {
  delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];
  delete process.env['FIREBASE_TOKEN'];
}

/**
 * True when this file was the tsx entry point.
 *
 * @param scriptName File name under tools/db, including the extension.
 * @returns Whether the current process was started as that script.
 */
export function isDirectScript(scriptName: string): boolean {
  const entry = (process.argv[1] ?? '').replace(/\\/g, '/');
  return entry.endsWith(`/tools/db/${scriptName}`);
}

/** The only emulator target this package is allowed to write. */
export function emulatorTarget(): EmulatorTarget {
  return EMULATOR_TARGET;
}
