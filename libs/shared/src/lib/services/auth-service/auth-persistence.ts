import {
  AUTH_TARGET_STORAGE_KEY,
  AuthTarget,
  FIREBASE_AUTH_DATABASE,
  FIREBASE_PERSISTENCE_PREFIX,
} from './auth-target';

/** Browser stores that can hold a Firebase Auth user. */
export interface AuthPersistencePorts {
  local: Storage;
  session: Storage;
  deleteDatabase: (name: string) => Promise<boolean>;
}

/**
 * Removes every key that belongs to the Firebase Auth SDK.
 * @param storage Web Storage bucket.
 * @param prefix Key prefix to remove.
 */
export function removeKeysWithPrefix(storage: Storage, prefix: string): void {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(prefix)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => storage.removeItem(key));
}

/**
 * Deletes an IndexedDB database.
 * @param factory Browser IndexedDB factory, when one exists.
 * @param name Database name.
 * @returns True when the database is gone.
 */
export function deleteIndexedDatabase(
  factory: IDBFactory | undefined,
  name: string,
): Promise<boolean> {
  if (!factory) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = factory.deleteDatabase(name);
    } catch {
      resolve(false);
      return;
    }
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
    request.onblocked = () => resolve(false);
  });
}

/**
 * Ports backed by the current window.
 * @returns Local storage, session storage, and IndexedDB deletion.
 */
export function browserAuthPersistencePorts(): AuthPersistencePorts {
  return {
    local: window.localStorage,
    session: window.sessionStorage,
    deleteDatabase: (name) => deleteIndexedDatabase(window.indexedDB, name),
  };
}

/**
 * Drops persisted Auth users when this page load uses a different backend.
 * A matching marker is left untouched so a reload of the same build keeps its session.
 * @param target Auth backend for this build.
 * @param ports Browser storage. Defaults to window storage.
 * @returns Resolves once the marker matches this backend.
 */
export async function isolateAuthPersistence(
  target: AuthTarget,
  ports: AuthPersistencePorts = browserAuthPersistencePorts(),
): Promise<void> {
  const stored = ports.local.getItem(AUTH_TARGET_STORAGE_KEY);
  if (stored === target) {
    return;
  }
  removeKeysWithPrefix(ports.local, FIREBASE_PERSISTENCE_PREFIX);
  removeKeysWithPrefix(ports.session, FIREBASE_PERSISTENCE_PREFIX);
  const deleted = await ports.deleteDatabase(FIREBASE_AUTH_DATABASE);
  if (!deleted) {
    return;
  }
  ports.local.setItem(AUTH_TARGET_STORAGE_KEY, target);
}
