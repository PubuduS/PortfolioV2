import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  disabled,
  type FieldTree,
  form,
  FormField,
  required,
  submit as submitForm,
  validate,
} from '@angular/forms/signals';

import {
  abstractAsText,
  type AssetInput,
  type DraftFailure,
  type EditTarget,
  type PublicationDraft,
  toPublicationDraft,
} from '@portfolio-v2/state/dataModels';

/** One submission error attached to a field. */
interface SubmissionError {
  /** Error kind. */
  kind: string;
  /** Field tree. */
  fieldTree?: FieldTree<unknown>;
}

/** Text and files the publication editor edits. */
interface PublicationValues {
  /** Title. */
  title: string;
  /** Detail title. */
  detailTitle: string;
  /** Keywords. */
  keywords: string;
  /** Summary. */
  summary: string;
  /** Authors. */
  authors: string;
  /** Abstract text. */
  abstractText: string;
  /** Citation. */
  citation: string;
  /** File name. */
  fileName: string;
  /** Cover. */
  cover: AssetInput | null;
  /** Paper. */
  paper: AssetInput | null;
}

/**
 * Turn a title into a download name when the owner has not typed one.
 * @param title card title
 * @returns a file name without an extension
 */
function slugFileName(title: string): string {
  const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'paper';
}

/**
 * A blank publication. A new object each time so a later edit cannot change the reset value.
 * @returns empty publication values
 */
function emptyPublication(): PublicationValues {
  return {
    title: '',
    detailTitle: '',
    keywords: '',
    summary: '',
    authors: '',
    abstractText: '',
    citation: '',
    fileName: '',
    cover: null,
    paper: null,
  };
}

/**
 * Add and edit use the same form. It emits raw values as a draft and holds no services.
 */
