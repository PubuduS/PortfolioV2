import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnInit,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  disabled,
  type FieldTree,
  form,
  FormField,
  required,
  submit as submitForm,
} from '@angular/forms/signals';

import { webUrl } from '@portfolio-v2/shared/validators';
import {
  type CertificateDraftFailure,
  type CertificateEditTarget,
  type CertificateFormValues,
  type ICertificateCard,
  NO_CREDENTIAL_ID,
  toCertificateDraft,
} from '@portfolio-v2/state/dataModels';

/** One submission error attached to a field. */
interface SubmissionError {
  kind: string;
  fieldTree?: FieldTree<unknown>;
}

/**
 * A blank certificate. A new object each time so a later edit cannot change the reset value.
 * @returns empty certificate values
 */
function emptyCertificate(): CertificateFormValues {
  return {
    title: '',
    organization: '',
    completedDate: '',
    credentialID: '',
    certification: 'Here',
    certificateURL: '',
    description: '',
  };
}

/**
 * Add and edit use the same form. It emits a certificate record and holds no services.
 */
@Component({
  selector: 'admin-certificate-form',
  standalone: true,
  imports: [FormField],
  templateUrl: './certificate-form.component.html',
  styleUrl: './certificate-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateFormComponent implements OnInit {
  /** Record being created or edited. */
  public readonly target = input.required<CertificateEditTarget>();

  /** True while a save is in flight. */
  public readonly disabled = input(false);

  /** Certificate ready to save. */
  public readonly submitted = output<ICertificateCard>();

  /** Values the editor is changing. */
  private readonly model = signal<CertificateFormValues>(emptyCertificate());

  /** Editor fields. An earned certificate needs a link. One in progress may leave it empty. */
  protected readonly editor = form(this.model, (fields) => {
    disabled(fields, { when: () => this.disabled() });
    required(fields.title);
    required(fields.organization);
    required(fields.completedDate);
    required(fields.certification);
    required(fields.description);
    required(fields.certificateURL, {
      when: ({ valueOf }) => valueOf(fields.certification) === 'Here',
    });
    webUrl(fields.certificateURL);
  });

  /** Shown when the record cannot be built and no single field owns the failure. */
  protected readonly formError = signal<string | null>(null);

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
   * Emit a certificate, or show the first rule that failed.
   */
  public async submit(): Promise<void> {
    if (this.disabled()) {
      return;
    }
    await submitForm(this.editor, async () => {
      this.formError.set(null);
      const target = this.target();
      const result = toCertificateDraft(
        target.mode === 'new' ? target.id : target.certificate.id,
        this.editor().value(),
      );
      if (!result.ok) {
        return this.draftError(result.reason);
      }
      this.submitted.emit(result.certificate);
      return undefined;
    });
  }

  /**
   * Fill the form from the record this dialog was opened with.
   * @param target record the editor should show
   */
  private applyTarget(target: CertificateEditTarget): void {
    const key = target.mode === 'new'
      ? `new:${target.id}`
      : `edit:${target.certificate.id}`;
    if (key === this.appliedKey) {
      return;
    }
    this.appliedKey = key;
    this.formError.set(null);
    if (target.mode === 'new') {
      this.editor().reset(emptyCertificate());
      return;
    }
    const { certificate } = target;
    this.editor().reset({
      title: certificate.title,
      organization: certificate.organization,
      completedDate: certificate.completedDate,
      credentialID: certificate.credentialID === NO_CREDENTIAL_ID ? '' : certificate.credentialID,
      certification: certificate.certification,
      certificateURL: certificate.certificateURL ?? '',
      description: certificate.description,
    });
  }

  /**
   * Map a draft failure onto the field that owns it.
   * @param reason rule that failed
   * @returns submission errors, or undefined when the failure has no field
   */
  private draftError(reason: CertificateDraftFailure): SubmissionError[] | undefined {
    if (reason === 'missing-url') {
      return [{ fieldTree: this.editor.certificateURL, kind: 'required' }];
    }
    if (reason === 'invalid-url') {
      return [{ fieldTree: this.editor.certificateURL, kind: 'invalidURL' }];
    }
    this.formError.set('This certificate cannot be saved.');
    return undefined;
  }
}
