/** At most this many versions per kind, including the current one. */
export const MAX_DOCUMENT_VERSIONS = 5;

/** Firestore collection. The document id is the kind. */
export const DOCUMENT_VERSIONS_COLLECTION = 'document-versions';

/**
 * One row of the kind table.
 * `publicPath` is null for resume because visitors open a file, not a route.
 */
export interface DocumentKindSpec {
  /** Exact mime type `acceptUpload` accepts. */
  readonly contentType: string;
  /** File-name suffix used when the browser omits a mime type. Includes the dot. */
  readonly extension: string;
  /** App-relative fallback when the catalog has no current row. */
  readonly bundledUrl: string;
  /** Admin route for this kind. */
  readonly adminPath: string;
  /** Visitor route. Null when visitors open a file instead. */
  readonly publicPath: string | null;
}

/**
 * The only table of kinds, mime types, fallbacks, and routes.
 * Nav links, mirrorUrl, acceptUpload, and the seed all read this.
 */
export const DOCUMENT_KIND_SPECS = {
  resume: {
    contentType: 'application/pdf',
    extension: '.pdf',
    bundledUrl: 'assets/PDFs/Resume/Pubudu_Resumes.pdf',
    adminPath: '/admin/resume',
    publicPath: null,
  },
  'cover-letter': {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx',
    bundledUrl: 'assets/CoverLetter/PubuduCoverLetter.docx',
    adminPath: '/admin/coverletter',
    publicPath: '/content/coverletter',
  },
} as const satisfies Record<'resume' | 'cover-letter', DocumentKindSpec>;

/** Resume or cover letter. */
export type DocumentKind = keyof typeof DOCUMENT_KIND_SPECS;

/** Brand that keeps a version id distinct from a plain string. */
declare const versionIdBrand: unique symbol;

/**
 * Digit id `epochMs` plus six entropy digits.
 * Letters are rejected so the id cannot contain `cv`.
 */
export type VersionId = string & { readonly [versionIdBrand]: true };

/** Brand that keeps a parsed catalog distinct from a plain object. */
declare const catalogBrand: unique symbol;

/** A catalog only parseCatalog and applyCatalogCommand can build. */
export type DocumentCatalog = {
  readonly kind: DocumentKind;
  readonly versions: readonly DocumentVersion[];
} & { readonly [catalogBrand]: true };

/**
 * One stored file.
 * Index 0 of `catalog.versions` is current.
 * `pendingDeletes` is cleanup debt, not another version list.
 * The page renders `uploadedAt` and the current mark. It does not render `pendingDeletes`.
 */
export interface DocumentVersion {
  /** Branded id. The storage object name is derived from this. */
  readonly id: VersionId;
  /** ISO timestamp shown on the card. */
  readonly uploadedAt: string;
  /** Bucket-relative path from `storageObjectPath`. */
  readonly storagePath: string;
  /** URL the card and the visitor resume link open. */
  readonly downloadUrl: string;
  /** Storage paths a crashed upload still owes. Not shown in the UI. */
  readonly pendingDeletes: readonly string[];
}

/** What the reader has decided for one kind. */
export type CatalogView =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly catalog: DocumentCatalog }
  | { readonly status: 'unreadable' };

/** Bytes the writer just stored. The path is derived from the id, not chosen here. */
export interface UploadAttempt {
  /** Id minted for this file until the upload succeeds. */
  readonly id: VersionId;
  /** ISO timestamp recorded when the transaction runs. */
  readonly uploadedAt: string;
  /** Download URL returned by storage. */
  readonly downloadUrl: string;
}

/** A change the writer asks the pure module to apply to the current document. */
export type CatalogCommand =
  | { readonly type: 'upload'; readonly attempt: UploadAttempt }
  | { readonly type: 'remove'; readonly version: DocumentVersion };

