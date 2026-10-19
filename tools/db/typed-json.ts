import { createHash } from 'node:crypto';

/** One Firestore value stored so timestamps, bytes, points, and references round-trip. */
export type TypedValue =
  | { readonly type: 'null' }
  | { readonly type: 'boolean'; readonly value: boolean }
  | { readonly type: 'integer'; readonly value: string }
  | { readonly type: 'double'; readonly value: number }
  | { readonly type: 'string'; readonly value: string }
  | { readonly type: 'bytes'; readonly value: string }
  | { readonly type: 'timestamp'; readonly seconds: string; readonly nanoseconds: number }
  | { readonly type: 'geopoint'; readonly latitude: number; readonly longitude: number }
  | { readonly type: 'reference'; readonly path: string }
  | { readonly type: 'array'; readonly values: readonly TypedValue[] }
  | { readonly type: 'map'; readonly fields: Readonly<Record<string, TypedValue>> };

/** One sanitized Firestore document in a collection file. */
export interface BaselineDocument {
  readonly id: string;
  readonly data: TypedValue;
}

/** Hash and doc count for one collection file. */
export interface FirestoreManifestEntry {
  readonly docCount: number;
  readonly sha256: string;
}

/** Hash, size, and content type for one stored object. */
export interface StorageManifestEntry {
  readonly sha256: string;
  readonly bytes: number;
  readonly contentType: string;
}

/** Committed description of a sanitized snapshot. */
export interface BaselineManifest {
  readonly sourceProjectId: string;
  readonly capturedAt: string;
  readonly sanitizerVersion: number;
  readonly firestore: Readonly<Record<string, FirestoreManifestEntry>>;
  readonly storage: Readonly<Record<string, StorageManifestEntry>>;
}

/** Builds admin SDK values while decoding. Keeps this file free of firebase-admin. */
export interface DecodeCodec {
  timestamp: (seconds: number, nanoseconds: number) => unknown;
  geopoint: (latitude: number, longitude: number) => unknown;
  bytes: (base64: string) => unknown;
  reference: (path: string) => unknown;
}

const REST_KEYS = [
  'nullValue',
  'booleanValue',
  'integerValue',
  'doubleValue',
  'timestampValue',
  'stringValue',
  'bytesValue',
  'referenceValue',
  'geoPointValue',
  'arrayValue',
  'mapValue',
] as const;

type RestKey = (typeof REST_KEYS)[number];

/**
 * Encodes a Firestore REST value or an admin SDK value.
 * Whole-number doubles become integers so emulator reads match the snapshot.
 *
 * @param value Raw REST value or admin SDK value.
 * @param source Which boundary the value crossed.
 * @returns Typed JSON for the baseline.
 */
export function encodeTypedValue(value: unknown, source: 'rest' | 'admin'): TypedValue {
  switch (source) {
    case 'rest':
      return encodeRest(value);
    case 'admin':
      return encodeAdmin(value);
    default: {
      const neverSource: never = source;
      throw new Error(`unsupported encode source ${String(neverSource)}`);
    }
  }
}

/**
 * Decodes typed JSON with the caller's codec for special Firestore types.
 *
 * @param value Typed JSON value.
 * @param codec Constructors for timestamp, point, bytes, and reference.
 * @returns A value the codec and plain JSON can represent.
 */
export function decodeTypedValue(value: TypedValue, codec: DecodeCodec): unknown {
  switch (value.type) {
    case 'null':
      return null;
    case 'boolean':
      return value.value;
    case 'integer':
      return integerToNumber(value.value);
    case 'double':
      return value.value;
    case 'string':
      return value.value;
    case 'bytes':
      return codec.bytes(value.value);
    case 'timestamp':
      return codec.timestamp(integerToNumber(value.seconds), value.nanoseconds);
    case 'geopoint':
      return codec.geopoint(value.latitude, value.longitude);
    case 'reference':
      return codec.reference(value.path);
    case 'array':
      return value.values.map((item) => decodeTypedValue(item, codec));
    case 'map':
      return decodeMap(value.fields, codec);
    default: {
      const neverValue: never = value;
      throw new Error(`unsupported typed value ${JSON.stringify(neverValue)}`);
    }
  }
}

/**
 * Parses a collection file that was read from disk.
 *
 * @param value Unknown JSON.
 * @returns Documents in file order.
 */
export function parseBaselineDocuments(value: unknown): BaselineDocument[] {
  if (!Array.isArray(value)) {
    throw new Error('baseline collection is not an array');
  }
  return value.map((item, index) => parseBaselineDocument(item, index));
}

