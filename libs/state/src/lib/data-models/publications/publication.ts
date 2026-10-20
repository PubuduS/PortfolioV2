import {
  IPublication,
  IPublicationDetails,
} from './IPublication';

/** Integer id shared by the card doc and the details doc. */
export type PublicationId = number & { readonly __brand: 'PublicationId' };

/**
 * Where a publication file lives.
 * Bundled files ship in the app and must never be deleted.
 */
export type PublicationAsset =
  | { readonly source: 'bundled'; readonly url: string }
  | { readonly source: 'storage'; readonly url: string };

/** A file the owner just picked, or an asset already stored. */
export type AssetInput = PublicationAsset | File;

/**
 * One publication. The card document and the details document are the same record.
 */
export interface Publication {
  /** Shared id. The doc id is `publication-` plus this number padded to two digits. */
  readonly id: PublicationId,
  /** Title shown on the card. */
  readonly title: string,
  /**
   * Title stored on the details document.
   * Live records use a full paper title here and a shorter title on the card.
   */
  readonly detailTitle: string,
  /** Card subtitle. The public card shows this as keywords. */
  readonly keywords: string,
  /** Short description on the card. */
  readonly summary: string,
  /** Authors line on the details document. */
  readonly authors: string,
  /** Abstract paragraphs. Stored on the details document as `abstarct`. */
  readonly abstract: readonly string[],
  /** Citation on the details document. */
  readonly citation: string,
  /** Cover image. */
  readonly cover: PublicationAsset,
  /** Downloadable paper. Absent when the card has no download. */
  readonly paper: { readonly asset: PublicationAsset; readonly fileName: string } | null,
}

/** What the form emits. The id is fixed when the editor opens. */
export interface PublicationDraft extends Omit<Publication, 'cover' | 'paper'> {
  /** Cover image, either a new file or the asset already stored. */
  readonly cover: AssetInput,
  /** Optional paper. `fileName` is required when this is set. */
  readonly paper: { readonly asset: AssetInput; readonly fileName: string } | null,
}

/** Raw form values. Field validators stay on the form; this is the model boundary. */
export interface PublicationFormValues {
  /** Id chosen when the editor opened. */
  readonly id: number,
  /** `new` has no stored cover yet. */
  readonly mode: 'new' | 'edit',
  /** Card title. */
  readonly title: string,
  /** Details-document title. */
  readonly detailTitle: string,
  /** Keywords. */
  readonly keywords: string,
  /** Short description. */
  readonly summary: string,
  /** Authors. */
  readonly authors: string,
  /** Abstract as one text area. Blank lines separate paragraphs. */
  readonly abstractText: string,
  /** Citation. */
  readonly citation: string,
  /** Cover file or existing asset. */
  readonly cover: AssetInput | null,
  /** Paper file or existing asset. Null when the publication has no download. */
  readonly paper: AssetInput | null,
  /** Download file name. Required when `paper` is set. */
  readonly fileName: string,
}

/** Why a form payload is not a draft. */
export type DraftFailure =
  | 'invalid-id'
  | 'missing-cover'
  | 'empty-abstract'
  | 'missing-file-name'
  | 'unsupported-cover'
  | 'unsupported-paper';

/** Result of turning form values into a draft. */
export type DraftResult =
  | { readonly ok: true; readonly draft: PublicationDraft }
  | { readonly ok: false; readonly reason: DraftFailure };

/** Which record a dialog was opened with. */
export type EditTarget =
  | { readonly mode: 'new'; readonly id: PublicationId }
  | { readonly mode: 'edit'; readonly publication: Publication };

/** Firestore collection names for the two halves of a publication. */
export const PUBLICATION_COLLECTIONS = {
  card: 'publication-section',
  details: 'publication-details-section',
} as const;

/**
 * Brand a positive integer id.
 * @param value positive integer
 * @returns branded id
 */
