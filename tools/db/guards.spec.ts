import fs from 'node:fs';
import path from 'node:path';

import { EMULATOR_TARGET, type EmulatorTarget } from './constants';
import {
  assertEmulatorTarget,
  assertLiveMethod,
  assertSnapshotHasNoEmulatorHost,
  clearCredentialEnv,
} from './guards';

describe('emulator target guard', () => {
  it('should accept the demo loopback target', () => {
    expect(() => assertEmulatorTarget(EMULATOR_TARGET)).not.toThrow();
  });

  describe('when the project id is not a demo project', () => {
    it('should throw', () => {
      const target: EmulatorTarget = {
        ...EMULATOR_TARGET,
        projectId: 'portfolio-c9b8e',
      };
      expect(() => assertEmulatorTarget(target)).toThrow(/project id/);
    });
  });

  describe('when a host is not loopback', () => {
    it('should throw', () => {
      const target: EmulatorTarget = {
        ...EMULATOR_TARGET,
        hosts: {
          ...EMULATOR_TARGET.hosts,
          firestore: '10.0.0.8',
        },
      };
      expect(() => assertEmulatorTarget(target)).toThrow(/non-local host/);
    });

    it('should throw when the host includes a port', () => {
      const target: EmulatorTarget = {
        ...EMULATOR_TARGET,
        hosts: {
          ...EMULATOR_TARGET.hosts,
          auth: '127.0.0.1:9099',
        },
      };
      expect(() => assertEmulatorTarget(target)).toThrow(/non-local host/);
    });
  });
});

describe('snapshot emulator host guard', () => {
  it('should allow an environment with no emulator host', () => {
    expect(() => assertSnapshotHasNoEmulatorHost({ PATH: 'C:\\Windows' })).not.toThrow();
  });

  it('should ignore an empty emulator host variable', () => {
    expect(() => assertSnapshotHasNoEmulatorHost({ FIRESTORE_EMULATOR_HOST: '' })).not.toThrow();
  });

  describe('when an emulator host is set', () => {
    it('should throw', () => {
      expect(() => assertSnapshotHasNoEmulatorHost({
        FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
      })).toThrow(/FIRESTORE_EMULATOR_HOST/);
    });
  });
});

describe('live read guard', () => {
  it('should allow GET', () => {
    expect(() => assertLiveMethod('GET')).not.toThrow();
  });

  it('should refuse a write method', () => {
    expect(() => assertLiveMethod('POST')).toThrow(/POST/);
    expect(() => assertLiveMethod('DELETE')).toThrow(/DELETE/);
  });

  it('should keep the snapshot script on reads', () => {
    const source = fs.readFileSync(path.join(__dirname, 'snapshot.ts'), 'utf8');
    expect(source.includes('method: \'POST\'')).toBe(false);
    expect(source.includes('method: \'PUT\'')).toBe(false);
    expect(source.includes('method: \'PATCH\'')).toBe(false);
    expect(source.includes('method: \'DELETE\'')).toBe(false);
    expect(source.includes('firebase-admin')).toBe(false);
    expect(source.includes('createUser')).toBe(false);
    expect(source.includes('.save(')).toBe(false);
    expect(source.includes('LIVE_READ_METHOD = \'GET\'')).toBe(true);
  });
});

describe('credential env', () => {
  const savedCredentials = process.env['GOOGLE_APPLICATION_CREDENTIALS'];
  const savedToken = process.env['FIREBASE_TOKEN'];

  afterEach(() => {
    restoreEnv('GOOGLE_APPLICATION_CREDENTIALS', savedCredentials);
    restoreEnv('FIREBASE_TOKEN', savedToken);
  });

  it('should remove credential variables from this process', () => {
    process.env['GOOGLE_APPLICATION_CREDENTIALS'] = 'C:\\secrets.json';
    process.env['FIREBASE_TOKEN'] = 'token';
    clearCredentialEnv();
    expect(process.env['GOOGLE_APPLICATION_CREDENTIALS']).toBeUndefined();
    expect(process.env['FIREBASE_TOKEN']).toBeUndefined();
  });
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