/**
 * Parses manifest JSON from disk.
 *
 * @param value Unknown JSON.
 * @returns Manifest.
 */
export function parseManifest(value: unknown): BaselineManifest {
  const record = expectRecord(value, 'manifest');
  const firestore = expectRecord(record['firestore'], 'manifest.firestore');
  const storage = expectRecord(record['storage'], 'manifest.storage');
  return {
    sourceProjectId: expectString(record['sourceProjectId'], 'manifest.sourceProjectId'),
    capturedAt: expectString(record['capturedAt'], 'manifest.capturedAt'),
    sanitizerVersion: expectNumber(record['sanitizerVersion'], 'manifest.sanitizerVersion'),
    firestore: parseFirestoreManifest(firestore),
    storage: parseStorageManifest(storage),
  };
}

/**
 * Stable JSON used for collection hashes. Key order does not change the hash.
 *
 * @param value JSON data.
 * @returns Canonical JSON text.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

/**
 * SHA-256 hex digest of text or bytes.
 *
 * @param content Payload to hash.
 * @returns Hex digest.
 */
export function sha256Hex(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * SHA-256 hex digest of raw bytes.
 *
 * @param content Bytes to hash.
 * @returns Hex digest.
 */
export function sha256Bytes(content: Buffer): string {
  return createHash('sha256').update(content.toString('latin1'), 'latin1').digest('hex');
}

/**
 * Hash of a collection after sorting documents by id.
 *
 * @param documents Collection documents.
 * @returns Hex digest.
 */
export function canonicalCollectionHash(documents: readonly BaselineDocument[]): string {
  const sorted = [...documents].sort((left, right) => left.id.localeCompare(right.id));
  return sha256Hex(canonicalJson(sorted));
}

function encodeRest(value: unknown): TypedValue {
  const record = expectRecord(value, 'rest value');
  const key = restKey(record);
  switch (key) {
    case 'nullValue':
      return { type: 'null' };
    case 'booleanValue':
      return { type: 'boolean', value: expectBoolean(record[key], 'booleanValue') };
    case 'integerValue':
      return { type: 'integer', value: expectIntegerString(record[key], 'integerValue') };
    case 'doubleValue':
      return encodeDouble(record[key]);
    case 'stringValue':
      return { type: 'string', value: expectString(record[key], 'stringValue') };
    case 'bytesValue':
      return { type: 'bytes', value: normalizeBase64(expectString(record[key], 'bytesValue')) };
    case 'timestampValue':
      return encodeTimestamp(expectString(record[key], 'timestampValue'));
    case 'referenceValue':
      return { type: 'reference', path: referencePath(expectString(record[key], 'referenceValue')) };
    case 'geoPointValue':
      return encodeGeoPoint(record[key]);
    case 'arrayValue':
      return { type: 'array', values: encodeRestArray(record[key]) };
    case 'mapValue':
      return { type: 'map', fields: encodeRestFields(record[key]) };
    default: {
      const neverKey: never = key;
      throw new Error(`unsupported rest key ${String(neverKey)}`);
    }
  }
}

function encodeAdmin(value: unknown): TypedValue {
  if (value === null) {
    return { type: 'null' };
  }
  if (typeof value === 'boolean') {
    return { type: 'boolean', value };
  }
  if (typeof value === 'string') {
    return { type: 'string', value };
  }
  if (typeof value === 'number') {
    return encodeJsNumber(value);
  }
  if (typeof value !== 'object') {
    throw new Error(`unsupported admin value ${typeof value}`);
  }
  if (value instanceof Date) {
    throw new Error('unsupported admin Date value');
  }
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return { type: 'bytes', value: base64Bytes(value) };
  }
  if (Array.isArray(value)) {
    return { type: 'array', values: value.map((item) => encodeAdmin(item)) };
  }
  if (isTimestamp(value)) {
    return {
      type: 'timestamp',
      seconds: String(value.seconds),
      nanoseconds: value.nanoseconds,
    };
  }
  if (isGeoPoint(value)) {
    return { type: 'geopoint', latitude: value.latitude, longitude: value.longitude };
  }
  if (isReference(value)) {
    return { type: 'reference', path: value.path };
  }
  if (!isPlainRecord(value)) {
    throw new Error('unsupported admin object');
  }
  const fields: Record<string, TypedValue> = {};
  for (const [key, child] of Object.entries(value)) {
    fields[key] = encodeAdmin(child);
  }
  return { type: 'map', fields };
}