/** Private Firestore body. The document id is the kind, so the body has no kind field. */
interface CatalogWireBody {
  /** Stored versions, oldest first. Index 0 is current. */
  readonly versions: readonly {
    readonly id: string;
    readonly uploadedAt: string;
    readonly storagePath: string;
    readonly downloadUrl: string;
    readonly pendingDeletes: readonly string[];
  }[];
}

/** Brand that keeps a Firestore body distinct from an unparsed object. */
declare const catalogWireBrand: unique symbol;

/**
 * Compile-time brand over the Firestore body.
 * The brand is not written to Firestore.
 */
export type CatalogWire = CatalogWireBody & { readonly [catalogWireBrand]: true };

/** Result of applying one command. `wire` null means the transaction must not set the document. */
export type CommandResult =
  | {
    readonly ok: true;
    readonly catalog: DocumentCatalog;
    readonly wire: CatalogWire | null;
    readonly deletePaths: readonly string[];
  }
  | { readonly ok: false; readonly reason: 'protected' | 'unreadable' };

/** Why a picked file never reaches Storage. */
export type AcceptResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'rejected-type' };

/** A missing document is an empty catalog. A bad document is unreadable. */
export type ParsedCatalog =
  | { readonly ok: true; readonly catalog: DocumentCatalog }
  | { readonly ok: false; readonly reason: 'unreadable' };

/** Dialog payload. The version is the row the admin clicked, including its storage path. */
export interface DeleteDocumentRequest {
  /** Kind the page is showing. */
  readonly kind: DocumentKind;
  /** Row to remove. */
  readonly version: DocumentVersion;
}

/** Why a document write stopped. */
export type DocumentWriteFailure =
  | 'unauthenticated'
  | 'rejected-type'
  | 'upload-failed'
  | 'commit-failed'
  | 'protected'
  | 'cleanup-failed';

/** Resume link. A file href is null while the catalog is still loading. */
export type ResumeNavTarget =
  | { readonly kind: 'admin'; readonly path: typeof DOCUMENT_KIND_SPECS.resume.adminPath }
  | { readonly kind: 'file'; readonly href: string | null };

/** Cover-letter link. Both sides are routes. */
export type CoverLetterNavTarget =
  | { readonly kind: 'admin'; readonly path: (typeof DOCUMENT_KIND_SPECS)['cover-letter']['adminPath'] }
  | {
    readonly kind: 'page';
    readonly path: NonNullable<typeof DOCUMENT_KIND_SPECS['cover-letter']['publicPath']>;
  };

/**
 * A document write that did not finish the way the admin asked.
 * `cleanup-failed` means the catalog commit already succeeded.
 */
export class DocumentWriteError extends Error {
  /**
   * Record which step failed and the error that caused it.
   * @param reason which step failed
   * @param kind resume or cover letter, when the failure belongs to one
   * @param cause underlying error, when the failure came from Firebase
   */
  constructor(
    public readonly reason: DocumentWriteFailure,
    public readonly kind: DocumentKind | null = null,
    cause?: unknown,
  ) {
    super(reason);
    this.name = 'DocumentWriteError';
    (this as { cause?: unknown }).cause = cause;
  }
}

/** Text pattern of a stored version id: epoch milliseconds, a hyphen, then six digits. */
const VERSION_ID_TEXT = /^(\d+)-(\d{6})$/;

/**
 * Brand a digit version id.
 * Seed versions use `createVersionId(1730000000000, 1)`, which is `1730000000000-000001`.
 * @param epochMs upload clock, integer milliseconds, zero or greater
 * @param entropy integer from 0 through 999999
 * @returns branded id
 */
export function createVersionId(epochMs: number, entropy: number): VersionId {
  if (!Number.isSafeInteger(epochMs) || epochMs < 0) {
    throw new RangeError('epochMs must be an integer zero or greater.');
  }
  if (!Number.isInteger(entropy) || entropy < 0 || entropy > 999999) {
    throw new RangeError('entropy must be an integer from 0 through 999999.');
  }
  return `${epochMs}-${entropy.toString().padStart(6, '0')}` as VersionId;
}

