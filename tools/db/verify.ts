import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  BASELINE_ROOT,
  EMULATOR_BUCKET,
  EMULATOR_TARGET,
  TEST_ADMIN_EMAIL,
} from './constants';
import {
  assertEmulatorTarget,
  clearCredentialEnv,
  isDirectScript,
} from './guards';
import {
compareBaseline,
type ObservedState
} from './compare'
import { normalizeEmulatorUrls } from './sanitize';
import { connectEmulators } from './seed';
import {
  type BaselineDocument,
  type BaselineManifest,
  type FirestoreManifestEntry,
  type StorageManifestEntry,
  canonicalCollectionHash,
  encodeTypedValue,
  parseBaselineDocuments,
  parseManifest,
  sha256Bytes,
} from './typed-json';

export { compareBaseline, type ObservedState };

/**
 * Reads a JSON file.
 * @param filePath file path
 * @returns JSON content
 */
async function readJson(filePath: string): Promise<unknown> {
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text) as unknown;
}

/**
 * Gets the storage file path.
 * @param objectPath object path
 * @returns storage file path
 */
function storageFile(objectPath: string): string {
  if (objectPath.startsWith('/') || objectPath.split('/').includes('..')) {
    throw new Error(`refusing storage path ${objectPath}`);
  }
  return path.join(BASELINE_ROOT, 'storage', ...objectPath.split('/'));
}

/**
 * Observes the baseline files.
 * @param manifest manifest
 * @returns observed state
 */
async function observeBaselineFiles(manifest: BaselineManifest): Promise<ObservedState> {
  const firestore: Record<string, FirestoreManifestEntry> = {};
  const collections = Object.keys(manifest.firestore);
  await collections.reduce(async (previous, collection) => {
    await previous;
    const documents = parseBaselineDocuments(
      await readJson(path.join(BASELINE_ROOT, 'firestore', `${collection}.json`)),
    );
    firestore[collection] = {
      docCount: documents.length,
      sha256: canonicalCollectionHash(documents),
    };
  }, Promise.resolve());
  const storage: Record<string, StorageManifestEntry> = {};
  const objectPaths = Object.keys(manifest.storage);
  await objectPaths.reduce(async (previous, objectPath) => {
    await previous;
    const entry = manifest.storage[objectPath];
    const bytes = await fs.readFile(storageFile(objectPath));
    storage[objectPath] = {
      sha256: sha256Bytes(bytes),
      bytes: bytes.length,
      contentType: entry?.contentType ?? '',
    };
  }, Promise.resolve());
  return { firestore, storage, hasAdminUser: true };
}

/**
 * Encodes an emulator document.
 * @param id document id
 * @param data document data
 * @returns encoded document
 */
function encodeEmulatorDocument(id: string, data: Record<string, unknown>): BaselineDocument {
  const encoded = normalizeEmulatorUrls(encodeTypedValue(data, 'admin'));
  if (encoded.type !== 'map') {
    throw new Error(`${id} did not encode to a map`);
  }
  return { id, data: encoded };
}

/**
 * Gets the error code.
 * @param error error
 * @returns error code
 */
function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String(error.code);
  }
  return '';
}

/**
 * Observes the emulator.
 * @returns observed state
 */
async function observeEmulator(): Promise<ObservedState> {
  // One Firestore read adds an error listener on a shared stream.
  // Eleven collections cross the default of 10.
  EventEmitter.defaultMaxListeners = 32;
  const { firestore, auth, storage } = connectEmulators();
  const collections = await firestore.listCollections();
  const observed: Record<string, FirestoreManifestEntry> = {};
  await collections.reduce(async (previous, collection) => {
    await previous;
    const snapshot = await collection.get();
    const documents = snapshot.docs.map((doc) => encodeEmulatorDocument(doc.id, doc.data()));
    observed[collection.id] = {
      docCount: documents.length,
      sha256: canonicalCollectionHash(documents),
    };
  }, Promise.resolve());
  const bucket = storage.bucket(EMULATOR_BUCKET);
  const [files] = await bucket.getFiles();
  const storageState: Record<string, StorageManifestEntry> = {};
  await files.reduce(async (previous, file) => {
    await previous;
    const [bytes] = await file.download();
    const [metadata] = await file.getMetadata();
    const contentType = typeof metadata.contentType === 'string'
      ? metadata.contentType
      : '';
    storageState[file.name] = {
      sha256: sha256Bytes(bytes),
      bytes: bytes.length,
      contentType,
    };
  }, Promise.resolve());
  let hasAdminUser = false;
  try {
    await auth.getUserByEmail(TEST_ADMIN_EMAIL);
    hasAdminUser = true;
  } catch (error) {
    if (errorCode(error) !== 'auth/user-not-found') {
      throw error;
    }
  }
  return { firestore: observed, storage: storageState, hasAdminUser };
}

/**
 * Compares the running emulators to the manifest and to the files in db/baseline.
 */
async function main(): Promise<void> {
  assertEmulatorTarget(EMULATOR_TARGET);
  clearCredentialEnv();
  const manifest = parseManifest(await readJson(path.join(BASELINE_ROOT, 'manifest.json')));
  const fromFiles = await observeBaselineFiles(manifest);
  const fromEmulator = await observeEmulator();
  const problems = [
    ...compareBaseline(manifest, fromFiles),
    ...compareBaseline(manifest, fromEmulator),
  ];
  if (problems.length > 0) {
    process.stderr.write(`${problems.join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write('baseline matches\n');
}

/**
 * Fails the verification.
 * @param error error
 */
function fail(error: unknown): never {
  const message = error instanceof Error
    ? error.stack ?? error.message
    : 'verify failed';
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

if (isDirectScript('verify.ts')) {
  main().catch((error: unknown) => fail(error));
}