function encodeDouble(value: unknown): TypedValue {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error('non-finite double');
  }
  return encodeJsNumber(numeric);
}

function encodeJsNumber(value: number): TypedValue {
  if (!Number.isFinite(value)) {
    throw new Error('non-finite number');
  }
  if (Number.isSafeInteger(value)) {
    return { type: 'integer', value: String(value) };
  }
  return { type: 'double', value };
}

function encodeTimestamp(value: string): TypedValue {
  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z$/);
  if (!match) {
    throw new Error('bad timestamp');
  }
  const nanos = Number((match[2] ?? '').padEnd(9, '0'));
  const millis = Date.parse(`${match[1]}Z`);
  if (Number.isNaN(millis)) {
    throw new Error('bad timestamp');
  }
  return {
    type: 'timestamp',
    seconds: String(Math.floor(millis / 1000)),
    nanoseconds: nanos,
  };
}

function encodeGeoPoint(value: unknown): TypedValue {
  const record = expectRecord(value, 'geoPointValue');
  return {
    type: 'geopoint',
    latitude: expectNumber(record['latitude'] ?? 0, 'latitude'),
    longitude: expectNumber(record['longitude'] ?? 0, 'longitude'),
  };
}

function encodeRestArray(value: unknown): TypedValue[] {
  const record = expectRecord(value, 'arrayValue');
  const values = record['values'] ?? [];
  if (!Array.isArray(values)) {
    throw new Error('arrayValue.values is not an array');
  }
  return values.map((item) => encodeRest(item));
}

function encodeRestFields(value: unknown): Record<string, TypedValue> {
  const record = expectRecord(value, 'mapValue');
  const fields = record['fields'] ?? {};
  const fieldRecord = expectRecord(fields, 'mapValue.fields');
  const encoded: Record<string, TypedValue> = {};
  for (const [key, child] of Object.entries(fieldRecord)) {
    encoded[key] = encodeRest(child);
  }
  return encoded;
}

function decodeMap(fields: Readonly<Record<string, TypedValue>>, codec: DecodeCodec): Record<string, unknown> {
  const decoded: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(fields)) {
    decoded[key] = decodeTypedValue(child, codec);
  }
  return decoded;
}

function parseBaselineDocument(value: unknown, index: number): BaselineDocument {
  const record = expectRecord(value, `document ${index}`);
  const data = parseTypedValue(record['data'], `document ${index} data`);
  if (data.type !== 'map') {
    throw new Error(`document ${index} data is not a map`);
  }
  return {
    id: expectString(record['id'], `document ${index} id`),
    data,
  };
}

function parseTypedValue(value: unknown, label: string): TypedValue {
  const record = expectRecord(value, label);
  const kind = expectString(record['type'], `${label}.type`);
  switch (kind) {
    case 'null':
      return { type: 'null' };
    case 'boolean':
      return { type: 'boolean', value: expectBoolean(record['value'], label) };
    case 'integer':
      return { type: 'integer', value: expectIntegerString(record['value'], label) };
    case 'double':
      return { type: 'double', value: expectFiniteNumber(record['value'], label) };
    case 'string':
      return { type: 'string', value: expectString(record['value'], label) };
    case 'bytes':
      return { type: 'bytes', value: expectString(record['value'], label) };
    case 'timestamp':
      return {
        type: 'timestamp',
        seconds: expectIntegerString(record['seconds'], `${label}.seconds`),
        nanoseconds: expectNanoseconds(record['nanoseconds'], label),
      };
    case 'geopoint':
      return {
        type: 'geopoint',
        latitude: expectNumber(record['latitude'], `${label}.latitude`),
        longitude: expectNumber(record['longitude'], `${label}.longitude`),
      };
    case 'reference':
      return { type: 'reference', path: expectString(record['path'], `${label}.path`) };
    case 'array':
      return { type: 'array', values: parseTypedArray(record['values'], label) };
    case 'map':
      return { type: 'map', fields: parseTypedFields(record['fields'], label) };
    default:
      throw new Error(`${label} has unsupported type ${kind}`);
  }
}

