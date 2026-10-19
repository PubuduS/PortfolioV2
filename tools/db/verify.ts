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
import { compareBaseline, type ObservedState } from './compare';
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

async function observeBaselineFiles(manifest: BaselineManifest): Promise<ObservedState> {
  const firestore: Record<string, FirestoreManifestEntry> = {};
  for (const collection of Object.keys(manifest.firestore)) {
    const documents = parseBaselineDocuments(
      await readJson(path.join(BASELINE_ROOT, 'firestore', `${collection}.json`)),
    );
    firestore[collection] = {
      docCount: documents.length,
      sha256: canonicalCollectionHash(documents),
    };
  }
  const storage: Record<string, StorageManifestEntry> = {};
  for (const objectPath of Object.keys(manifest.storage)) {
    const entry = manifest.storage[objectPath];
    const bytes = await fs.readFile(storageFile(objectPath));
    storage[objectPath] = {
      sha256: sha256Bytes(bytes),
      bytes: bytes.length,
      contentType: entry?.contentType ?? '',
    };
  }
  return { firestore, storage, hasAdminUser: true };
}

async function observeEmulator(): Promise<ObservedState> {
  // One Firestore read adds an error listener on a shared stream. Eleven collections cross the default of 10.
  EventEmitter.defaultMaxListeners = 32;
  const { firestore, auth, storage } = connectEmulators();
  const collections = await firestore.listCollections();
  const observed: Record<string, FirestoreManifestEntry> = {};
  for (const collection of collections) {
    const snapshot = await collection.get();
    const documents = snapshot.docs.map((doc) => encodeEmulatorDocument(doc.id, doc.data()));
    observed[collection.id] = {
      docCount: documents.length,
      sha256: canonicalCollectionHash(documents),
    };
  }
  const bucket = storage.bucket(EMULATOR_BUCKET);
  const [files] = await bucket.getFiles();
  const storageState: Record<string, StorageManifestEntry> = {};
  for (const file of files) {
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
  }
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

function encodeEmulatorDocument(id: string, data: Record<string, unknown>): BaselineDocument {
  const encoded = normalizeEmulatorUrls(encodeTypedValue(data, 'admin'));
  if (encoded.type !== 'map') {
    throw new Error(`${id} did not encode to a map`);
  }
  return { id, data: encoded };
}

async function readJson(filePath: string): Promise<unknown> {
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text) as unknown;
}

function storageFile(objectPath: string): string {
  if (objectPath.startsWith('/') || objectPath.split('/').includes('..')) {
    throw new Error(`refusing storage path ${objectPath}`);
  }
  return path.join(BASELINE_ROOT, 'storage', ...objectPath.split('/'));
}

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String(error.code);
  }
  return '';
}

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
