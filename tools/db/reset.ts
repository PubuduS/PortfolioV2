import http from 'node:http';

import {
  EMULATOR_PORTS,
  EMULATOR_TARGET,
} from './constants';
import {
  assertEmulatorTarget,
  clearCredentialEnv,
  isDirectScript,
} from './guards';
import { seedBaseline } from './seed';

/**
 * Clears Auth, Firestore, and Storage in the emulators, then seeds the baseline.
 */
export async function resetBaseline(): Promise<void> {
  assertEmulatorTarget(EMULATOR_TARGET);
  clearCredentialEnv();
  await clearEmulators();
  await seedBaseline();
  process.stdout.write('reset complete\n');
}

async function clearEmulators(): Promise<void> {
  const project = encodeURIComponent(EMULATOR_TARGET.projectId);
  const firestoreHost = endpoint('firestore');
  const authHost = endpoint('auth');
  const storageHost = endpoint('storage');
  await request(
    `http://${firestoreHost}/emulator/v1/projects/${project}/databases/(default)/documents`,
    'DELETE',
  );
  await request(`http://${authHost}/emulator/v1/projects/${project}/accounts`, 'DELETE');
  await request(`http://${storageHost}/internal/reset`, 'POST');
}

function request(url: string, method: 'DELETE' | 'POST'): Promise<void> {
  const target = new URL(url);
  return new Promise((resolve, reject) => {
    const req = http.request(target, { method, timeout: 30_000 }, (res) => {
      res.resume();
      res.on('end', () => {
        const status = res.statusCode ?? 0;
        if (status < 200 || status >= 300) {
          reject(new Error(`emulator clear failed with status ${status} for ${method} ${safeUrl(url)}`));
          return;
        }
        resolve();
      });
    });
    req.on('error', () => {
      reject(new Error(`emulators are not accepting connections for ${method} ${safeUrl(url)}`));
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`emulators are not accepting connections for ${method} ${safeUrl(url)}`));
    });
    req.end();
  });
}

function endpoint(name: keyof typeof EMULATOR_PORTS): string {
  return `${EMULATOR_TARGET.hosts[name]}:${EMULATOR_PORTS[name]}`;
}

function safeUrl(url: string): string {
  const parsed = new URL(url);
  return `${parsed.origin}${parsed.pathname}`;
}

function fail(error: unknown): never {
  const message = error instanceof Error
    ? error.stack ?? error.message
    : 'reset failed';
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

if (isDirectScript('reset.ts')) {
  resetBaseline().catch((error: unknown) => fail(error));
}
