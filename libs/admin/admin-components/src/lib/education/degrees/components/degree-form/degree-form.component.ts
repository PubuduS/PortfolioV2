import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { DisplayValidatorErrorsComponent } from '@portfolio-v2/admin/shared/components';
import {
  EducationEditTarget,
  IEducation,
  toEducationDraft,
} from '@portfolio-v2/state/dataModels';

/** Id of the record the public page shows as the full-width tile. */
const FEATURED_RECORD_ID = 1;

/**
 * Add and edit use the same form. It emits an education record and holds no services.
 */
@Component({
  selector: 'admin-degree-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DisplayValidatorErrorsComponent,
  ],
  templateUrl: './degree-form.component.html',
  styleUrl: './degree-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DegreeFormComponent {
  /** Record being created or edited. */
  public readonly target = input.required<EducationEditTarget>();

  /** True while a save is in flight. */
  public readonly disabled = input(false);

  /** Record ready to save. */
  public readonly submitted = output<IEducation>();

  /** Builds the editor form. */
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  /** Editor fields. */
  protected readonly form = this.formBuilder.group({
    title: ['', Validators.required],
    period: ['', Validators.required],
    degree: ['', Validators.required],
    gpa: ['', Validators.required],
    awards: ['', Validators.required],
    credits: ['', Validators.required],
    graduated: ['', Validators.required],
    extra: [''],
  });

  /** Shown when the record cannot be built and no single field owns the failure. */
  protected readonly formError = signal<string | null>(null);

  /** True when the public page lays this record out as the full-width tile. */
  protected readonly isFeaturedRecord = computed(() => {
    const target = this.target();
    const id = target.mode === 'new' ? target.id : target.education.id;
    return id === FEATURED_RECORD_ID;
  });

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
        : `edit:${target.education.id}`;

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
   * Emit a record, or show the first rule that failed.
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
    const result = toEducationDraft(
      target.mode === 'new' ? target.id : target.education.id,
      this.form.getRawValue(),
    );

    if (!result.ok) {
      this.formError.set('This degree cannot be saved.');
      return;
    }

    this.submitted.emit(result.education);
  }

  /**
   * @param target record the editor should show
   */
  private applyTarget(target: EducationEditTarget): void {
    this.formError.set(null);

    if (target.mode === 'new') {
      this.form.reset();
      return;
    }

    const { education } = target;
    this.form.reset({
      title: education.title,
      period: education.period,
      degree: education.degree,
      gpa: education.gpa,
      awards: education.awards,
      credits: education.credits,
      graduated: education.graduated,
      extra: education.extra ?? '',
    });
  }
}