function toPublicationId(value: number): PublicationId {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid publication id: ${value}`);
  }
  return value as PublicationId;
}

/**
 * @param id publication id
 * @returns at least two digits
 */
function pad2(id: PublicationId): string {
  return String(id).padStart(2, '0');
}

/**
 * @param url stored url
 * @returns bundled when the file ships under `assets/`, otherwise storage
 */
function parseAsset(url: string): PublicationAsset {
  if (url.startsWith('assets/')) {
    return { source: 'bundled', url };
  }
  return { source: 'storage', url };
}

/**
 * @param card card document
 * @param details matching details document, when one exists
 * @returns joined publication
 */
function toPublication(
  card: IPublication,
  details: IPublicationDetails | undefined,
): Publication {
  return {
    id: toPublicationId(card.id),
    title: card.title,
    detailTitle: details?.title ?? card.title,
    keywords: card.subTitle,
    summary: card.shortDesc,
    authors: details?.authors ?? '',
    abstract: details?.abstarct ?? [],
    citation: details?.citation ?? '',
    cover: parseAsset(card.imageUrl),
    paper: card.downloadUrl
      ? { asset: parseAsset(card.downloadUrl), fileName: card.downloadFileName }
      : null,
  };
}

/**
 * @param abstractText text area value
 * @returns paragraphs split on blank lines, trimmed, with empty ones removed
 */
function splitAbstract(abstractText: string): string[] {
  return abstractText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

/**
 * Join cards to details by id.
 * A card with no details doc gets empty details. Orphan details are dropped.
 * @param cards card documents
 * @param details details documents
 * @returns publications ordered by id
 */
export function joinPublications(
  cards: readonly IPublication[] | undefined,
  details: readonly IPublicationDetails[] | undefined,
): Publication[] {
  const detailsById = new Map((details ?? []).map((item) => [item.id, item]));
  return (cards ?? [])
    .map((card) => toPublication(card, detailsById.get(card.id)))
    .sort((left, right) => left.id - right.id);
}

/**
 * Encode one publication back into the two stored documents.
 * `btnMoreDisable` is always false. `btnDownloadDisable` is true only when there is no paper.
 * @param publication joined publication
 * @returns card and details documents
 */
export function toPublicationDocs(
  publication: Publication,
): { card: IPublication; details: IPublicationDetails } {
  const card: IPublication = {
    id: publication.id,
    title: publication.title,
    subTitle: publication.keywords,
    imageUrl: publication.cover.url,
    shortDesc: publication.summary,
    btnMoreDisable: false,
    btnDownloadDisable: publication.paper === null,
    downloadFileName: publication.paper?.fileName ?? '',
  };
  if (publication.paper) {
    card.downloadUrl = publication.paper.asset.url;
  }
  return {
    card,
    details: {
      id: publication.id,
      title: publication.detailTitle,
      authors: publication.authors,
      abstarct: publication.abstract,
      citation: publication.citation,
    },
  };
}

/**
 * Firestore document paths for both halves of a publication.
 * @param id publication id
 * @returns card path and details path
 */
export function publicationDocPaths(id: PublicationId): { card: string; details: string } {
  const docId = `publication-${pad2(id)}`;
  return {
    card: `${PUBLICATION_COLLECTIONS.card}/${docId}`,
    details: `${PUBLICATION_COLLECTIONS.details}/${docId}`,
  };
}

/**
 * Storage object path for a cover or a paper.
 * Names match the live bucket so a replacement overwrites the same object.
 * @param id publication id
 * @param kind cover or paper
 * @returns storage path
 */
export function publicationFilePath(id: PublicationId, kind: 'cover' | 'paper'): string {
  const padded = pad2(id);
  return kind === 'cover'
    ? `portfolio/publications/publication-card-images/ID-${padded}-Image.webp`
    : `portfolio/publications/papers/ID-${padded}-Paper.pdf`;
}

/**
 * Next id. The max is taken over both collections so an orphan details doc cannot collide.
 * @param cards card documents, or undefined when the collection has not loaded
 * @param details details documents, or undefined when the collection has not loaded
 * @returns one higher than the largest id, or 1 when both collections are empty
 */
export function nextPublicationId(
  cards: readonly { readonly id: number }[] | undefined,
  details: readonly { readonly id: number }[] | undefined,
): PublicationId {
  const ids = [...(cards ?? []), ...(details ?? [])]
    .map((item) => item.id)
    .filter((id) => Number.isInteger(id) && id >= 1);
  const next = ids.length === 0 ? 1 : Math.max(...ids) + 1;
  return toPublicationId(next);
}

/**
 * Docs to delete, and storage objects to delete after the docs are gone.
 * Bundled assets are never listed.
 * @param publication publication being removed
 * @returns document paths and storage paths
 */
export function planDelete(publication: Publication): { docs: string[]; files: string[] } {
  const paths = publicationDocPaths(publication.id);
  const files: string[] = [];
  if (publication.cover.source === 'storage') {
    files.push(publicationFilePath(publication.id, 'cover'));
  }
  if (publication.paper?.asset.source === 'storage') {
    files.push(publicationFilePath(publication.id, 'paper'));
  }
  return {
    docs: [paths.card, paths.details],
    files,
  };
}

/**
 * Build a draft from raw form values.
 * @param values form payload
 * @returns the draft, or the first rule that failed
 */
export function toPublicationDraft(values: PublicationFormValues): DraftResult {
  if (!Number.isInteger(values.id) || values.id < 1) {
    return { ok: false, reason: 'invalid-id' };
  }
  if (values.cover === null) {
    return { ok: false, reason: 'missing-cover' };
  }
  if (values.cover instanceof File && !values.cover.type.startsWith('image/')) {
    return { ok: false, reason: 'unsupported-cover' };
  }
  const abstract = splitAbstract(values.abstractText);
  if (abstract.length === 0) {
    return { ok: false, reason: 'empty-abstract' };
  }
  if (values.paper instanceof File && values.paper.type !== 'application/pdf') {
    return { ok: false, reason: 'unsupported-paper' };
  }
  const fileName = values.fileName.trim();
  if (values.paper !== null && fileName.length === 0) {
    return { ok: false, reason: 'missing-file-name' };
  }
  return {
    ok: true,
    draft: {
      id: toPublicationId(values.id),
      title: values.title.trim(),
      detailTitle: values.detailTitle.trim(),
      keywords: values.keywords.trim(),
      summary: values.summary.trim(),
      authors: values.authors.trim(),
      abstract,
      citation: values.citation.trim(),
      cover: values.cover,
      paper: values.paper === null ? null : { asset: values.paper, fileName },
    },
  };
}

/**
 * Join paragraphs the same way the form splits them.
 * @param paragraphs abstract paragraphs
 * @returns text area value
 */
export function abstractAsText(paragraphs: readonly string[]): string {
  return paragraphs.join('\n\n');
}
