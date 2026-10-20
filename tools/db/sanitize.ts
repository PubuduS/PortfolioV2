import fs from 'node:fs';
import path from 'node:path';

import {
  EMULATOR_BUCKET,
  EMULATOR_PORTS,
  EMULATOR_TARGET,
  MAX_BASELINE_FILE_BYTES,
  MOCK_EMAIL,
  MOCK_PHONE,
  MOCK_TOKEN,
  REPO_ROOT,
} from './constants';
import {
  type BaselineDocument,
  type TypedValue,
} from './typed-json';

/** Which string rewrite a rule applies. */
export type SanitizeKind = 'storage-url' | 'mailto' | 'tel' | 'email' | 'phone' | 'token';

/** Known collection field that must be rewritten. */
export interface FieldSanitizeRule {
  readonly kind: 'field';
  readonly collection: string;
  readonly fieldPath: string;
  readonly rewrites: readonly SanitizeKind[];
}

/** Global pattern applied to every string as a safety net. */
export interface GlobalSanitizeRule {
  readonly kind: 'global';
  readonly rewrite: SanitizeKind;
  readonly pattern: string;
}

/** Storage object replaced with a generated placeholder. */
export interface StorageObjectRule {
  readonly kind: 'storage-object';
  readonly id: string;
  readonly pathPattern: string;
  readonly replacement: 'gif' | 'webp' | 'resume' | 'pdf';
}

/** One row in the sanitizer table. */
export type SanitizeRule = FieldSanitizeRule | GlobalSanitizeRule | StorageObjectRule;

const REWRITE_ORDER: readonly SanitizeKind[] = [
  'storage-url',
  'mailto',
  'tel',
  'email',
  'phone',
  'token',
];

/**
 * Field rules name the known contact and file URL paths.
 * Global rules are the safety net for every other string.
 */
export const SANITIZE_RULES: readonly SanitizeRule[] = [
  {
    kind: 'field',
    collection: 'social-infor-section',
    fieldPath: 'media',
    rewrites: ['mailto', 'tel', 'email', 'phone', 'storage-url'],
  },
  {
    kind: 'field',
    collection: 'about-me-section',
    fieldPath: 'imageSrc',
    rewrites: ['storage-url'],
  },
  {
    kind: 'field',
    collection: 'about-me-section',
    fieldPath: 'intro',
    rewrites: ['mailto', 'tel', 'email', 'phone'],
  },
  {
    kind: 'field',
    collection: 'about-me-section',
    fieldPath: 'subHeadingIntro',
    rewrites: ['mailto', 'tel', 'email', 'phone'],
  },
  {
    kind: 'field',
    collection: 'about-me-section',
    fieldPath: 'leftPoints',
    rewrites: ['mailto', 'tel', 'email', 'phone'],
  },
  {
    kind: 'field',
    collection: 'about-me-section',
    fieldPath: 'rightPoints',
    rewrites: ['mailto', 'tel', 'email', 'phone'],
  },
  {
    kind: 'field',
    collection: 'publication-section',
    fieldPath: 'imageUrl',
    rewrites: ['storage-url'],
  },
  {
    kind: 'field',
    collection: 'publication-section',
    fieldPath: 'downloadUrl',
    rewrites: ['storage-url'],
  },
  {
    kind: 'field',
    collection: 'publication-details-section',
    fieldPath: 'authors',
    rewrites: ['email'],
  },
  {
    kind: 'field',
    collection: 'publication-details-section',
    fieldPath: 'citation',
    rewrites: ['email'],
  },
  {
    kind: 'field',
    collection: 'project-data-section',
    fieldPath: 'imageURL',
    rewrites: ['storage-url'],
  },
  {
    kind: 'field',
    collection: 'project-data-section',
    fieldPath: 'screenshotURL',
    rewrites: ['storage-url'],
  },
  {
    kind: 'field',
    collection: 'project-icon-section',
    fieldPath: 'imageURL',
    rewrites: ['storage-url'],
  },
  {
    kind: 'field',
    collection: 'featured-project-section',
    fieldPath: 'imageURL',
    rewrites: ['storage-url'],
  },
  {
    kind: 'field',
    collection: 'certification-section',
    fieldPath: 'certificateURL',
    rewrites: ['storage-url'],
  },
  {
    kind: 'field',
    collection: 'experience-section',
    fieldPath: 'shortDescription',
    rewrites: ['mailto', 'tel', 'email', 'phone'],
  },
  {
    kind: 'field',
    collection: 'experience-section',
    fieldPath: 'points',
    rewrites: ['mailto', 'tel', 'email', 'phone'],
  },
  {
    kind: 'global',
    rewrite: 'storage-url',
    pattern: 'https://firebasestorage\\.googleapis\\.com/v0/b/portfolio-c9b8e[^/\\s]*/o/([^?\\s"\'<>]+)(?:\\?[^\\s"\'<>]*)?',
  },
  {
    kind: 'global',
    rewrite: 'mailto',
    pattern: 'mailto:[^\\s"\'<>]+',
  },
  {
    kind: 'global',
    rewrite: 'tel',
    pattern: 'tel:[^\\s"\'<>]+',
  },
  {
    kind: 'global',
    rewrite: 'email',
    pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}',
  },
  {
    kind: 'global',
    rewrite: 'phone',
    pattern: '(?:\\+\\d{1,3}[\\s.-])?(?:\\(\\d{3}\\)|\\d{3})[\\s.-]\\d{3}[\\s.-]\\d{4}|\\+\\d{1,3}(?:[\\s.-]\\d{2,4}){2,4}|\\+\\d{10,15}',
  },
  {
    kind: 'global',
    rewrite: 'token',
    pattern: '([?&])token=[A-Za-z0-9._~%-]{6,}',
  },
  {
    kind: 'storage-object',
    id: 'banner-gif',
    pathPattern: '^portfolio/landing-page/banners/(fall|spring|winter)/',
    replacement: 'gif',
  },
  {
    kind: 'storage-object',
    id: 'profile-photo',
    pathPattern: '^portfolio/about-me-section/profile/MyPhoto\\.webp$',
    replacement: 'webp',
  },
  {
    kind: 'storage-object',
    id: 'resume-or-cv',
    pathPattern: '(^|/)[^/]*(resume|cv)[^/]*$',
    replacement: 'resume',
  },
  {
    kind: 'storage-object',
    id: 'publication-paper',
    pathPattern: '^portfolio/publications/papers/',
    replacement: 'pdf',
  },
  {
    kind: 'storage-object',
    id: 'pdf',
    pathPattern: '\\.pdf$',
    replacement: 'pdf',
  },
];

