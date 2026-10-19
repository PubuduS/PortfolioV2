import fs from 'node:fs/promises';
import path from 'node:path';

import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import {
  GeoPoint,
  getFirestore,
  Timestamp,
  type Firestore,
} from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

import {
  BASELINE_ROOT,
  EMULATOR_BUCKET,
  EMULATOR_PORTS,
  EMULATOR_TARGET,
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_PASSWORD,
} from './constants';
import {
  assertEmulatorTarget,
  clearCredentialEnv,
  isDirectScript,
} from './guards';
import { rewriteSeedValue } from './sanitize';
import {
  type BaselineDocument,
  type BaselineManifest,
  type DecodeCodec,
  decodeTypedValue,
  parseBaselineDocuments,
  parseManifest,
} from './typed-json';

/** Admin clients pointed at the local emulators. */
export interface EmulatorClients {
  readonly app: App;
  readonly firestore: Firestore;
  readonly auth: Auth;
  readonly storage: Storage;
}

let clients: EmulatorClients | null = null;

/**
 * Opens firebase-admin against the demo emulators.
 * Callers must already be inside a process that passed the emulator guard.
 *
 * @returns Cached emulator clients.
 */
export function connectEmulators(): EmulatorClients {
  assertEmulatorTarget(EMULATOR_TARGET);
  clearCredentialEnv();
  process.env['FIRESTORE_EMULATOR_HOST'] = hostPort('firestore');
  process.env['FIREBASE_AUTH_EMULATOR_HOST'] = hostPort('auth');
  process.env['FIREBASE_STORAGE_EMULATOR_HOST'] = hostPort('storage');
  if (clients) {
    return clients;
  }
  const app = getApps()[0] ?? initializeApp({
    projectId: EMULATOR_TARGET.projectId,
    storageBucket: EMULATOR_BUCKET,
  });
  clients = {
    app,
    firestore: getFirestore(app),
    auth: getAuth(app),
    storage: getStorage(app),
  };
  return clients;
}

/**
 * Writes the committed baseline into the running emulators.
 * A second run overwrites the same documents, objects, and admin user.
 */
export async function seedBaseline(): Promise<void> {
  assertEmulatorTarget(EMULATOR_TARGET);
  clearCredentialEnv();
  const { firestore, auth, storage } = connectEmulators();
  const manifest = await readManifest();
  const codec = codecFor(firestore);
  let docCount = 0;
  for (const collection of Object.keys(manifest.firestore).sort()) {
    const documents = await readCollection(collection);
    for (const document of documents) {
      await writeDocument(firestore, codec, collection, document);
      docCount += 1;
    }
  }
  const bucket = storage.bucket(EMULATOR_BUCKET);
  for (const objectPath of Object.keys(manifest.storage).sort()) {
    const entry = manifest.storage[objectPath];
    if (!entry) {
      throw new Error(`missing storage manifest entry ${objectPath}`);
    }
    const bytes = await fs.readFile(storagePath(objectPath));
    await bucket.file(objectPath).save(bytes, {
      contentType: entry.contentType,
      resumable: false,
      validation: false,
      metadata: { contentType: entry.contentType },
    });
  }
  await ensureAdmin(auth);
  process.stdout.write(`seeded ${docCount} docs and ${Object.keys(manifest.storage).length} objects\n`);
}

async function writeDocument(
  firestore: Firestore,
  codec: DecodeCodec,
  collection: string,
  document: BaselineDocument,
): Promise<void> {
  if (document.data.type !== 'map') {
    throw new Error(`${collection}/${document.id} is not a map`);
  }
  const decoded = rewriteSeedValue(decodeTypedValue(document.data, codec));
  if (!isPlainRecord(decoded)) {
    throw new Error(`${collection}/${document.id} did not decode to an object`);
  }
  await firestore.collection(collection).doc(document.id).set(decoded);
}

async function ensureAdmin(auth: Auth): Promise<void> {
  try {
    const user = await auth.getUserByEmail(TEST_ADMIN_EMAIL);
    await auth.updateUser(user.uid, {
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
      emailVerified: true,
    });
  } catch (error) {
    if (errorCode(error) !== 'auth/user-not-found') {
      throw error;
    }
    await auth.createUser({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
      emailVerified: true,
    });
  }
}

function codecFor(firestore: Firestore): DecodeCodec {
  return {
    timestamp: (seconds, nanoseconds) => new Timestamp(seconds, nanoseconds),
    geopoint: (latitude, longitude) => new GeoPoint(latitude, longitude),
    bytes: (base64) => Buffer.from(base64, 'base64'),
    reference: (referencePath) => firestore.doc(referencePath),
  };
}

async function readManifest(): Promise<BaselineManifest> {
  return parseManifest(await readJson(path.join(BASELINE_ROOT, 'manifest.json')));
}

async function readCollection(collection: string): Promise<BaselineDocument[]> {
  return parseBaselineDocuments(await readJson(path.join(BASELINE_ROOT, 'firestore', `${collection}.json`)));
}

async function readJson(filePath: string): Promise<unknown> {
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text) as unknown;
}

function storagePath(objectPath: string): string {
  if (objectPath.startsWith('/') || objectPath.split('/').includes('..')) {
    throw new Error(`refusing storage path ${objectPath}`);
  }
  return path.join(BASELINE_ROOT, 'storage', ...objectPath.split('/'));
}

function hostPort(name: keyof typeof EMULATOR_PORTS): string {
  return `${EMULATOR_TARGET.hosts[name]}:${EMULATOR_PORTS[name]}`;
}

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String(error.code);
  }
  return '';
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(error: unknown): never {
  const message = error instanceof Error
    ? error.stack ?? error.message
    : 'seed failed';
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

if (isDirectScript('seed.ts')) {
  seedBaseline().catch((error: unknown) => fail(error));
}
