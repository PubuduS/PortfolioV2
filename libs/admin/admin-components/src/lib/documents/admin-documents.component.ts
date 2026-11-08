import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import {
  AdminDeleteDialogComponent,
  openAdminDialog,
} from '@portfolio-v2/admin/shared/components';
import { DocumentCatalogReader } from '@portfolio-v2/shared/services';
import {
  canDelete,
  createVersionId,
  DOCUMENT_KIND_SPECS,
  documentWriteMessage,
  parseKind,
  type CatalogView,
  type DocumentKind,
  type DocumentVersion,
  type VersionId,
} from '@portfolio-v2/state/dataModels';
import { DocumentVersionRemover } from './services/document-version-remover';
import { DocumentWriter } from './services/document-writer.service';

/** Labels shown for each document kind. */
const KIND_LABELS: Record<DocumentKind, string> = {
  resume: 'Resume',
  'cover-letter': 'Cover Letter',
};

/** File-name stem used when a version is downloaded. */
const VERSION_NAME_STEM: Record<DocumentKind, string> = {
  resume: 'resume',
  'cover-letter': 'cover_letter',
};

/** Six-digit suffix span. `createVersionId` accepts 0 through 999999. */
const ENTROPY_SPAN = 1_000_000;

/** How many distinct values a uint32 from `crypto.getRandomValues` can take. */
const UINT32_CARDINALITY = 2 ** 32;

/**
 * Draws at or above this limit are discarded.
 * A uint32 range is not a multiple of `ENTROPY_SPAN`, so a raw modulo
 * would make the lower suffixes slightly more likely.
 */
const UNBIASED_UINT32_LIMIT = UINT32_CARDINALITY - (UINT32_CARDINALITY % ENTROPY_SPAN);

/**
 * Uniform integer from 0 through 999999.
 * The leftover tail of the uint32 range is discarded before the modulo.
 * @returns six-digit entropy
 */
function versionEntropy(): number {
  const buffer = new Uint32Array(1);
  const draw = crypto.getRandomValues(buffer)[0];
  if (draw >= UNBIASED_UINT32_LIMIT) {
    return versionEntropy();
  }
  return draw % ENTROPY_SPAN;
}

/** One table row. Older rows come first, and the current row is last. */
interface VersionRow {
  /** Whether the delete button is enabled for this row. */
  readonly canDelete: boolean;
  /** File name shown in the table. */
  readonly name: string;
  /** Upload time formatted for the table. */
  readonly uploadedAtLabel: string;
  /** Stored version this row represents. */
  readonly version: DocumentVersion;
}

/**
 * Formats an ISO timestamp as a UTC date and time.
 * @param uploadedAt ISO timestamp
 * @returns `YYYY-MM-DD HH:mm:ss` in UTC, or the original string when it is not a date.
 */
