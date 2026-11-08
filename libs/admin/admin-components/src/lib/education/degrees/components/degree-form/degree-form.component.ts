import {
  ChangeDetectionStrategy,
  Component,
  computed,
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

import {
  type EducationEditTarget,
  type EducationFormValues,
  type IEducation,
  toEducationDraft,
} from '@portfolio-v2/state/dataModels';

/** Id of the record the public page shows as the full-width tile. */
const FEATURED_RECORD_ID = 1;

/**
 * A blank degree. A new object each time so a later edit cannot change the reset value.
 * @returns empty degree values
 */
function emptyDegree(): EducationFormValues {
  return {
    title: '',
    period: '',
    degree: '',
    gpa: '',
    awards: '',
    credits: '',
    graduated: '',
    extra: '',
  };
}

/**
 * Add and edit use the same form. It emits an education record and holds no services.
 */
@Component({
  selector: 'admin-degree-form',
  standalone: true,
  imports: [FormField],
  templateUrl: './degree-form.component.html',
  styleUrl: './degree-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DegreeFormComponent implements OnInit {
  /** Record being created or edited. */
  public readonly target = input.required<EducationEditTarget>();

  /** True while a save is in flight. */
  public readonly disabled = input(false);

  /** Record ready to save. */
  public readonly submitted = output<IEducation>();

  /** Values the editor is changing. */
  private readonly model = signal<EducationFormValues>(emptyDegree());

  /** Editor fields. */
  protected readonly editor = form(this.model, (fields) => {
    disabled(fields, { when: () => this.disabled() });
    required(fields.title);
    required(fields.period);
    required(fields.degree);
    required(fields.gpa);
    required(fields.awards);
    required(fields.credits);
    required(fields.graduated);
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
   * Emit a record, or show the first rule that failed.
   */
  public async submit(): Promise<void> {
    if (this.disabled()) {
      return;
    }
    await submitForm(this.editor, async () => {
      this.formError.set(null);
      const target = this.target();
      const result = toEducationDraft(
        target.mode === 'new' ? target.id : target.education.id,
        this.editor().value(),
      );
      if (!result.ok) {
        this.formError.set('This degree cannot be saved.');
        return undefined;
      }
      this.submitted.emit(result.education);
      return undefined;
    });
  }

  /**
   * Fill the form from the record this dialog was opened with.
   * @param target record the editor should show
   */
  private applyTarget(target: EducationEditTarget): void {
    const key = target.mode === 'new'
      ? `new:${target.id}`
      : `edit:${target.education.id}`;
    if (key === this.appliedKey) {
      return;
    }
    this.appliedKey = key;
    this.formError.set(null);
    if (target.mode === 'new') {
      this.editor().reset(emptyDegree());
      return;
    }
    const { education } = target;
    this.editor().reset({
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
