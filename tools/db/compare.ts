import {
  type BaselineManifest,
  type FirestoreManifestEntry,
  type StorageManifestEntry,
} from './typed-json';

/** Emulator state reduced to the hashes verify compares. */
export interface ObservedState {
  readonly firestore: Readonly<Record<string, FirestoreManifestEntry>>;
  readonly storage: Readonly<Record<string, StorageManifestEntry>>;
  readonly hasAdminUser: boolean;
}

/** Firestore trees written by the contact-mail function, not by the content baseline. */
const OPERATIONAL_COLLECTIONS: ReadonlySet<string> = new Set(['contact-mail-guard']);

/**
 * Lists differences between the manifest and an observed emulator or baseline.
 * An empty list means the observed state matches.
 * @param manifest Expected snapshot.
 * @param observed Measured state.
 * @returns Human-readable problems.
 */
export function compareBaseline(manifest: BaselineManifest, observed: ObservedState): string[] {
  const problems: string[] = [];
  Object.keys(manifest.firestore).forEach((name) => {
    const expected = manifest.firestore[name];
    const actual = observed.firestore[name];
    if (!expected || !actual) {
      problems.push(`missing firestore collection ${name}`);
      return;
    }
    if (actual.docCount !== expected.docCount) {
      problems.push(`firestore collection ${name} doc count is ${actual.docCount} not ${expected.docCount}`);
    }
    if (actual.sha256 !== expected.sha256) {
      problems.push(`firestore collection ${name} hash mismatch`);
    }
  });
  Object.keys(observed.firestore).forEach((name) => {
    if (!manifest.firestore[name] && !OPERATIONAL_COLLECTIONS.has(name)) {
      problems.push(`extra firestore collection ${name}`);
    }
  });
  Object.keys(manifest.storage).forEach((name) => {
    const expected = manifest.storage[name];
    const actual = observed.storage[name];
    if (!expected || !actual) {
      problems.push(`missing storage object ${name}`);
      return;
    }
    if (actual.sha256 !== expected.sha256) {
      problems.push(`storage object ${name} hash mismatch`);
    }
    if (actual.bytes !== expected.bytes) {
      problems.push(`storage object ${name} byte count mismatch`);
    }
    if (actual.contentType !== expected.contentType) {
      problems.push(`storage object ${name} content type mismatch`);
    }
  });
  Object.keys(observed.storage).forEach((name) => {
    if (!manifest.storage[name]) {
      problems.push(`extra storage object ${name}`);
    }
  });
  if (!observed.hasAdminUser) {
    problems.push('missing admin user');
  }
  return problems;
}
