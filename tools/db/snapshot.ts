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
  'document-versions',
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

interface LiveResponse {
  readonly status: number;
  readonly headers: http.IncomingHttpHeaders;
  readonly body: Buffer;
}

/** API key read from the app environment after a live read is rejected. */
let cachedApiKey: string | null = null;
/** True after the snapshot has tried to load the API key. */
let apiKeyLoaded = false;

/**
 * Builds the live Firestore list URL for one collection.
 * @param collection Collection id.
 * @param pageToken Page token, or null for the first page.
 * @returns Request URL.
 */
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

/**
 * Joins response chunks without changing their bytes.
 * @param chunks Response chunks.
 * @returns Combined buffer.
 */
function concatChunks(chunks: readonly Buffer[]): Buffer {
  return Buffer.from(chunks.map((chunk) => chunk.toString('latin1')).join(''), 'latin1');
}

/**
 * Sends one GET and buffers the response.
 * @param url Request URL.
 * @returns Status, headers, and body.
 */
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

/**
 * Reads the Firebase web API key from the app environment file.
 * @returns API key.
 */
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

/**
 * Reads one response header.
 * @param headers Response headers.
 * @param name Header name.
 * @returns Header value, or null.
 */
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

/**
 * GETs a live URL, following a few redirects and attaching an API key if rejected.
 * @param url Request URL.
 * @param redirects Redirects already followed.
 * @returns Status, headers, and body.
 */
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

/**
 * GETs a live URL and parses the JSON body.
 * @param url Request URL.
 * @returns Parsed JSON.
 */
async function liveGetJson(url: URL): Promise<unknown> {
  const response = await liveFetch(url);
  return JSON.parse(response.body.toString('utf8')) as unknown;
}

/**
 * Throws unless the value is a plain object.
 * @param value Value to test.
 * @param label Name used in the error.
 * @returns The object.
 */
function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return value as Record<string, unknown>;
}

/**
 * Throws unless the value is a non-empty string.
 * @param value Value to test.
 * @param label Name used in the error.
 * @returns The string.
 */
