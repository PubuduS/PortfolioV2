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
  readonly replacement: 'gif' | 'webp' | 'banner-webp' | 'banner-mp4' | 'banner-webm' | 'resume' | 'pdf';
}

/** One row in the sanitizer table. */
export type SanitizeRule = FieldSanitizeRule | GlobalSanitizeRule | StorageObjectRule;

/** Order in which rewrite rules are applied. */
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
    id: 'banner-webp',
    pathPattern: '^portfolio/landing-page/banners/(fall|spring|winter)/[^/]+\\.webp$',
    replacement: 'banner-webp',
  },
  {
    kind: 'storage-object',
    id: 'banner-mp4',
    pathPattern: '^portfolio/landing-page/banners/(fall|spring|winter)/[^/]+\\.mp4$',
    replacement: 'banner-mp4',
  },
  {
    kind: 'storage-object',
    id: 'banner-webm',
    pathPattern: '^portfolio/landing-page/banners/(fall|spring|winter)/[^/]+\\.webm$',
    replacement: 'banner-webm',
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

/** Directory containing placeholder files. */
const PLACEHOLDER_DIR = path.join(REPO_ROOT, 'tools', 'db', 'placeholders');
/** Placeholder for a resume PDF file. */
const PLACEHOLDER_RESUME = Buffer.from('%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n', 'utf8');
/** Live storage hosts. */
const LIVE_STORAGE_HOSTS = [
  'firebasestorage.googleapis.com',
  'portfolio-c9b8e.firebasestorage.app',
  'portfolio-c9b8e.appspot.com',
] as const;
/** Live project ID. */
const LIVE_PROJECT_ID = 'portfolio-c9b8e';
/** Regular expression to match URLs. */
const URL_CANDIDATE = /(?:https?:)?\/\/[^\s"'<>]+/gi;

/**
 * Escapes a string for use in a regular expression.
 * @param value String to escape.
 * @returns Escaped string.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if a value is a plain object.
 * @param value Value to check.
 * @returns True if the value is a plain object.
 */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Checks if a field path matches a rule path.
 * @param rulePath Rule path.
 * @param fieldPath Field path.
 * @returns True if the field path matches the rule path.
 */
function fieldMatches(rulePath: string, fieldPath: string): boolean {
  return fieldPath === rulePath || fieldPath.startsWith(`${rulePath}.`);
}

/**
 * Returns all global rules.
 * @returns List of global rules.
 */
function globalRules(): GlobalSanitizeRule[] {
  return SANITIZE_RULES.filter((rule): rule is GlobalSanitizeRule => rule.kind === 'global');
}

/**
 * Returns all field rules.
 * @returns List of field rules.
 */
function fieldRules(): FieldSanitizeRule[] {
  return SANITIZE_RULES.filter((rule): rule is FieldSanitizeRule => rule.kind === 'field');
}

/**
 * Checks if a hostname is a live storage host.
 * @param hostname Hostname to check.
 * @returns True if the hostname is a live storage host.
 */
function isLiveStorageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return LIVE_STORAGE_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

/**
 * Returns the emulator media URL for a storage object.
 * @param objectPath Storage object path.
 * @returns Emulator media URL.
 */
function emulatorMediaUrl(objectPath: string): string {
  const encoded = encodeURIComponent(objectPath);
  const host = EMULATOR_TARGET.hosts.storage;
  const port = EMULATOR_PORTS.storage;
  return `http://${host}:${port}/v0/b/${EMULATOR_BUCKET}/o/${encoded}?alt=media`;
}

/**
 * Reads a placeholder file from the placeholder directory.
 * @param fileName File name.
 * @returns Buffer containing the file contents.
 */
function readPlaceholder(fileName: string): Buffer {
  return fs.readFileSync(path.join(PLACEHOLDER_DIR, fileName));
}

/**
 * Returns a regular expression for a global rewrite rule.
 * @param kind Rewrite kind.
 * @returns Regular expression for the rule.
 */
function globalPattern(kind: SanitizeKind): RegExp {
  const rule = globalRules().find((candidate) => candidate.rewrite === kind);
  if (!rule) {
    throw new Error(`missing global rule ${kind}`);
  }
  return new RegExp(rule.pattern, 'g');
}

/**
 * Checks if a string contains a live project ID.
 * @param value String to check.
 * @returns True if the string contains a live project ID.
 */
function hasLiveProjectId(value: string): boolean {
  return new RegExp(`(?<![a-z0-9-])${escapeRegExp(LIVE_PROJECT_ID)}(?![a-z0-9-])`, 'i').test(value);
}

/**
 * Checks if a string contains a live storage host.
 * @param value String to check.
 * @returns True if the string contains a live storage host.
 */
function hasLiveStorageHost(value: string): boolean {
  return (value.match(URL_CANDIDATE) ?? []).some((raw) => {
    try {
      const parsed = new URL(raw.startsWith('//')
        ? `https:${raw}`
        : raw);
      return isLiveStorageHost(parsed.hostname);
    } catch {
      return false;
    }
  });
}

/**
 * Checks if a rewrite rule is allowed for a string.
 * @param kind Rewrite kind.
 * @param match String to check.
 * @returns True if the rule applies.
 */
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

/**
 * Rewrites a storage:// URL to the emulator media URL.
 * @param value Storage URL.
 * @returns Emulator media URL.
 */
function rewriteSeedString(value: string): string {
  return value.replace(/storage:\/\/([^\s"'<>]+)/g, (_match, objectPath: string) => emulatorMediaUrl(objectPath));
}

/**
 * Rewrites a storage:// URL back to the emulator media URL.
 * @param value Storage URL.
 * @returns Emulator media URL.
 */
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

/**
 * Rewrites a string using a rewrite rule.
 * @param kind Rewrite kind.
 * @param value String to rewrite.
 * @returns Rewritten string.
 */
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

/**
 * Finds which rewrite rules apply to a string.
 * @param value String to check.
 * @returns List of rewrite kinds that apply.
 */
function residualKinds(value: string): SanitizeKind[] {
  const hits: SanitizeKind[] = [];
  globalRules().forEach((rule) => {
    const matches = value.match(new RegExp(rule.pattern, 'gi')) ?? [];
    const blocked = matches.some((match) => !isAllowed(rule.rewrite, match));
    if (blocked) {
      hits.push(rule.rewrite);
    }
  });
  if (hasLiveStorageHost(value) || hasLiveProjectId(value)) {
    hits.push('storage-url');
  }
  return hits;
}

/**
 * Rewrites strings inside a typed value using a visitor function.
 * @param value Typed value.
 * @param fieldPath Dot path of the string inside the document.
 * @param visit Function that transforms each string.
 * @returns Transformed value.
 */
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
      Object.entries(value.fields).forEach(([key, child]) => {
        const nextPath = fieldPath
          ? `${fieldPath}.${key}`
          : key;
        fields[key] = mapStrings(child, nextPath, visit);
      });
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

/**
 * Collects field paths that still contain personal data or live storage URLs.
 * @param value Typed document value read from the emulator.
 * @param fieldPath Dot path of the string inside the document.
 * @param problems List of field paths.
 */
function collectResidual(value: TypedValue, fieldPath: string, problems: string[]): void {
  switch (value.type) {
    case 'string':
      if (residualKinds(value.value).length > 0) {
        problems.push(fieldPath);
      }
      break;
    case 'array':
      value.values.forEach((item, index) => {
        collectResidual(item, `${fieldPath}.${index}`, problems);
      });
      break;
    case 'map':
      Object.entries(value.fields).forEach(([key, child]) => {
        const nextPath = fieldPath
          ? `${fieldPath}.${key}`
          : key;
        collectResidual(child, nextPath, problems);
      });
      break;
    default:
      break;
  }
}

/**
 * Rewrites one string using field rules for its path and every global rule.
 * @param collection Collection id.
 * @param fieldPath Dot path of the string inside the document.
 * @param value Raw string.
 * @returns Sanitized string.
 */
export function sanitizeString(collection: string, fieldPath: string, value: string): string {
  const kinds = new Set<SanitizeKind>();
  globalRules().forEach((rule) => {
    kinds.add(rule.rewrite);
  });
  fieldRules().forEach((rule) => {
    if (rule.collection === collection && fieldMatches(rule.fieldPath, fieldPath)) {
      rule.rewrites.forEach((rewrite) => {
        kinds.add(rewrite);
      });
    }
  });
  return REWRITE_ORDER.reduce((current, kind) => {
    if (!kinds.has(kind)) {
      return current;
    }
    return applyRewrite(kind, current);
  }, value);
}

/**
 * Rewrites personal data and live storage URLs in one collection.
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
 * Throws when a sanitized document still contains personal data or a live bucket URL.
 * @param collections Sanitized documents keyed by collection.
 */
export function assertNoResidualPii(
  collections: Readonly<Record<string, readonly BaselineDocument[]>>,
): void {
  const problems: string[] = [];
  Object.entries(collections).forEach(([collection, documents]) => {
    documents.forEach((document) => {
      collectResidual(document.data, `${collection}/${document.id}`, problems);
    });
  });
  if (problems.length > 0) {
    throw new Error(`sanitized baseline still has personal data at ${problems.join(', ')}`);
  }
}

/**
 * Returns the first storage rule that matches this object, if one does.
 * @param objectPath Bucket-relative object path.
 * @returns Matching rule, or null when the object should be copied.
 */
export function storageReplacement(objectPath: string): StorageObjectRule | null {
  const match = SANITIZE_RULES.find((rule) => (
    rule.kind === 'storage-object' && new RegExp(rule.pathPattern, 'i').test(objectPath)
  ));
  if (!match || match.kind !== 'storage-object') {
    return null;
  }
  return match;
}

/**
 * Bytes and content type written instead of a matched live object.
 * @param rule Storage rule that matched.
 * @returns Small generated file.
 */
export function placeholderFor(rule: StorageObjectRule): { bytes: Buffer; contentType: string } {
  switch (rule.replacement) {
    case 'gif':
      return { bytes: readPlaceholder('banner.gif'), contentType: 'image/gif' };
    case 'banner-webp':
      return { bytes: readPlaceholder('banner.webp'), contentType: 'image/webp' };
    case 'banner-mp4':
      return { bytes: readPlaceholder('banner.mp4'), contentType: 'video/mp4' };
    case 'banner-webm':
      return { bytes: readPlaceholder('banner.webm'), contentType: 'video/webm' };
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
  Object.entries(value).forEach(([key, child]) => {
    next[key] = rewriteSeedValue(child);
  });
  return next;
}

/**
 * Rewrites emulator media URLs back to storage:// so hashes match the baseline.
 * @param value Typed document value read from the emulator.
 * @returns Value with baseline storage URLs.
 */
export function normalizeEmulatorUrls(value: TypedValue): TypedValue {
  return mapStrings(value, '', (_fieldPath, text) => toBaselineStorageString(text));
}