const PLACEHOLDER_DIR = path.join(REPO_ROOT, 'tools', 'db', 'placeholders');
const PLACEHOLDER_RESUME = Buffer.from('%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n', 'utf8');

function readPlaceholder(fileName: string): Buffer {
  return fs.readFileSync(path.join(PLACEHOLDER_DIR, fileName));
}

/**
 * Rewrites personal data and live storage URLs in one collection.
 *
 * @param collection Collection id.
 * @param documents Encoded documents.
 * @returns Sanitized copies.
 */
export function sanitizeDocuments(
  collection: string,
  documents: readonly BaselineDocument[],
): BaselineDocument[] {
  return documents.map((document) => ({
    id: document.id,
    data: mapStrings(document.data, '', (fieldPath, text) => sanitizeString(collection, fieldPath, text)),
  }));
}

/**
 * Rewrites one string using field rules for its path and every global rule.
 *
 * @param collection Collection id.
 * @param fieldPath Dot path of the string inside the document.
 * @param value Raw string.
 * @returns Sanitized string.
 */
export function sanitizeString(collection: string, fieldPath: string, value: string): string {
  const kinds = new Set<SanitizeKind>();
  for (const rule of globalRules()) {
    kinds.add(rule.rewrite);
  }
  for (const rule of fieldRules()) {
    if (rule.collection === collection && fieldMatches(rule.fieldPath, fieldPath)) {
      for (const rewrite of rule.rewrites) {
        kinds.add(rewrite);
      }
    }
  }
  return REWRITE_ORDER.reduce((current, kind) => {
    if (!kinds.has(kind)) {
      return current;
    }
    return applyRewrite(kind, current);
  }, value);
}

/**
 * Throws when a sanitized document still contains personal data or a live bucket URL.
 *
 * @param collections Sanitized documents keyed by collection.
 */
export function assertNoResidualPii(
  collections: Readonly<Record<string, readonly BaselineDocument[]>>,
): void {
  const problems: string[] = [];
  for (const [collection, documents] of Object.entries(collections)) {
    for (const document of documents) {
      collectResidual(document.data, `${collection}/${document.id}`, problems);
    }
  }
  if (problems.length > 0) {
    throw new Error(`sanitized baseline still has personal data at ${problems.join(', ')}`);
  }
}

/**
 * Returns the first storage rule that matches this object, if one does.
 *
 * @param objectPath Bucket-relative object path.
 * @returns Matching rule, or null when the object should be copied.
 */
