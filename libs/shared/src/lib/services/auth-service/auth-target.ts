import { InjectionToken } from '@angular/core';

/** Which Firebase Auth backend this build is allowed to trust. */
export type AuthTarget = 'emulator' | 'live';

/** localStorage key that records the backend of the last page load. */
export const AUTH_TARGET_STORAGE_KEY = 'portfolio-v2.auth-target';

/** Idle time before an admin session is signed out. */
export const ADMIN_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

/** How often an open admin session checks whether it has gone idle. */
export const ADMIN_IDLE_CHECK_MS = 15 * 1000;

/** Firebase Auth persistence prefix shared by localStorage, sessionStorage, and IndexedDB keys. */
export const FIREBASE_PERSISTENCE_PREFIX = 'firebase:';

/** IndexedDB database where the Auth SDK stores long-lived users. */
export const FIREBASE_AUTH_DATABASE = 'firebaseLocalStorageDb';

/** Password provider required before a user is treated as admin. */
export const PASSWORD_SIGN_IN_PROVIDER = 'password';

/**
 * Build target for the running app.
 * @param usesEmulators True when this build connects to the local Auth emulator.
 * @returns The only auth backend this build may trust.
 */
export function resolveAuthTarget(usesEmulators: boolean): AuthTarget {
  if (usesEmulators) {
    return 'emulator';
  }
  return 'live';
}

/**
 * Firebase app name.
 * Persistence keys include it, so the two backends cannot read each other's users.
 * @param target Auth backend for this build.
 * @returns App name passed to `initializeApp`.
 */
export function authAppName(target: AuthTarget): string {
  if (target === 'emulator') {
    return 'portfolio-emulator';
  }
  return 'portfolio-live';
}

/**
 * True when the signed-in user came from the backend this build is connected to.
 * @param target Auth backend for this build.
 * @param emulatorConfig Emulator settings, or null for production Auth.
 * @returns True when the connection and the build agree.
 */
export function sessionMatchesAuthTarget(
  target: AuthTarget,
  emulatorConfig: object | null,
): boolean {
  const connectedToEmulator = emulatorConfig !== null;
  if (target === 'emulator') {
    return connectedToEmulator;
  }
  return !connectedToEmulator;
}

/** Injected auth backend for this build. */
export const AUTH_TARGET = new InjectionToken<AuthTarget>('AUTH_TARGET');
