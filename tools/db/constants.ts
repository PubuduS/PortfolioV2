import path from 'node:path';

/** Local emulator project, hosts, and ports. Prod ids do not belong here. */
export interface EmulatorTarget {
  readonly projectId: string;
  readonly hosts: {
    readonly auth: string;
    readonly firestore: string;
    readonly storage: string;
    readonly ui: string;
  };
}

/** Ports for the emulator target. Hosts stay bare so the guard can check them. */
export interface EmulatorPorts {
  readonly auth: number;
  readonly firestore: number;
  readonly storage: number;
  readonly ui: number;
}

/** Demo project the emulators, seed, reset, and verify are allowed to touch. */
export const EMULATOR_TARGET: EmulatorTarget = {
  projectId: 'demo-portfolio-v2',
  hosts: {
    auth: '127.0.0.1',
    firestore: '127.0.0.1',
    storage: '127.0.0.1',
    ui: '127.0.0.1',
  },
};

/** Fixed emulator ports from the shared contract. */
export const EMULATOR_PORTS: EmulatorPorts = {
  auth: 9099,
  firestore: 8080,
  storage: 9199,
  ui: 4000,
};

/** Bucket name the Storage emulator serves for the demo project. */
export const EMULATOR_BUCKET = 'demo-portfolio-v2.appspot.com';

/** Fake admin user created in the Auth emulator. */
export const TEST_ADMIN_EMAIL = 'admin@example.test';

/** Password for the fake admin user. */
export const TEST_ADMIN_PASSWORD = 'test-admin-password';

/** Replacement for any real email address. */
export const MOCK_EMAIL = 'mock.user@example.test';

/** Replacement for any real phone number. */
export const MOCK_PHONE = '+1-555-0100';

/** Replacement for a leftover access token query value. */
export const MOCK_TOKEN = 'mock-token';

/** Bump when sanitizer output changes shape or replacements. */
export const SANITIZER_VERSION = 3;

/** Snapshot refuses to write a file larger than this. */
export const MAX_BASELINE_FILE_BYTES = 1024 * 1024;

/** JDK 21 used to start the emulators. The default java on PATH is Java 8. */
export const JDK21_HOME = 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.101-hotspot';

/** Repository root, two levels above this file. */
export const REPO_ROOT = path.resolve(__dirname, '..', '..');

/** Committed sanitized snapshot. */
export const BASELINE_ROOT = path.join(REPO_ROOT, 'db', 'baseline');