function formatUploadedAt(uploadedAt: string): string {
  const date = new Date(uploadedAt);
  if (Number.isNaN(date.getTime())) {
    return uploadedAt;
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Builds display rows without sorting by timestamp. Index 0 stays the current version.
 * @param kind document kind
 * @param versions catalog order, current first
 * @returns oldest previous version first, current last
 */
function versionRowsFor(
  kind: DocumentKind,
  versions: readonly DocumentVersion[],
): readonly VersionRow[] {
  const stem = VERSION_NAME_STEM[kind];
  const oldestFirst = [...versions].reverse();
  return oldestFirst.map((version, index) => {
    const isCurrentRow = index === oldestFirst.length - 1;
    return {
      canDelete: versions.length > 1,
      name: isCurrentRow ? `${stem}_current` : `${stem}_v${index + 1}`,
      uploadedAtLabel: formatUploadedAt(version.uploadedAt),
      version,
    };
  });
}

/**
 * Admin list for one document kind.
 * The route provides the writer. Resume and cover letter are the same page with different data.
 */
@Component({
  selector: 'admin-documents',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './admin-documents.component.html',
  styleUrl: './admin-documents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDocumentsComponent {
  /** Last upload error, or null. */
  protected readonly message = signal<string | null>(null);

  /** True while upload is in flight. The file input is disabled. */
  protected readonly isUploading = signal(false);

  /** Kind from the route. Invalid params redirect to the resume admin path. */
  protected readonly kind = computed(() => {
    const raw = this.routeData()['kind'];
    return parseKind(typeof raw === 'string' ? raw : null);
  });

  /** Catalog for the selected kind. */
  protected readonly view = computed((): CatalogView => {
    const kind = this.kind();
    if (kind === null) {
      return { status: 'loading' };
    }
    return this.reader.view(kind)();
  });

  /** Table rows for a ready catalog. Empty while loading or unreadable. */
  protected readonly versionRows = computed((): readonly VersionRow[] => {
    const kind = this.kind();
    const current = this.view();
    if (kind === null || current.status !== 'ready') {
      return [];
    }
    return versionRowsFor(kind, current.catalog.versions);
  });

  /** Label of the kind this page is showing. */
  protected readonly kindLabel = computed(() => {
    const kind = this.kind();
    return kind === null ? KIND_LABELS.resume : KIND_LABELS[kind];
  });

  /** Admin path for the resume list. */
  protected readonly resumePath = DOCUMENT_KIND_SPECS.resume.adminPath;

  /** Admin path for the cover letter list. */
  protected readonly coverLetterPath = DOCUMENT_KIND_SPECS['cover-letter'].adminPath;

  /** File-picker accept list for the current kind. */
  protected readonly fileAccept = computed(() => {
    const kind = this.kind() ?? 'resume';
    const spec = DOCUMENT_KIND_SPECS[kind];
    return `${spec.extension},${spec.contentType}`;
  });

  /** True when Try again can repeat the stored file. */
  protected readonly canRetry = computed(() => this.attempt() !== null && this.message() !== null);

  /** Route for this page. */
  private readonly route = inject(ActivatedRoute);

  /** Route data for this page. */
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });

  /** Catalog reads. */
  private readonly reader = inject(DocumentCatalogReader);

  /** The writer for this route. */
  private readonly writer = inject(DocumentWriter);

  /** Opens the delete dialog. */
  private readonly dialog = inject(MatDialog);

  /** View container the dialog attaches to, so it sees this route's writer. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /** Router used when the kind data is not a document kind. */
  private readonly router = inject(Router);

  /** One attempt id for the current File, cleared only after upload succeeds. */
  private readonly attempt = signal<{ file: File; id: VersionId } | null>(null);

  /**
   * Send a bad kind back to the resume admin page.
   */
  constructor() {
    effect(() => {
      if (this.kind() === null) {
        this.router.navigateByUrl(DOCUMENT_KIND_SPECS.resume.adminPath).catch(() => undefined);
      }
    });
  }

  /**
   * Whether this version can be removed without emptying the catalog.
   * @param version row
   * @returns true when the row may be deleted
   */
  protected canDeleteVersion(version: DocumentVersion): boolean {
    const current = this.view();
    return current.status === 'ready' && canDelete(current.catalog, version.id);
  }

  /**
   * Upload the picked file. Reuses the attempt id while the same File object is retried.
   * @param file file from the input
   */
  protected async onFile(file: File): Promise<void> {
    if (this.view().status === 'unreadable') {
      this.message.set('This version list cannot be read. Nothing was changed.');
      return;
    }
    const kind = this.kind();
    if (kind === null) {
      return;
    }
    const stored = this.attempt();
    const attempt = stored?.file === file
      ? stored
      : { file, id: createVersionId(Date.now(), versionEntropy()) };
    this.attempt.set(attempt);
    this.isUploading.set(true);
    this.message.set(null);
    try {
      await this.writer.upload(kind, file, attempt.id);
      this.attempt.set(null);
    } catch (error) {
      this.message.set(documentWriteMessage(error));
    } finally {
      this.isUploading.set(false);
    }
  }

  /**
   * Read the file input and upload that file.
   * @param event change event from the file input
   */
  protected async onInput(event: Event): Promise<void> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.files === null || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    await this.onFile(file);
  }

  /**
   * Retry the stored attempt. No-op when there is none.
   */
  protected async retry(): Promise<void> {
    const stored = this.attempt();
    if (stored) {
      await this.onFile(stored.file);
    }
  }

  /**
   * Open the delete dialog in this page's injector.
   * @param version older row
   */
  protected confirmDelete(version: DocumentVersion): void {
    const kind = this.kind();
    if (kind === null || !this.canDeleteVersion(version)) {
      return;
    }
    openAdminDialog(this.dialog, this.viewContainerRef, AdminDeleteDialogComponent, {
      title: 'Delete version',
      lines: [version.uploadedAt],
      record: { kind, version },
      writer: DocumentVersionRemover,
      writeMessage: documentWriteMessage,
    });
  }
}
