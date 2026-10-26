import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { DisplayValidatorErrorsComponent } from '@portfolio-v2/admin/shared/components';
import { urlValidator } from '@portfolio-v2/shared/validators';
import {
  CertificateDraftFailure,
  CertificateEditTarget,
  CertificateStatus,
  ICertificateCard,
  NO_CREDENTIAL_ID,
  toCertificateDraft,
} from '@portfolio-v2/state/dataModels';

/**
 * Add and edit use the same form. It emits a certificate record and holds no services.
 */
@Component({
  selector: 'admin-certificate-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DisplayValidatorErrorsComponent,
  ],
  templateUrl: './certificate-form.component.html',
  styleUrl: './certificate-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateFormComponent {
  /** Record being created or edited. */
  public readonly target = input.required<CertificateEditTarget>();

  /** True while a save is in flight. */
  public readonly disabled = input(false);

  /** Certificate ready to save. */
  public readonly submitted = output<ICertificateCard>();

  /** Builds the editor form. */
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  /** Editor fields. */
  protected readonly form = this.formBuilder.group({
    title: ['', Validators.required],
    organization: ['', Validators.required],
    completedDate: ['', Validators.required],
    credentialID: [''],
    certification: this.formBuilder.control<CertificateStatus>('Here', Validators.required),
    certificateURL: ['', urlValidator()],
    description: ['', Validators.required],
  });

  /** Shown when the record cannot be built and no single field owns the failure. */
  protected readonly formError = signal<string | null>(null);

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
        : `edit:${target.certificate.id}`;

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

    this.form.controls.certification.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.syncUrlValidators());
  }

  /**
   * Emit a certificate, or show the first rule that failed.
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
    const result = toCertificateDraft(
      target.mode === 'new' ? target.id : target.certificate.id,
      this.form.getRawValue(),
    );

    if (!result.ok) {
      this.showDraftFailure(result.reason);
      return;
    }

    this.submitted.emit(result.certificate);
  }

  /**
   * @param target record the editor should show
   */
  private applyTarget(target: CertificateEditTarget): void {
    this.formError.set(null);

    if (target.mode === 'new') {
      this.form.reset();
      this.syncUrlValidators();
      return;
    }

    const { certificate } = target;
    this.form.reset({
      title: certificate.title,
      organization: certificate.organization,
      completedDate: certificate.completedDate,
      credentialID: certificate.credentialID === NO_CREDENTIAL_ID ? '' : certificate.credentialID,
      certification: certificate.certification,
      certificateURL: certificate.certificateURL ?? '',
      description: certificate.description,
    });
    this.syncUrlValidators();
  }

  /**
   * @param reason rule that failed
   */
  private showDraftFailure(reason: CertificateDraftFailure): void {
    const { certificateURL } = this.form.controls;

    if (reason === 'missing-url') {
      certificateURL.setErrors({ required: true });
      return;
    }

    if (reason === 'invalid-url') {
      certificateURL.setErrors({ invalidURL: true });
      return;
    }

    this.formError.set('This certificate cannot be saved.');
  }

  /**
   * An earned certificate needs a link. One in progress may leave it empty.
   */
  private syncUrlValidators(): void {
    const { certification, certificateURL } = this.form.controls;

    certificateURL.setValidators(
      certification.value === 'Here'
        ? [Validators.required, urlValidator()]
        : [urlValidator()],
    );
    certificateURL.updateValueAndValidity({ emitEvent: false });
  }
}
