import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';

import {
  BASELINE_ROOT,
  MAX_BASELINE_FILE_BYTES,
  REPO_ROOT,
  SANITIZER_VERSION,
} from './constants';
import {
  assertLiveMethod,
  assertSnapshotHasNoEmulatorHost,
  isDirectScript,
} from './guards';
import {
  assertNoResidualPii,
  assertWithinBaselineLimit,
  placeholderFor,
  sanitizeDocuments,
  storageReplacement,
} from './sanitize';
import {
  type BaselineDocument,
  type BaselineManifest,
  canonicalCollectionHash,
  encodeTypedValue,
  sha256Bytes,
} from './typed-json';

const LIVE_PROJECT_ID = 'portfolio-c9b8e';
const LIVE_BUCKET = 'portfolio-c9b8e.firebasestorage.app';
const LIVE_READ_METHOD = 'GET';
const MAX_PAGES = 100;

const LIVE_COLLECTIONS = [
  'about-me-section',
  'certification-section',
  'education-section',
  'experience-section',
  'project-icon-section',
  'project-data-section',
  'featured-project-section',
  'publication-section',
  'publication-details-section',
  'skills-section',
  'social-infor-section',
] as const;

interface ListedObject {
  readonly name: string;
  readonly contentType: string;
  readonly size: number;
}

interface StorageFile {
  readonly objectPath: string;
  readonly bytes: Buffer;
  readonly contentType: string;
}

/**
 * Reads live Firestore and Storage, sanitizes them, and writes db/baseline.
 * Fails closed and leaves the previous baseline in place when sanitizing rejects the data.
 */
async function main(): Promise<void> {
  assertSnapshotHasNoEmulatorHost(process.env);
  const firestore = await readCollections();
  const storage = await readStorage();
  assertNoResidualPii(firestore);
  for (const file of storage) {
    assertWithinBaselineLimit(file.bytes.length, file.objectPath);
  }
  const manifest = buildManifest(firestore, storage);
  await publishBaseline(manifest, firestore, storage);
  writeLine(summarize(firestore, storage));
}

async function readCollections(): Promise<Record<string, BaselineDocument[]>> {
  const collections: Record<string, BaselineDocument[]> = {};
  for (const collection of LIVE_COLLECTIONS) {
    const documents = sanitizeDocuments(collection, await listDocuments(collection));
    collections[collection] = documents;
    writeLine(`firestore ${collection} ${documents.length}`);
  }
  return collections;
}

async function listDocuments(collection: string): Promise<BaselineDocument[]> {
  const documents: BaselineDocument[] = [];
  let pageToken: string | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = firestoreCollectionUrl(collection, pageToken);
    const body = await liveGetJson(url);
    const record = expectRecord(body, collection);
    const rawDocuments = record['documents'] ?? [];
    if (!Array.isArray(rawDocuments)) {
      throw new Error(`${collection} documents field is not an array`);
    }
    for (const item of rawDocuments) {
      documents.push(encodeDocument(item));
    }
    const next = record['nextPageToken'];
    pageToken = typeof next === 'string' && next.length > 0
      ? next
      : null;
    if (!pageToken) {
      return documents.sort((left, right) => left.id.localeCompare(right.id));
    }
  }
  throw new Error(`${collection} exceeded ${MAX_PAGES} pages`);
}

function encodeDocument(value: unknown): BaselineDocument {
  const record = expectRecord(value, 'document');
  const name = expectString(record['name'], 'document.name');
  const fields = record['fields'] ?? {};
  return {
    id: documentId(name),
    data: encodeTypedValue({ mapValue: { fields } }, 'rest'),
  };
}

async function readStorage(): Promise<StorageFile[]> {
  const listed = await listObjects();
  const files: StorageFile[] = [];
  for (const item of listed) {
    const rule = storageReplacement(item.name);
    if (rule) {
      const placeholder = placeholderFor(rule);
      files.push({
        objectPath: item.name,
        bytes: placeholder.bytes,
        contentType: placeholder.contentType,
      });
      writeLine(`storage placeholder ${item.name}`);
    } else if (item.size > MAX_BASELINE_FILE_BYTES) {
      throw new Error(`${item.name} is ${item.size} bytes and has no placeholder rule`);
    } else {
      const bytes = await downloadObject(item.name);
      assertWithinBaselineLimit(bytes.length, item.name);
      files.push({
        objectPath: item.name,
        bytes,
        contentType: item.contentType || 'application/octet-stream',
      });
    }
  }
  return files.sort((left, right) => left.objectPath.localeCompare(right.objectPath));
}