export function storageReplacement(objectPath: string): StorageObjectRule | null {
  for (const rule of SANITIZE_RULES) {
    if (rule.kind === 'storage-object' && new RegExp(rule.pathPattern, 'i').test(objectPath)) {
      return rule;
    }
  }
  return null;
}

/**
 * Bytes and content type written instead of a matched live object.
 *
 * @param rule Storage rule that matched.
 * @returns Small generated file.
 */
export function placeholderFor(rule: StorageObjectRule): { bytes: Buffer; contentType: string } {
  switch (rule.replacement) {
    case 'gif':
      return { bytes: readPlaceholder('banner.gif'), contentType: 'image/gif' };
    case 'webp':
      return { bytes: readPlaceholder('profile.png'), contentType: 'image/png' };
    case 'resume':
    case 'pdf':
      return { bytes: PLACEHOLDER_RESUME, contentType: 'application/pdf' };
    default: {
      const neverReplacement: never = rule.replacement;
      throw new Error(`unsupported placeholder ${String(neverReplacement)}`);
    }
  }
}

/**
 * Throws when a baseline file would exceed 1 MiB.
 *
 * @param bytes File length.
 * @param label Path or description used in the error.
 */
export function assertWithinBaselineLimit(bytes: number, label: string): void {
  if (bytes > MAX_BASELINE_FILE_BYTES) {
    throw new Error(`${label} is ${bytes} bytes, over the 1 MiB baseline limit`);
  }
}

/**
 * Rewrites storage:// links to emulator media URLs.
 *
 * @param value Decoded Firestore value.
 * @returns Value with emulator URLs.
 */
export function rewriteSeedValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return rewriteSeedString(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteSeedValue(item));
  }
  if (!isPlainRecord(value)) {
    return value;
  }
  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    next[key] = rewriteSeedValue(child);
  }
  return next;
}

/**
 * Rewrites emulator media URLs back to storage:// so hashes match the baseline.
 *
 * @param value Typed document value read from the emulator.
 * @returns Value with baseline storage URLs.
 */
export function normalizeEmulatorUrls(value: TypedValue): TypedValue {
  return mapStrings(value, '', (_fieldPath, text) => toBaselineStorageString(text));
}

function applyRewrite(kind: SanitizeKind, value: string): string {
  switch (kind) {
    case 'storage-url':
      return value.replace(globalPattern(kind), (_match, encoded: string) => (
        `storage://${decodeURIComponent(encoded)}`
      ));
    case 'mailto':
      return value.replace(globalPattern(kind), `mailto:${MOCK_EMAIL}`);
    case 'tel':
      return value.replace(globalPattern(kind), `tel:${MOCK_PHONE}`);
    case 'email':
      return value.replace(globalPattern(kind), (match) => (
        match.toLowerCase() === MOCK_EMAIL
          ? match
          : MOCK_EMAIL
      ));
    case 'phone':
      return value.replace(globalPattern(kind), (match) => (
        match === MOCK_PHONE
          ? match
          : MOCK_PHONE
      ));
    case 'token':
      return value.replace(globalPattern(kind), (_match, prefix: string) => `${prefix}token=${MOCK_TOKEN}`);
    default: {
      const neverKind: never = kind;
      throw new Error(`unsupported rewrite ${String(neverKind)}`);
    }
  }
}

function collectResidual(value: TypedValue, fieldPath: string, problems: string[]): void {
  switch (value.type) {
    case 'string':
      if (residualKinds(value.value).length > 0) {
        problems.push(fieldPath);
      }
      return;
    case 'array':
      value.values.forEach((item, index) => {
        collectResidual(item, `${fieldPath}.${index}`, problems);
      });
      return;
    case 'map':
      for (const [key, child] of Object.entries(value.fields)) {
        const nextPath = fieldPath
          ? `${fieldPath}.${key}`
          : key;
        collectResidual(child, nextPath, problems);
      }
      return;
    default:
  }
}

const LIVE_STORAGE_HOSTS = [
  'firebasestorage.googleapis.com',
  'portfolio-c9b8e.firebasestorage.app',
  'portfolio-c9b8e.appspot.com',
] as const;