/**
 * Read a resume or cover-letter kind from raw text.
 * @param value route param or other raw text
 * @returns the kind, or null when the text is not one
 */
export function parseKind(value: string | null): DocumentKind | null {
  if (value === 'resume' || value === 'cover-letter') {
    return value;
  }
  return null;
}

/**
 * Object path for one version. This is the only path producer.
 * Resume final segment is `resume-${id}.pdf`, so the sanitizer rule `resume-or-cv`
 * matches it before the generic `.pdf` rule and replaces the bytes with the 45-byte PDF.
 * Cover-letter final segment is `${id}.docx`.
 * The id has no letters, so it cannot match `resume` or `cv`.
 * @param kind resume or cover letter
 * @param id version id
 * @returns bucket-relative path
 */
export function storageObjectPath(kind: DocumentKind, id: VersionId): string {
  const { extension } = DOCUMENT_KIND_SPECS[kind];
  if (kind === 'resume') {
    return `portfolio/documents/resume/resume-${id}${extension}`;
  }
  return `portfolio/documents/cover-letter/${id}${extension}`;
}

/**
 * Firestore path of the catalog document for one kind.
 * @param kind resume or cover letter
 * @returns `document-versions/{kind}`
 */
export function catalogDocPath(kind: DocumentKind): string {
  return `${DOCUMENT_VERSIONS_COLLECTION}/${kind}`;
}

/**
 * Accept the exact mime type for the kind.
 * An empty type or `application/octet-stream` is accepted only when the file name
 * ends with the kind's extension.
 * An empty file is rejected.
 * @param kind resume or cover letter
 * @param file picked file
 * @returns ok, or rejected-type
 */
export function acceptUpload(kind: DocumentKind, file: File): AcceptResult {
  if (file.size === 0) {
    return { ok: false, reason: 'rejected-type' };
  }
  const spec = DOCUMENT_KIND_SPECS[kind];
  if (file.type === spec.contentType) {
    return { ok: true };
  }
  const nameMatches = file.name.toLowerCase().endsWith(spec.extension);
  if (nameMatches && (file.type === '' || file.type === 'application/octet-stream')) {
    return { ok: true };
  }
  return { ok: false, reason: 'rejected-type' };
}

/**
 * Brand a kind and its versions as a catalog.
 * @param kind resume or cover letter
 * @param versions rows in insert order, index 0 current
 * @returns branded catalog
 */
function brandCatalog(kind: DocumentKind, versions: readonly DocumentVersion[]): DocumentCatalog {
  return { kind, versions } as DocumentCatalog;
}

/**
 * Copy a catalog into the Firestore body.
 * @param catalog ready catalog
 * @returns body safe to pass to Firestore. The brand is not a field.
 */
function toWire(catalog: DocumentCatalog): CatalogWire {
  const body: CatalogWireBody = {
    versions: catalog.versions.map((version) => ({
      id: version.id,
      uploadedAt: version.uploadedAt,
      storagePath: version.storagePath,
      downloadUrl: version.downloadUrl,
      pendingDeletes: [...version.pendingDeletes],
    })),
  };
  return body as CatalogWire;
}

/**
 * Whether a snapshot field is a plain object.
 * @param value raw snapshot field
 * @returns true when value is a plain object
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Brand a version id when the text matches the stored pattern.
 * @param value raw id
 * @returns branded id, or null when the text is not `{epochMs}-{six digits}`
 */
function parseVersionId(value: string): VersionId | null {
  const match = VERSION_ID_TEXT.exec(value);
  if (match === null) {
    return null;
  }
  const epochText = match[1];
  const entropy = Number(match[2]);
  const epochMs = Number(epochText);
  if (!Number.isSafeInteger(epochMs) || epochMs < 0 || epochText !== String(epochMs)) {
    return null;
  }
  if (!Number.isInteger(entropy) || entropy < 0 || entropy > 999999) {
    return null;
  }
  return value as VersionId;
}