async function listObjects(): Promise<ListedObject[]> {
  const objects: ListedObject[] = [];
  let pageToken: string | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = storageListUrl(pageToken);
    const body = await liveGetJson(url);
    const record = expectRecord(body, 'storage list');
    const items = record['items'] ?? [];
    if (!Array.isArray(items)) {
      throw new Error('storage items field is not an array');
    }
    for (const item of items) {
      objects.push(parseListedObject(item));
    }
    const next = record['nextPageToken'];
    pageToken = typeof next === 'string' && next.length > 0
      ? next
      : null;
    if (!pageToken) {
      return objects;
    }
  }
  throw new Error(`storage list exceeded ${MAX_PAGES} pages`);
}

function parseListedObject(value: unknown): ListedObject {
  const record = expectRecord(value, 'storage item');
  const name = expectString(record['name'], 'storage item name');
  const size = Number(record['size'] ?? 0);
  if (!Number.isFinite(size)) {
    throw new Error(`storage item ${name} has a bad size`);
  }
  const contentType = typeof record['contentType'] === 'string'
    ? record['contentType']
    : '';
  return { name, contentType, size };
}

async function downloadObject(objectPath: string): Promise<Buffer> {
  const response = await liveFetch(storageDownloadUrl(objectPath));
  const lengthHeader = headerValue(response.headers, 'content-length');
  if (lengthHeader && Number(lengthHeader) > MAX_BASELINE_FILE_BYTES) {
    throw new Error(`refusing download larger than 1 MiB for ${objectPath}`);
  }
  assertWithinBaselineLimit(response.body.length, objectPath);
  return response.body;
}

let cachedApiKey: string | null = null;
let apiKeyLoaded = false;

async function liveGetJson(url: URL): Promise<unknown> {
  const response = await liveFetch(url);
  return JSON.parse(response.body.toString('utf8')) as unknown;
}

interface LiveResponse {
  readonly status: number;
  readonly headers: http.IncomingHttpHeaders;
  readonly body: Buffer;
}

async function liveFetch(url: URL, redirects = 0): Promise<LiveResponse> {
  assertLiveMethod(LIVE_READ_METHOD);
  const response = await liveRequest(url);
  if ((response.status === 401 || response.status === 403) && !apiKeyLoaded) {
    cachedApiKey = readLiveApiKey();
    apiKeyLoaded = true;
    url.searchParams.set('key', cachedApiKey);
    return liveFetch(url, redirects);
  }
  if (response.status >= 300 && response.status < 400 && redirects < 5) {
    const location = headerValue(response.headers, 'location');
    if (!location) {
      throw new Error(`live read redirect missing location for ${url.origin}${url.pathname}`);
    }
    return liveFetch(new URL(location, url), redirects + 1);
  }
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`live read failed with status ${response.status} for ${url.origin}${url.pathname}`);
  }
  return response;
}

function liveRequest(url: URL): Promise<LiveResponse> {
  const transport = url.protocol === 'https:'
    ? https
    : http;
  return new Promise((resolve, reject) => {
    const req = transport.request(url, { method: LIVE_READ_METHOD, timeout: 60_000 }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body: concatChunks(chunks),
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`live read timed out for ${url.origin}${url.pathname}`));
    });
    req.end();
  });
}

function concatChunks(chunks: readonly Buffer[]): Buffer {
  return Buffer.from(chunks.map((chunk) => chunk.toString('latin1')).join(''), 'latin1');
}

function headerValue(headers: http.IncomingHttpHeaders, name: string): string | null {
  const value = headers[name];
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return null;
}

function readLiveApiKey(): string {
  const filePath = path.join(REPO_ROOT, 'apps', 'portfolio-v2', 'src', 'environments', 'environment.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/apiKey:\s*['"]([^'"]+)['"]/);
  const apiKey = match?.[1];
  if (!apiKey) {
    throw new Error('live read was rejected and environment.ts has no apiKey');
  }
  return apiKey;
}

function firestoreCollectionUrl(collection: string, pageToken: string | null): URL {
  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${LIVE_PROJECT_ID}/databases/(default)/documents/${collection}`,
  );
  url.searchParams.set('pageSize', '100');
  if (pageToken) {
    url.searchParams.set('pageToken', pageToken);
  }
  if (cachedApiKey) {
    url.searchParams.set('key', cachedApiKey);
  }
  return url;
}

function storageListUrl(pageToken: string | null): URL {
  const url = new URL(`https://firebasestorage.googleapis.com/v0/b/${LIVE_BUCKET}/o`);
  url.searchParams.set('maxResults', '1000');
  if (pageToken) {
    url.searchParams.set('pageToken', pageToken);
  }
  if (cachedApiKey) {
    url.searchParams.set('key', cachedApiKey);
  }
  return url;
}