function expectString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} is not a string`);
  }
  return value;
}

/**
 * Reads the document id from a Firestore resource name.
 * @param name Resource name.
 * @returns Document id.
 */
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

/**
 * Turns one live Firestore REST document into baseline JSON.
 * @param value REST document.
 * @returns Baseline document.
 */
function encodeDocument(value: unknown): BaselineDocument {
  const record = expectRecord(value, 'document');
  const name = expectString(record['name'], 'document.name');
  const fields = record['fields'] ?? {};
  return {
    id: documentId(name),
    data: encodeTypedValue({ mapValue: { fields } }, 'rest'),
  };
}

/**
 * Lists every document in one live collection.
 * @param collection Collection id.
 * @returns Documents sorted by id.
 */
async function listDocuments(collection: string): Promise<BaselineDocument[]> {
  const documents: BaselineDocument[] = [];

  /**
   * Reads one Firestore page and follows the next page token.
   * @param page Zero-based page index.
   * @param pageToken Token from the previous page.
   * @returns Documents collected so far, sorted by id.
   */
  async function readPage(page: number, pageToken: string | null): Promise<BaselineDocument[]> {
    if (page >= MAX_PAGES) {
      throw new Error(`${collection} exceeded ${MAX_PAGES} pages`);
    }
    const url = firestoreCollectionUrl(collection, pageToken);
    const body = await liveGetJson(url);
    const record = expectRecord(body, collection);
    const rawDocuments = record['documents'] ?? [];
    if (!Array.isArray(rawDocuments)) {
      throw new Error(`${collection} documents field is not an array`);
    }
    rawDocuments.forEach((item) => {
      documents.push(encodeDocument(item));
    });
    const next = record['nextPageToken'];
    const nextToken = typeof next === 'string' && next.length > 0
      ? next
      : null;
    if (!nextToken) {
      return documents.sort((left, right) => left.id.localeCompare(right.id));
    }
    return readPage(page + 1, nextToken);
  }

  return readPage(0, null);
}

/**
 * Writes one line to stdout.
 * @param message Line without a newline.
 */
function writeLine(message: string): void {
  process.stdout.write(`${message}\n`);
}

/**
 * Downloads and sanitizes every live Firestore collection.
 * @returns Documents keyed by collection id.
 */
async function readCollections(): Promise<Record<string, BaselineDocument[]>> {
  const collections: Record<string, BaselineDocument[]> = {};
  await LIVE_COLLECTIONS.reduce(async (previous, collection) => {
    await previous;
    const documents = sanitizeDocuments(collection, await listDocuments(collection));
    collections[collection] = documents;
    writeLine(`firestore ${collection} ${documents.length}`);
  }, Promise.resolve());
  return collections;
}

/**
 * Builds the live Storage list URL.
 * @param pageToken Page token, or null for the first page.
 * @returns Request URL.
 */
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

/**
 * Reads one Storage list item.
 * @param value REST list item.
 * @returns Name, content type, and size.
 */
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

/**
 * Lists every object in the live Storage bucket.
 * @returns Object names, content types, and sizes.
 */
async function listObjects(): Promise<ListedObject[]> {
  const objects: ListedObject[] = [];

  /**
   * Reads one Storage list page and follows the next page token.
   * @param page Zero-based page index.
   * @param pageToken Token from the previous page.
   * @returns Objects collected so far.
   */
  async function readPage(page: number, pageToken: string | null): Promise<ListedObject[]> {
    if (page >= MAX_PAGES) {
      throw new Error(`storage list exceeded ${MAX_PAGES} pages`);
    }
    const url = storageListUrl(pageToken);
    const body = await liveGetJson(url);
    const record = expectRecord(body, 'storage list');
    const items = record['items'] ?? [];
    if (!Array.isArray(items)) {
      throw new Error('storage items field is not an array');
    }
    items.forEach((item) => {
      objects.push(parseListedObject(item));
    });
    const next = record['nextPageToken'];
    const nextToken = typeof next === 'string' && next.length > 0
      ? next
      : null;
    if (!nextToken) {
      return objects;
    }
    return readPage(page + 1, nextToken);
  }

  return readPage(0, null);
}

/**
 * Builds the live Storage download URL.
 * @param objectPath Object path.
 * @returns Request URL.
 */
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

/**
 * Downloads one live Storage object.
 * @param objectPath Object path.
 * @returns File bytes.
 */
async function downloadObject(objectPath: string): Promise<Buffer> {
  const response = await liveFetch(storageDownloadUrl(objectPath));
  const lengthHeader = headerValue(response.headers, 'content-length');
  if (lengthHeader && Number(lengthHeader) > MAX_BASELINE_FILE_BYTES) {
    throw new Error(`refusing download larger than 1 MiB for ${objectPath}`);
  }
  assertWithinBaselineLimit(response.body.length, objectPath);
  return response.body;
}

/**
 * Downloads live Storage objects, swapping placeholder files where required.
 * @returns Storage files sorted by path.
 */
async function readStorage(): Promise<StorageFile[]> {
  const listed = await listObjects();
  const files: StorageFile[] = [];
  await listed.reduce(async (previous, item) => {
    await previous;
    const rule = storageReplacement(item.name);
    if (rule) {
      const placeholder = placeholderFor(rule);
      files.push({
        objectPath: item.name,
        bytes: placeholder.bytes,
        contentType: placeholder.contentType,
      });
      writeLine(`storage placeholder ${item.name}`);
      return;
    }
    if (item.size > MAX_BASELINE_FILE_BYTES) {
      throw new Error(`${item.name} is ${item.size} bytes and has no placeholder rule`);
    }
    const bytes = await downloadObject(item.name);
    assertWithinBaselineLimit(bytes.length, item.name);
    files.push({
      objectPath: item.name,
      bytes,
      contentType: item.contentType || 'application/octet-stream',
    });
  }, Promise.resolve());
  return files.sort((left, right) => left.objectPath.localeCompare(right.objectPath));
}

/**
 * Builds the baseline manifest from sanitized documents and files.
 * @param firestore Documents keyed by collection.
 * @param storage Storage files.
 * @returns Manifest.
 */
function buildManifest(
  firestore: Readonly<Record<string, readonly BaselineDocument[]>>,
  storage: readonly StorageFile[],
): BaselineManifest {
  const firestoreEntries: Record<string, BaselineManifest['firestore'][string]> = {};
  Object.keys(firestore).sort().forEach((name) => {
    const documents = firestore[name] ?? [];
    firestoreEntries[name] = {
      docCount: documents.length,
      sha256: canonicalCollectionHash(documents),
    };
  });
  const storageEntries: Record<string, BaselineManifest['storage'][string]> = {};
  storage.forEach((file) => {
    storageEntries[file.objectPath] = {
      sha256: sha256Bytes(file.bytes),
      bytes: file.bytes.length,
      contentType: file.contentType,
    };
  });
  return {
    sourceProjectId: LIVE_PROJECT_ID,
    capturedAt: new Date().toISOString(),
    sanitizerVersion: SANITIZER_VERSION,
    firestore: firestoreEntries,
    storage: storageEntries,
  };
}

/**
 * Writes pretty JSON with a trailing newline.
 * @param filePath Destination path.
 * @param value JSON value.
 */
async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fsp.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/**
 * Throws when a storage path could escape the baseline directory.
 * @param objectPath Storage object path.
 */
function assertSafeObjectPath(objectPath: string): void {
  if (objectPath.startsWith('/') || objectPath.split('/').includes('..')) {
    throw new Error(`refusing storage path ${objectPath}`);
  }
}

/**
 * Writes a baseline tree into one directory.
 * @param root Directory to create.
 * @param manifest Manifest to write.
 * @param firestore Documents keyed by collection.
 * @param storage Storage files.
 */
async function writeTree(
  root: string,
  manifest: BaselineManifest,
  firestore: Readonly<Record<string, readonly BaselineDocument[]>>,
  storage: readonly StorageFile[],
): Promise<void> {
  await fsp.mkdir(path.join(root, 'firestore'), { recursive: true });
  await writeJson(path.join(root, 'manifest.json'), manifest);
  const entries = Object.entries(firestore);
  await entries.reduce(async (previous, [collection, documents]) => {
    await previous;
    await writeJson(path.join(root, 'firestore', `${collection}.json`), documents);
  }, Promise.resolve());
  await storage.reduce(async (previous, file) => {
    await previous;
    assertSafeObjectPath(file.objectPath);
    const target = path.join(root, 'storage', ...file.objectPath.split('/'));
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, file.bytes.toString('latin1'), 'latin1');
  }, Promise.resolve());
}

/**
 * True when a path exists.
 * @param filePath Path to test.
 * @returns Whether the path exists.
 */
async function exists(filePath: string): Promise<boolean> {
  try {
    await fsp.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Replaces db/baseline, restoring the previous tree if the rename fails.
 * @param manifest Manifest to write.
 * @param firestore Documents keyed by collection.
 * @param storage Storage files.
 */
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

/**
 * Formats the counts printed after a snapshot.
 * @param firestore Documents keyed by collection.
 * @param storage Storage files.
 * @returns Summary text.
 */
function summarize(
  firestore: Readonly<Record<string, readonly BaselineDocument[]>>,
  storage: readonly StorageFile[],
): string {
  const docCount = Object.values(firestore)
    .reduce((total, documents) => total + documents.length, 0);
  const storageBytes = storage.reduce((total, file) => total + file.bytes.length, 0);
  return [
    `firestore collections ${Object.keys(firestore).length}`,
    `firestore docs ${docCount}`,
    `storage objects ${storage.length}`,
    `storage bytes ${storageBytes}`,
  ].join('\n');
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
  storage.forEach((file) => {
    assertWithinBaselineLimit(file.bytes.length, file.objectPath);
  });
  const manifest = buildManifest(firestore, storage);
  await publishBaseline(manifest, firestore, storage);
  writeLine(summarize(firestore, storage));
}

/**
 * Writes the failure and exits the process.
 * @param error Caught value.
 */
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
