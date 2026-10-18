import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import { DisplayValidatorErrorsComponent } from '@portfolio-v2/admin/shared/components';
import {
  abstractAsText,
  AssetInput,
  DraftFailure,
  EditTarget,
  PublicationDraft,
  toPublicationDraft,
} from '@portfolio-v2/state/dataModels';

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
 * Add and edit use the same form. It emits raw values as a draft and holds no services.
 */
@Component({
  selector: 'admin-publication-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    DisplayValidatorErrorsComponent,
  ],
  templateUrl: './publication-form.component.html',
  styleUrl: './publication-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicationFormComponent implements OnDestroy {
  /** Record being created or edited. */
  public readonly target = input.required<EditTarget>();

  /** True while a save is in flight. */
  public readonly disabled = input(false);

  /** Draft ready to save. */
  public readonly submitted = output<PublicationDraft>();

  /** Builds the editor form. */
  private readonly formBuilder = inject(FormBuilder);

  /** Editor fields. Cover and paper stay as files, not data urls. */
  protected readonly form = this.formBuilder.group({
    title: ['', Validators.required],
    detailTitle: ['', Validators.required],
    keywords: ['', Validators.required],
    summary: ['', Validators.required],
    authors: ['', Validators.required],
    abstractText: ['', Validators.required],
    citation: ['', Validators.required],
    fileName: [''],
    cover: this.formBuilder.control<AssetInput | null>(null, Validators.required),
    paper: this.formBuilder.control<AssetInput | null>(null),
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
   * Reset the fields when the edited record changes, and lock them during a save.
   */
  constructor() {
    effect(() => {
      const target = this.target();
      const key = target.mode === 'new'
        ? `new:${target.id}`
        : `edit:${target.publication.id}`;

      if (key === this.appliedKey) {
        return;
      }

      this.appliedKey = key;
      this.applyTarget(target);
    });

    effect(() => {
      if (this.disabled()) {
        this.form.disable({ emitEvent: false });
        return;
      }

      this.form.enable({ emitEvent: false });
    });
  }

  /**
   * @inheritdoc
   */
  public ngOnDestroy(): void {
    this.revokePreview();
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

    this.setCover(file);
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

    this.setPaper(file);

    const { fileName, title } = this.form.controls;

    if (!fileName.value?.trim()) {
      fileName.setValue(slugFileName(title.value ?? ''));
    }
  }

  /**
   * Drop the paper. The cover stays.
   */
  protected removePaper(): void {
    this.setPaper(null);
    this.form.controls.fileName.setValue('');
  }

  /**
   * Emit a draft, or show the first rule that failed.
   */
  public submit(): void {
    if (this.disabled()) {
      return;
    }
    this.form.markAllAsTouched();
    this.formError.set(null);

    if (this.form.invalid) {
      return;
    }

    const target = this.target();
    const value = this.form.getRawValue();
    const result = toPublicationDraft({
      id: target.mode === 'new' ? target.id : target.publication.id,
      mode: target.mode,
      title: value.title ?? '',
      detailTitle: value.detailTitle ?? '',
      keywords: value.keywords ?? '',
      summary: value.summary ?? '',
      authors: value.authors ?? '',
      abstractText: value.abstractText ?? '',
      citation: value.citation ?? '',
      cover: value.cover,
      paper: value.paper,
      fileName: value.fileName ?? '',
    });

    if (!result.ok) {
      this.showDraftFailure(result.reason);
      return;
    }

    this.submitted.emit(result.draft);
  }

  /**
   * @param target record the editor should show
   */
  private applyTarget(target: EditTarget): void {
    this.formError.set(null);

    if (target.mode === 'new') {
      this.form.reset();
      this.setCover(null);
      this.setPaper(null);
      return;
    }

    const { publication } = target;
    this.form.patchValue({
      title: publication.title,
      detailTitle: publication.detailTitle,
      keywords: publication.keywords,
      summary: publication.summary,
      authors: publication.authors,
      abstractText: abstractAsText(publication.abstract),
      citation: publication.citation,
      fileName: publication.paper?.fileName ?? '',
    });
    this.setCover(publication.cover);
    this.setPaper(publication.paper?.asset ?? null);
  }

  /**
   * @param asset cover file or stored asset
   */
  private setCover(asset: AssetInput | null): void {
    this.form.controls.cover.setValue(asset);
    this.revokePreview();

    if (asset instanceof File) {
      this.objectUrl = URL.createObjectURL(asset);
      this.coverPreview.set(this.objectUrl);
      return;
    }

    this.coverPreview.set(asset ? asset.url : null);
  }

  /**
   * @param asset paper file or stored asset
   */
  private setPaper(asset: AssetInput | null): void {
    const { paper, fileName } = this.form.controls;
    paper.setValue(asset);

    if (asset) {
      fileName.setValidators([Validators.required]);
    } else {
      fileName.clearValidators();
    }

    fileName.updateValueAndValidity();
  }

  /**
   * @param reason draft rule that failed
   */
  private showDraftFailure(reason: DraftFailure): void {
    if (reason === 'missing-cover' || reason === 'unsupported-cover') {
      this.form.controls.cover.setErrors({ [reason]: true });
      return;
    }

    if (reason === 'empty-abstract') {
      this.form.controls.abstractText.setErrors({ 'empty-abstract': true });
      return;
    }

    if (reason === 'unsupported-paper') {
      this.form.controls.paper.setErrors({ 'unsupported-paper': true });
      return;
    }

    if (reason === 'missing-file-name') {
      this.form.controls.fileName.setErrors({ 'missing-file-name': true });
      return;
    }

    this.formError.set('This publication cannot be saved.');
  }

  /**
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