/**
 * Read a version id from a storage path that belongs to this kind.
 * @param kind resume or cover letter
 * @param storagePath candidate path
 * @returns the id when the path is exactly `storageObjectPath` for this kind
 */
function idFromStoragePath(kind: DocumentKind, storagePath: string): VersionId | null {
  const pattern = kind === 'resume'
    ? /^portfolio\/documents\/resume\/resume-(\d+-\d{6})\.pdf$/
    : /^portfolio\/documents\/cover-letter\/(\d+-\d{6})\.docx$/;
  const match = pattern.exec(storagePath);
  if (match === null) {
    return null;
  }
  const id = parseVersionId(match[1]);
  if (id === null || storageObjectPath(kind, id) !== storagePath) {
    return null;
  }
  return id;
}

/**
 * Read one versions entry, or reject it when an invariant fails.
 * @param kind document id
 * @param raw one versions entry
 * @param seen ids already accepted in this document
 * @returns the row, or null when it breaks an invariant
 */
function parseVersion(
  kind: DocumentKind,
  raw: unknown,
  seen: Set<string>,
): DocumentVersion | null {
  if (!isRecord(raw) || typeof raw['id'] !== 'string') {
    return null;
  }
  const id = parseVersionId(raw['id']);
  const {
    uploadedAt, storagePath, downloadUrl, pendingDeletes,
  } = raw;
  if (
    id === null
    || seen.has(id)
    || typeof uploadedAt !== 'string'
    || uploadedAt.length === 0
    || typeof storagePath !== 'string'
    || storagePath !== storageObjectPath(kind, id)
    || typeof downloadUrl !== 'string'
    || downloadUrl.length === 0
    || !Array.isArray(pendingDeletes)
  ) {
    return null;
  }
  const paths = pendingDeletes.reduce<string[] | null>((rows, entry) => {
    if (rows === null) {
      return null;
    }
    if (typeof entry !== 'string' || entry === storagePath || idFromStoragePath(kind, entry) === null) {
      return null;
    }
    return [...rows, entry];
  }, []);
  if (paths === null) {
    return null;
  }
  seen.add(id);
  return {
    id,
    uploadedAt,
    storagePath,
    downloadUrl,
    pendingDeletes: paths,
  };
}

/**
 * Prepend a stored file as the current version.
 * @param kind document id
 * @param catalog current catalog
 * @param attempt file just stored
 * @returns insert, or a no-op that still names cleanup debt
 */
function uploadVersion(
  kind: DocumentKind,
  catalog: DocumentCatalog,
  attempt: UploadAttempt,
): CommandResult {
  const existing = catalog.versions.find((version) => version.id === attempt.id);
  if (existing) {
    return {
      ok: true,
      catalog,
      wire: null,
      deletePaths: existing.pendingDeletes,
    };
  }
  const storagePath = storageObjectPath(kind, attempt.id);
  const kept = catalog.versions.slice(0, MAX_DOCUMENT_VERSIONS - 1);
  const dropped = catalog.versions.slice(MAX_DOCUMENT_VERSIONS - 1);
  const pendingDeletes = dropped
    .flatMap((version) => [version.storagePath, ...version.pendingDeletes])
    .filter((path) => path !== storagePath);
  const next = brandCatalog(kind, [
    {
      id: attempt.id,
      uploadedAt: attempt.uploadedAt,
      storagePath,
      downloadUrl: attempt.downloadUrl,
      pendingDeletes,
    },
    ...kept,
  ]);
  return {
    ok: true,
    catalog: next,
    wire: toWire(next),
    deletePaths: pendingDeletes,
  };
}

/**
 * Drop delete candidates that a remaining row still names.
 * @param candidates paths the command wants deleted
 * @param versions rows that will remain
 * @returns candidates that no remaining row still names
 */
function pathsStillOwed(
  candidates: readonly string[],
  versions: readonly DocumentVersion[],
): readonly string[] {
  const live = new Set(
    versions.flatMap((version) => [version.storagePath, ...version.pendingDeletes]),
  );
  return candidates.filter((path) => !live.has(path));
}