@Component({
  selector: 'admin-publication-form',
  standalone: true,
  imports: [
    FormField,
    MatButtonModule,
  ],
  templateUrl: './publication-form.component.html',
  styleUrl: './publication-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicationFormComponent implements OnInit, OnDestroy {
  /** Record being created or edited. */
  public readonly target = input.required<EditTarget>();

  /** True while a save is in flight. */
  public readonly disabled = input(false);

  /** Draft ready to save. */
  public readonly submitted = output<PublicationDraft>();

  /** Values the editor is changing. Cover and paper stay files, not data urls. */
  private readonly model = signal<PublicationValues>(emptyPublication());

  /** Editor fields. */
  protected readonly editor = form(this.model, (fields) => {
    disabled(fields, { when: () => this.disabled() });
    required(fields.title);
    required(fields.detailTitle);
    required(fields.keywords);
    required(fields.summary);
    required(fields.authors);
    required(fields.abstractText);
    required(fields.citation);
    required(fields.cover);
    required(fields.fileName, {
      when: ({ valueOf }) => valueOf(fields.paper) != null,
    });
    validate(fields.cover, ({ value }) => {
      const asset = value();
      if (asset instanceof File && !asset.type.startsWith('image/')) {
        return { kind: 'unsupported-cover' };
      }
      return undefined;
    });
    validate(fields.paper, ({ value }) => {
      const asset = value();
      if (asset instanceof File && asset.type !== 'application/pdf') {
        return { kind: 'unsupported-paper' };
      }
      return undefined;
    });
  });

  /** Object url or stored url for the cover preview. */
  protected readonly coverPreview = signal<string | null>(null);

  /** Shown when the draft cannot be built and no single field owns the failure. */
  protected readonly formError = signal<string | null>(null);

  /** Object url made for a picked cover file. Revoked when replaced or on destroy. */
  private objectUrl: string | null = null;

  /** Key of the target the fields were last reset for. */
  private appliedKey = '';

  /**
   * Load the record this dialog was opened with, and later records that replace it.
   */
  constructor() {
    effect(() => {
      const target = this.target();
      untracked(() => this.applyTarget(target));
    });
  }

  /**
   * Fill the fields before the first render.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.applyTarget(this.target());
  }

  /**
   * Release the object URL created for a local cover preview.
   * @inheritdoc
   */
  public ngOnDestroy(): void {
    this.revokePreview();
  }

  /**
   * Whether a touched or dirty field currently has this error.
   * @param field field to read
   * @param kind error kind
   * @returns true when that error should be shown
   */
  protected hasError(field: FieldTree<unknown>, kind: string): boolean {
    const state = field();
    return (state.touched() || state.dirty()) && state.getError(kind) !== undefined;
  }

  /**
   * Store a picked cover and show a preview.
   * @param event file input change
   */
  protected onCoverSelected(event: Event): void {
    const file = this.fileFrom(event);
    if (!file) {
      return;
    }
    this.editor.cover().value.set(file);
    this.syncCoverPreview(file);
  }

  /**
   * Store a picked paper. An empty file name becomes a slug of the title.
   * @param event file input change
   */
  protected onPaperSelected(event: Event): void {
    const file = this.fileFrom(event);
    if (!file) {
      return;
    }
    this.editor.paper().value.set(file);
    if (!this.editor.fileName().value().trim()) {
      this.editor.fileName().value.set(slugFileName(this.editor.title().value()));
    }
  }

  /**
   * Drop the paper. The cover stays.
   */
  protected removePaper(): void {
    this.editor.paper().value.set(null);
    this.editor.fileName().value.set('');
  }

  /**
   * Emit a draft, or show the first rule that failed.
   */
  public async submit(): Promise<void> {
    if (this.disabled()) {
      return;
    }
    await submitForm(this.editor, async () => {
      this.formError.set(null);
      const target = this.target();
      const value = this.editor().value();
      const result = toPublicationDraft({
        id: target.mode === 'new' ? target.id : target.publication.id,
        mode: target.mode,
        title: value.title,
        detailTitle: value.detailTitle,
        keywords: value.keywords,
        summary: value.summary,
        authors: value.authors,
        abstractText: value.abstractText,
        citation: value.citation,
        cover: value.cover,
        paper: value.paper,
        fileName: value.fileName,
      });
      if (!result.ok) {
        return this.draftError(result.reason);
      }
      this.submitted.emit(result.draft);
      return undefined;
    });
  }

  /**
   * Fill the form from the record this dialog was opened with.
   * @param target record the editor should show
   */
  private applyTarget(target: EditTarget): void {
    const key = target.mode === 'new'
      ? `new:${target.id}`
      : `edit:${target.publication.id}`;
    if (key === this.appliedKey) {
      return;
    }
    this.appliedKey = key;
    this.formError.set(null);
    const values = target.mode === 'new' ? emptyPublication() : this.valuesFrom(target);
    this.editor().reset(values);
    this.syncCoverPreview(values.cover);
  }

  /**
   * Values stored on the publication being edited.
   * @param target edit target
   * @returns form values for that publication
   */
  private valuesFrom(target: Extract<EditTarget, { mode: 'edit' }>): PublicationValues {
    const { publication } = target;
    return {
      title: publication.title,
      detailTitle: publication.detailTitle,
      keywords: publication.keywords,
      summary: publication.summary,
      authors: publication.authors,
      abstractText: abstractAsText(publication.abstract),
      citation: publication.citation,
      fileName: publication.paper?.fileName ?? '',
      cover: publication.cover,
      paper: publication.paper?.asset ?? null,
    };
  }

  /**
   * Map a draft failure onto the field that owns it.
   * @param reason draft rule that failed
   * @returns submission errors, or undefined when the failure has no field
   */
  private draftError(reason: DraftFailure): SubmissionError[] | undefined {
    if (reason === 'missing-cover' || reason === 'unsupported-cover') {
      return [{ fieldTree: this.editor.cover, kind: reason }];
    }
    if (reason === 'empty-abstract') {
      return [{ fieldTree: this.editor.abstractText, kind: 'empty-abstract' }];
    }
    if (reason === 'unsupported-paper') {
      return [{ fieldTree: this.editor.paper, kind: 'unsupported-paper' }];
    }
    if (reason === 'missing-file-name') {
      return [{ fieldTree: this.editor.fileName, kind: 'missing-file-name' }];
    }
    this.formError.set('This publication cannot be saved.');
    return undefined;
  }

  /**
   * Store the cover preview for a file or a stored asset.
   * @param asset cover file or stored asset
   */
  private syncCoverPreview(asset: AssetInput | null): void {
    this.revokePreview();
    if (asset instanceof File) {
      this.objectUrl = URL.createObjectURL(asset);
      this.coverPreview.set(this.objectUrl);
      return;
    }
    this.coverPreview.set(asset ? asset.url : null);
  }

  /**
   * Read the first file from a file-input change.
   * @param event file input change
   * @returns the first selected file, or null
   */
  private fileFrom(event: Event): File | null {
    if (!(event.target instanceof HTMLInputElement)) {
      return null;
    }
    return event.target.files?.[0] ?? null;
  }

  /**
   * Drop the preview url created for a local file.
   */
  private revokePreview(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