function parseTypedArray(value: unknown, label: string): TypedValue[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label}.values is not an array`);
  }
  return value.map((item, index) => parseTypedValue(item, `${label}[${index}]`));
}

function parseTypedFields(value: unknown, label: string): Record<string, TypedValue> {
  const record = expectRecord(value, `${label}.fields`);
  const fields: Record<string, TypedValue> = {};
  for (const [key, child] of Object.entries(record)) {
    fields[key] = parseTypedValue(child, `${label}.${key}`);
  }
  return fields;
}

function parseFirestoreManifest(value: Record<string, unknown>): Record<string, FirestoreManifestEntry> {
  const entries: Record<string, FirestoreManifestEntry> = {};
  for (const [name, child] of Object.entries(value)) {
    const record = expectRecord(child, `firestore.${name}`);
    entries[name] = {
      docCount: expectNumber(record['docCount'], `firestore.${name}.docCount`),
      sha256: expectString(record['sha256'], `firestore.${name}.sha256`),
    };
  }
  return entries;
}

function parseStorageManifest(value: Record<string, unknown>): Record<string, StorageManifestEntry> {
  const entries: Record<string, StorageManifestEntry> = {};
  for (const [name, child] of Object.entries(value)) {
    const record = expectRecord(child, `storage.${name}`);
    entries[name] = {
      sha256: expectString(record['sha256'], `storage.${name}.sha256`),
      bytes: expectNumber(record['bytes'], `storage.${name}.bytes`),
      contentType: expectString(record['contentType'], `storage.${name}.contentType`),
    };
  }
  return entries;
}

function restKey(record: Record<string, unknown>): RestKey {
  const keys = REST_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(record, key));
  if (keys.length !== 1) {
    throw new Error(`firestore rest value has ${keys.length} type keys`);
  }
  const key = keys[0];
  if (!key) {
    throw new Error('firestore rest value has no type key');
  }
  return key;
}

function referencePath(value: string): string {
  const marker = '/documents/';
  const index = value.lastIndexOf(marker);
  if (index < 0) {
    throw new Error('reference has no document path');
  }
  return value.slice(index + marker.length);
}

function integerToNumber(value: string): number {
  const numeric = Number(value);
  if (!Number.isSafeInteger(numeric)) {
    throw new Error(`integer is outside the safe range: ${value}`);
  }
  return numeric;
}

function normalizeBase64(value: string): string {
  return Buffer.from(value, 'base64').toString('base64');
}

function base64Bytes(value: Buffer | Uint8Array): string {
  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }
  const chars: string[] = [];
  for (let index = 0; index < value.byteLength; index += 1) {
    chars.push(String.fromCharCode(value[index] ?? 0));
  }
  return Buffer.from(chars.join(''), 'latin1').toString('base64');
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeys(item));
  }
  if (!isPlainRecord(value)) {
    return value;
  }
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = sortKeys(value[key]);
  }
  return sorted;
}

function isTimestamp(value: object): value is { seconds: number; nanoseconds: number } {
  const candidate = value as { seconds?: unknown; nanoseconds?: unknown; toDate?: unknown };
  return typeof candidate.toDate === 'function'
    && typeof candidate.seconds === 'number'
    && typeof candidate.nanoseconds === 'number';
}

function isGeoPoint(value: object): value is { latitude: number; longitude: number } {
  const candidate = value as { latitude?: unknown; longitude?: unknown; isEqual?: unknown };
  return typeof candidate.isEqual === 'function'
    && typeof candidate.latitude === 'number'
    && typeof candidate.longitude === 'number';
}

function isReference(value: object): value is { path: string; id: string } {
  const candidate = value as { path?: unknown; id?: unknown; collection?: unknown };
  return typeof candidate.collection === 'function'
    && typeof candidate.path === 'string'
    && typeof candidate.id === 'string';
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isPlainRecord(value)) {
    throw new Error(`${label} is not an object`);
  }
  return value;
}

function expectString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${label} is not a string`);
  }
  return value;
}

function expectBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} is not a boolean`);
  }
  return value;
}

function expectNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${label} is not a number`);
  }
  return value;
}

function expectFiniteNumber(value: unknown, label: string): number {
  const numeric = expectNumber(value, label);
  if (!Number.isFinite(numeric)) {
    throw new Error(`${label} is not finite`);
  }
  return numeric;
}

function expectIntegerString(value: unknown, label: string): string {
  const text = expectString(value, label);
  if (!/^-?\d+$/.test(text)) {
    throw new Error(`${label} is not an integer string`);
  }
  return text;
}

function expectNanoseconds(value: unknown, label: string): number {
  const numeric = expectNumber(value, `${label}.nanoseconds`);
  if (!Number.isInteger(numeric) || numeric < 0 || numeric > 999999999) {
    throw new Error(`${label}.nanoseconds is out of range`);
  }
  return numeric;
}