/**
 * Sentence shown when the picked file is the wrong type.
 * @param kind resume or cover letter, when the writer knows it
 * @returns the rejection sentence for that kind
 */
function rejectedTypeMessage(kind: DocumentKind | null): string {
  if (kind === 'resume') {
    return 'Choose a PDF file.';
  }
  if (kind === 'cover-letter') {
    return 'Choose a Word .docx file.';
  }
  return 'Choose a PDF or a Word .docx file.';
}

/**
 * Drop one version, or refuse when it is the only one.
 * @param kind document id
 * @param catalog current catalog
 * @param version row the caller wants removed
 * @returns the shorter catalog, or protected when it is the only version
 */
function removeVersion(
  kind: DocumentKind,
  catalog: DocumentCatalog,
  version: DocumentVersion,
): CommandResult {
  if (catalog.versions.length === 1 && catalog.versions[0]?.id === version.id) {
    return { ok: false, reason: 'protected' };
  }
  const removed = catalog.versions.find((row) => row.id === version.id);
  if (removed === undefined) {
    return {
      ok: true,
      catalog,
      wire: null,
      deletePaths: pathsStillOwed(
        [version.storagePath, ...version.pendingDeletes],
        catalog.versions,
      ),
    };
  }
  const versions = catalog.versions.filter((row) => row.id !== version.id);
  const next = brandCatalog(kind, versions);
  return {
    ok: true,
    catalog: next,
    wire: toWire(next),
    deletePaths: pathsStillOwed([removed.storagePath, ...removed.pendingDeletes], versions),
  };
}

/**
 * Parse one Firestore document.
 * Do not sort. Index 0 stays current even if `uploadedAt` is out of order.
 * @param kind document id
 * @param raw snapshot data, or undefined when the document is absent
 * @returns empty catalog when raw is undefined, unreadable when the body breaks an invariant
 */
export function parseCatalog(kind: DocumentKind, raw: unknown): ParsedCatalog {
  if (raw === undefined) {
    return { ok: true, catalog: brandCatalog(kind, []) };
  }
  if (!isRecord(raw) || !Array.isArray(raw['versions']) || raw['versions'].length > MAX_DOCUMENT_VERSIONS) {
    return { ok: false, reason: 'unreadable' };
  }
  const seen = new Set<string>();
  const versions = raw['versions'].reduce<DocumentVersion[] | null>((rows, entry) => {
    if (rows === null) {
      return null;
    }
    const version = parseVersion(kind, entry, seen);
    return version === null ? null : [...rows, version];
  }, []);
  if (versions === null) {
    return { ok: false, reason: 'unreadable' };
  }
  return { ok: true, catalog: brandCatalog(kind, versions) };
}

/**
 * Pure transition for the catalog document.
 * Upload of an id already present does not change the row and returns that row's pendingDeletes.
 * Upload of a new id prepends it as current and keeps at most MAX_DOCUMENT_VERSIONS.
 * The dropped tail, plus each dropped row's pendingDeletes, becomes the new row's pendingDeletes.
 * Remove of the only version returns protected and no paths.
 * Remove of the current id when another row exists promotes the next row to current.
 * Remove of a missing id returns the same catalog and the caller's paths that are no longer live.
 * @param kind document id
 * @param current snapshot data, or undefined when the document is absent
 * @param command upload or remove
 * @returns the next catalog, the wire to write, and the storage paths to delete
 */
export function applyCatalogCommand(
  kind: DocumentKind,
  current: unknown,
  command: CatalogCommand,
): CommandResult {
  const parsed = parseCatalog(kind, current);
  if (!parsed.ok) {
    return { ok: false, reason: 'unreadable' };
  }
  if (command.type === 'upload') {
    return uploadVersion(kind, parsed.catalog, command.attempt);
  }
  return removeVersion(kind, parsed.catalog, command.version);
}

/**
 * Whether this id is the current version.
 * @param catalog ready catalog
 * @param versionId row id
 * @returns true when the id is index 0
 */
