import {
  AUTH_TARGET_STORAGE_KEY,
  FIREBASE_AUTH_DATABASE,
  FIREBASE_PERSISTENCE_PREFIX,
} from './auth-target';
import {
  deleteIndexedDatabase,
  isolateAuthPersistence,
  type AuthPersistencePorts,
} from './auth-persistence';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    clear(): void {
      values.clear();
    },
    getItem(key: string): string | null {
      return values.get(key) ?? null;
    },
    key(index: number): string | null {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string): void {
      values.delete(key);
    },
    setItem(key: string, value: string): void {
      values.set(key, value);
    },
  };
}

function ports(
  local: Storage,
  session: Storage,
  deleted: boolean,
): AuthPersistencePorts & { deleteDatabase: jest.Mock } {
  return {
    local,
    session,
    deleteDatabase: jest.fn().mockResolvedValue(deleted),
  };
}

describe('auth persistence', () => {
  describe('when the stored backend matches this build', () => {
    it('should leave the saved user in place', async () => {
      const local = memoryStorage({
        [AUTH_TARGET_STORAGE_KEY]: 'emulator',
        [`${FIREBASE_PERSISTENCE_PREFIX}authUser`]: 'emulator-user',
      });
      const session = memoryStorage({
        [`${FIREBASE_PERSISTENCE_PREFIX}authUser`]: 'emulator-user',
      });
      const storage = ports(local, session, true);

      await isolateAuthPersistence('emulator', storage);

      expect(storage.deleteDatabase).not.toHaveBeenCalled();
      expect(local.getItem(`${FIREBASE_PERSISTENCE_PREFIX}authUser`)).toBe('emulator-user');
      expect(session.getItem(`${FIREBASE_PERSISTENCE_PREFIX}authUser`)).toBe('emulator-user');
    });
  });

  describe('when the stored backend is the other one', () => {
    it('should wipe firebase users and record the current backend', async () => {
      const local = memoryStorage({
        [AUTH_TARGET_STORAGE_KEY]: 'emulator',
        [`${FIREBASE_PERSISTENCE_PREFIX}authUser`]: 'emulator-user',
        stateBanks: '{"isAdmin":true}',
      });
      const session = memoryStorage({
        [`${FIREBASE_PERSISTENCE_PREFIX}authUser`]: 'emulator-user',
        unrelated: 'keep',
      });
      const storage = ports(local, session, true);

      await isolateAuthPersistence('live', storage);

      expect(storage.deleteDatabase).toHaveBeenCalledWith(FIREBASE_AUTH_DATABASE);
      expect(local.getItem(`${FIREBASE_PERSISTENCE_PREFIX}authUser`)).toBeNull();
      expect(session.getItem(`${FIREBASE_PERSISTENCE_PREFIX}authUser`)).toBeNull();
      expect(local.getItem('stateBanks')).toBe('{"isAdmin":true}');
      expect(session.getItem('unrelated')).toBe('keep');
      expect(local.getItem(AUTH_TARGET_STORAGE_KEY)).toBe('live');
    });
  });

  describe('when no backend has been recorded', () => {
    it('should treat the saved user as untrusted', async () => {
      const local = memoryStorage({
        [`${FIREBASE_PERSISTENCE_PREFIX}authUser`]: 'legacy-user',
      });
      const session = memoryStorage();
      const storage = ports(local, session, true);

      await isolateAuthPersistence('live', storage);

      expect(local.getItem(`${FIREBASE_PERSISTENCE_PREFIX}authUser`)).toBeNull();
      expect(local.getItem(AUTH_TARGET_STORAGE_KEY)).toBe('live');
    });
  });

  describe('when indexedDB cannot be deleted', () => {
    it('should keep the old marker so the next load tries again', async () => {
      const local = memoryStorage({
        [AUTH_TARGET_STORAGE_KEY]: 'emulator',
      });
      const storage = ports(local, memoryStorage(), false);

      await isolateAuthPersistence('live', storage);

      expect(local.getItem(AUTH_TARGET_STORAGE_KEY)).toBe('emulator');
    });
  });

  describe('deleteIndexedDatabase', () => {
    it('should report success when the database delete completes', async () => {
      const request = {
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null,
        onblocked: null,
      };
      const factory = {
        deleteDatabase: jest.fn(() => request),
      } as unknown as IDBFactory;

      const pending = deleteIndexedDatabase(factory, FIREBASE_AUTH_DATABASE);
      request.onsuccess?.(new Event('success'));

      await expect(pending).resolves.toBe(true);
      expect(factory.deleteDatabase).toHaveBeenCalledWith(FIREBASE_AUTH_DATABASE);
    });

    it('should report failure when the delete is blocked', async () => {
      const request = {
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onblocked: null as ((event: Event) => void) | null,
      };
      const factory = {
        deleteDatabase: jest.fn(() => request),
      } as unknown as IDBFactory;

      const pending = deleteIndexedDatabase(factory, FIREBASE_AUTH_DATABASE);
      request.onblocked?.(new Event('blocked'));

      await expect(pending).resolves.toBe(false);
    });

    it('should report failure when indexedDB is missing', async () => {
      await expect(deleteIndexedDatabase(undefined, FIREBASE_AUTH_DATABASE)).resolves.toBe(false);
    });
  });
});