function storageDownloadUrl(objectPath: string): URL {
  const url = new URL(
    `https://firebasestorage.googleapis.com/v0/b/${LIVE_BUCKET}/o/${encodeURIComponent(objectPath)}`,
  );
  url.searchParams.set('alt', 'media');
  if (cachedApiKey) {
    url.searchParams.set('key', cachedApiKey);
  }
  return url;
}

function buildManifest(
  firestore: Readonly<Record<string, readonly BaselineDocument[]>>,
  storage: readonly StorageFile[],
): BaselineManifest {
  const firestoreEntries: Record<string, BaselineManifest['firestore'][string]> = {};
  for (const name of Object.keys(firestore).sort()) {
    const documents = firestore[name] ?? [];
    firestoreEntries[name] = {
      docCount: documents.length,
      sha256: canonicalCollectionHash(documents),
    };
  }
  const storageEntries: Record<string, BaselineManifest['storage'][string]> = {};
  for (const file of storage) {
    storageEntries[file.objectPath] = {
      sha256: sha256Bytes(file.bytes),
      bytes: file.bytes.length,
      contentType: file.contentType,
    };
  }
  return {
    sourceProjectId: LIVE_PROJECT_ID,
    capturedAt: new Date().toISOString(),
    sanitizerVersion: SANITIZER_VERSION,
    firestore: firestoreEntries,
    storage: storageEntries,
  };
}

async function publishBaseline(
  manifest: BaselineManifest,
  firestore: Readonly<Record<string, readonly BaselineDocument[]>>,
  storage: readonly StorageFile[],
): Promise<void> {
  const staging = path.join(REPO_ROOT, 'db', 'baseline.staging');
  const previous = path.join(REPO_ROOT, 'db', 'baseline.previous');
  await fsp.rm(staging, { recursive: true, force: true });
  await writeTree(staging, manifest, firestore, storage);
  await fsp.rm(previous, { recursive: true, force: true });
  const hadBaseline = await exists(BASELINE_ROOT);
  if (hadBaseline) {
    await fsp.rename(BASELINE_ROOT, previous);
  }
  try {
    await fsp.rename(staging, BASELINE_ROOT);
  } catch (error) {
    if (hadBaseline) {
      await fsp.rename(previous, BASELINE_ROOT);
    }
    throw error;
  }
  await fsp.rm(previous, { recursive: true, force: true });
}

async function writeTree(
  root: string,
  manifest: BaselineManifest,
  firestore: Readonly<Record<string, readonly BaselineDocument[]>>,
  storage: readonly StorageFile[],
): Promise<void> {
  await fsp.mkdir(path.join(root, 'firestore'), { recursive: true });
  await writeJson(path.join(root, 'manifest.json'), manifest);
  for (const [collection, documents] of Object.entries(firestore)) {
    await writeJson(path.join(root, 'firestore', `${collection}.json`), documents);
  }
  for (const file of storage) {
    assertSafeObjectPath(file.objectPath);
    const target = path.join(root, 'storage', ...file.objectPath.split('/'));
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, file.bytes.toString('latin1'), 'latin1');
  }
}

function summarize(
  firestore: Readonly<Record<string, readonly BaselineDocument[]>>,
  storage: readonly StorageFile[],
): string {
  const docCount = Object.values(firestore).reduce((total, documents) => total + documents.length, 0);
  const storageBytes = storage.reduce((total, file) => total + file.bytes.length, 0);
  return [
    `firestore collections ${Object.keys(firestore).length}`,
    `firestore docs ${docCount}`,
    `storage objects ${storage.length}`,
    `storage bytes ${storageBytes}`,
  ].join('\n');
}

function documentId(name: string): string {
  const marker = '/documents/';
  const index = name.indexOf(marker);
  if (index < 0) {
    throw new Error('document name has no path');
  }
  const id = name.slice(index + marker.length).split('/').pop();
  if (!id) {
    throw new Error('document name has no id');
  }
  return id;
}

function assertSafeObjectPath(objectPath: string): void {
  if (objectPath.startsWith('/') || objectPath.split('/').includes('..')) {
    throw new Error(`refusing storage path ${objectPath}`);
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fsp.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fsp.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return value as Record<string, unknown>;
}

function expectString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} is not a string`);
  }
  return value;
}

function writeLine(message: string): void {
  process.stdout.write(`${message}\n`);
}

function fail(error: unknown): never {
  const message = error instanceof Error
    ? error.stack ?? error.message
    : 'snapshot failed';
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

if (isDirectScript('snapshot.ts')) {
  main().catch((error: unknown) => fail(error));
}