export function isCurrent(catalog: DocumentCatalog, versionId: VersionId): boolean {
  return catalog.versions[0]?.id === versionId;
}

/**
 * Whether this id can be removed without emptying the catalog.
 * @param catalog ready catalog
 * @param versionId row id
 * @returns true when the id is in the list and another version would remain
 */
export function canDelete(catalog: DocumentCatalog, versionId: VersionId): boolean {
  return catalog.versions.length > 1
    && catalog.versions.some((version) => version.id === versionId);
}

/**
 * Href for the visitor Resume link.
 * @param view reader state for resume
 * @returns null while loading, the current download URL when one exists, or the bundled PDF
 */
export function resumeHref(view: CatalogView): string | null {
  if (view.status === 'loading') {
    return null;
  }
  if (view.status === 'ready' && view.catalog.versions.length > 0) {
    return view.catalog.versions[0].downloadUrl;
  }
  return DOCUMENT_KIND_SPECS.resume.bundledUrl;
}

/**
 * Preview-toggle mapping for the document routes.
 * Returns null when the generic mirror rule should run.
 * Checked before the `/content` to `/admin` swap.
 * @param path path with query and fragment already removed
 * @returns the other side of the pair, or null
 */
export function mirrorDocumentPath(path: string): string | null {
  const kinds: readonly DocumentKind[] = ['resume', 'cover-letter'];
  const matched = kinds
    .map((kind) => {
      const spec = DOCUMENT_KIND_SPECS[kind];
      if (path === spec.adminPath) {
        return spec.publicPath ?? '/home';
      }
      if (spec.publicPath !== null && path === spec.publicPath) {
        return spec.adminPath;
      }
      return null;
    })
    .find((value) => value !== null);
  return matched ?? null;
}

/**
 * Admin resume page, or the visitor file.
 * The file href is null while the catalog is loading, so the template does not keep a stale URL.
 * @param isAdmin store flag, including while preview mode is on
 * @param isPreview preview mode
 * @param view reader state for resume
 * @returns where the Resume nav item goes
 */
export function resumeNavTarget(
  isAdmin: boolean,
  isPreview: boolean,
  view: CatalogView,
): ResumeNavTarget {
  if (isAdmin && !isPreview) {
    return { kind: 'admin', path: DOCUMENT_KIND_SPECS.resume.adminPath };
  }
  return { kind: 'file', href: resumeHref(view) };
}

/**
 * Admin cover-letter page, or the visitor generator.
 * @param isAdmin store flag, including while preview mode is on
 * @param isPreview preview mode
 * @returns where the Cover Letter nav item goes
 */
export function coverLetterNavTarget(isAdmin: boolean, isPreview: boolean): CoverLetterNavTarget {
  if (isAdmin && !isPreview) {
    return { kind: 'admin', path: DOCUMENT_KIND_SPECS['cover-letter'].adminPath };
  }
  const path = DOCUMENT_KIND_SPECS['cover-letter'].publicPath;
  return { kind: 'page', path };
}

/**
 * Text for a failed upload or delete.
 * @param error failure from the writer, or anything else thrown around it
 * @returns text for the page or the dialog
 */
export function documentWriteMessage(error: unknown): string {
  if (!(error instanceof DocumentWriteError)) {
    return 'The version list could not be saved.';
  }
  switch (error.reason) {
    case 'unauthenticated':
      return 'Sign in before changing documents.';
    case 'rejected-type':
      return rejectedTypeMessage(error.kind);
    case 'upload-failed':
      return 'The file did not upload. Nothing was saved.';
    case 'commit-failed':
      return 'The version list could not be saved.';
    case 'protected':
      return 'The only version cannot be deleted.';
    case 'cleanup-failed':
      return 'The version list is saved, but an older file is still in storage.';
    default: {
      const unexpected: never = error.reason;
      throw new Error(`Unexpected document write failure: ${String(unexpected)}`);
    }
  }
}