const LIVE_PROJECT_ID = 'portfolio-c9b8e';
const URL_CANDIDATE = /(?:https?:)?\/\/[^\s"'<>]+/gi;

function residualKinds(value: string): SanitizeKind[] {
  const hits: SanitizeKind[] = [];
  for (const rule of globalRules()) {
    const matches = value.match(new RegExp(rule.pattern, 'gi')) ?? [];
    const blocked = matches.some((match) => !isAllowed(rule.rewrite, match));
    if (blocked) {
      hits.push(rule.rewrite);
    }
  }
  if (hasLiveStorageHost(value) || hasLiveProjectId(value)) {
    hits.push('storage-url');
  }
  return hits;
}

function hasLiveStorageHost(value: string): boolean {
  for (const raw of value.match(URL_CANDIDATE) ?? []) {
    try {
      const parsed = new URL(raw.startsWith('//')
        ? `https:${raw}`
        : raw);
      if (isLiveStorageHost(parsed.hostname)) {
        return true;
      }
    } catch {
      // The candidate was not a URL. Skip it.
    }
  }
  return false;
}

function isLiveStorageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return LIVE_STORAGE_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

function hasLiveProjectId(value: string): boolean {
  return new RegExp(`(?<![a-z0-9-])${escapeRegExp(LIVE_PROJECT_ID)}(?![a-z0-9-])`, 'i').test(value);
}

function isAllowed(kind: SanitizeKind, match: string): boolean {
  switch (kind) {
    case 'email':
      return match.toLowerCase() === MOCK_EMAIL;
    case 'mailto':
      return match.toLowerCase() === `mailto:${MOCK_EMAIL}`;
    case 'tel':
      return match.toLowerCase() === `tel:${MOCK_PHONE}`;
    case 'phone':
      return match === MOCK_PHONE;
    case 'token':
      return match.endsWith(`token=${MOCK_TOKEN}`);
    case 'storage-url':
      return false;
    default: {
      const neverKind: never = kind;
      return neverKind;
    }
  }
}

function rewriteSeedString(value: string): string {
  return value.replace(/storage:\/\/([^\s"'<>]+)/g, (_match, objectPath: string) => emulatorMediaUrl(objectPath));
}

function toBaselineStorageString(value: string): string {
  const host = escapeRegExp(EMULATOR_TARGET.hosts.storage);
  const port = EMULATOR_PORTS.storage;
  const bucket = escapeRegExp(EMULATOR_BUCKET);
  const pattern = new RegExp(
    `http://(?:${host}|localhost):${port}/v0/b/${bucket}/o/([^?\\s]+)(?:\\?[^\\s]*)?`,
    'g',
  );
  return value.replace(pattern, (_match, encoded: string) => `storage://${decodeURIComponent(encoded)}`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function emulatorMediaUrl(objectPath: string): string {
  const encoded = encodeURIComponent(objectPath);
  const host = EMULATOR_TARGET.hosts.storage;
  const port = EMULATOR_PORTS.storage;
  return `http://${host}:${port}/v0/b/${EMULATOR_BUCKET}/o/${encoded}?alt=media`;
}

function mapStrings(
  value: TypedValue,
  fieldPath: string,
  visit: (fieldPath: string, text: string) => string,
): TypedValue {
  switch (value.type) {
    case 'string':
      return { type: 'string', value: visit(fieldPath, value.value) };
    case 'array':
      return {
        type: 'array',
        values: value.values.map((item, index) => mapStrings(
          item,
          fieldPath
            ? `${fieldPath}.${index}`
            : String(index),
          visit,
        )),
      };
    case 'map': {
      const fields: Record<string, TypedValue> = {};
      for (const [key, child] of Object.entries(value.fields)) {
        const nextPath = fieldPath
          ? `${fieldPath}.${key}`
          : key;
        fields[key] = mapStrings(child, nextPath, visit);
      }
      return { type: 'map', fields };
    }
    case 'null':
    case 'boolean':
    case 'integer':
    case 'double':
    case 'bytes':
    case 'timestamp':
    case 'geopoint':
    case 'reference':
      return value;
    default: {
      const neverValue: never = value;
      throw new Error(`unsupported typed value ${JSON.stringify(neverValue)}`);
    }
  }
}

function globalPattern(kind: SanitizeKind): RegExp {
  const rule = globalRules().find((candidate) => candidate.rewrite === kind);
  if (!rule) {
    throw new Error(`missing global rule ${kind}`);
  }
  return new RegExp(rule.pattern, 'g');
}

function globalRules(): GlobalSanitizeRule[] {
  return SANITIZE_RULES.filter((rule): rule is GlobalSanitizeRule => rule.kind === 'global');
}

function fieldRules(): FieldSanitizeRule[] {
  return SANITIZE_RULES.filter((rule): rule is FieldSanitizeRule => rule.kind === 'field');
}

function fieldMatches(rulePath: string, fieldPath: string): boolean {
  return fieldPath === rulePath || fieldPath.startsWith(`${rulePath}.`);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
