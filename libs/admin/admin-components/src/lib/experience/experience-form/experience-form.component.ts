import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import {
  form,
  FormField,
  required,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  MatDatepickerInput,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { fieldHasError } from '@portfolio-v2/shared/forms';
import {
  GetDateTimeService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { IExperience } from '@portfolio-v2/state/dataModels';

/** Text, dates, and current-job flag the experience editor saves. */
export interface ExperienceValues {
  /** Position. */
  position: string;
  /** Employer. */
  employer: string;
  /** Start date. */
  startDate: Date | null;
  /** End date. */
  endDate: Date | null;
  /** Current job flag. */
  isCurrent: boolean;
  /** Time period. */
  timePeriod: string;
  /** Short description. */
  shortDescription: string;
  /** Points. */
  points: string;
}

/**
 * A blank job. A new object each time so a later edit cannot change the reset value.
 * @returns empty experience values
 */
export function emptyExperience(): ExperienceValues {
  return {
    position: '',
    employer: '',
    startDate: null,
    endDate: null,
    isCurrent: false,
    timePeriod: '',
    shortDescription: '',
    points: '',
  };
}

/**
 * Fields for one job. The page owns the job list and the save buttons.
 */
@Component({
  selector: 'admin-experience-form',
  standalone: true,
  imports: [
    FormField,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
  ],
  templateUrl: './experience-form.component.html',
  styleUrl: './experience-form.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceFormComponent {
  /** Ask the page to clear the success marks as well as these fields. */
  public readonly cleared = output<void>();

  /** Values the editor is changing. */
  private readonly model = signal<ExperienceValues>(emptyExperience());

  /** Start and end date inputs, in template order. */
  private readonly dateInputs = viewChildren(MatDatepickerInput);

  /** Experience form. */
  public readonly experienceForm = form(this.model, (fields) => {
    required(fields.position);
    required(fields.employer);
    required(fields.startDate);
    required(fields.endDate);
    required(fields.shortDescription);
    required(fields.points);
  });

  /** Date time service. */
  private readonly dateTimeService = inject(GetDateTimeService);

  /** Utility service. */
  private readonly utility = inject(UtilityService);

  /**
   * Keep the date pickers aligned with the form, and refresh the period when both dates exist.
   */
  constructor() {
    effect(() => {
      const inputs = this.dateInputs();
      const { startDate, endDate } = this.experienceForm().value();
      untracked(() => {
        this.writePicker(inputs[0], startDate);
        this.writePicker(inputs[1], endDate);
      });
    });
    effect(() => {
      const startDate = this.experienceForm.startDate().value();
      const endDate = this.experienceForm.endDate().value();
      if (!startDate || !endDate) {
        return;
      }
      untracked(() => this.calculateTimePeriod());
    });
  }

  /** Whether a touched or dirty field currently has this error. */
  public readonly hasError = fieldHasError;

  /**
   * Show one stored job.
   * @param job job to show
   * @param yearsLabel years already calculated for that job
   */
  public apply(job: IExperience, yearsLabel: string): void {
    this.experienceForm().reset({
      position: job.position ?? '',
      employer: job.employer ?? '',
      startDate: this.dateTimeService.convertISOToDate(job.startDate ?? ''),
      endDate: this.dateTimeService.convertISOToDate(job.endDate ?? ''),
      isCurrent: job.isCurrent ?? false,
      timePeriod: `${job.timePeriod} (${yearsLabel})`,
      shortDescription: job.shortDescription ?? '',
      points: this.utility.seperateSentences(job.points) ?? '',
    });
  }

  /**
   * Empty every field.
   */
  public clear(): void {
    this.experienceForm().reset(emptyExperience());
  }

  /**
   * Store the start date chosen in the date picker.
   * @param value selected date
   */
  public setStart(value: Date | null): void {
    if (this.sameInstant(this.experienceForm.startDate().value(), value)) {
      return;
    }
    this.experienceForm.startDate().value.set(value);
  }

  /**
   * Store the end date chosen in the date picker.
   * @param value selected date
   */
  public setEnd(value: Date | null): void {
    if (this.sameInstant(this.experienceForm.endDate().value(), value)) {
      return;
    }
    this.experienceForm.endDate().value.set(value);
  }

  /**
   * Store the current-job flag.
   * @param isCurrent true when the job is current
   */
  public setCurrent(isCurrent: boolean): void {
    this.experienceForm.isCurrent().value.set(isCurrent);
  }

  /**
   * Calculate the time period.
   */
  public calculateTimePeriod(): void {
    const { startDate, endDate } = this.experienceForm().value();
    if (!startDate || !endDate) {
      return;
    }
    const startDateStr = this.dateTimeService.convertToISOFormat(startDate).slice(0, 4);
    const endDatestr = this.dateTimeService.convertToISOFormat(endDate).slice(0, 4);
    const timePeriod = `${startDateStr} - ${endDatestr}`;
    if (this.experienceForm.timePeriod().value() === timePeriod) {
      return;
    }
    this.experienceForm.timePeriod().value.set(timePeriod);
  }

  /**
   * Show a date in the matching picker without writing the same instant again.
   * @param input date picker input
   * @param value date to show
   */
  private writePicker(input: MatDatepickerInput<Date> | undefined, value: Date | null): void {
    if (!input || this.sameInstant(input.value, value)) {
      return;
    }
    input.value = value;
  }

  /**
   * Whether two dates are the same instant, including both being empty.
   * @param left first date
   * @param right second date
   * @returns true when both are empty or both have the same time
   */
  private sameInstant(left: Date | null, right: Date | null): boolean {
    if (left === right) {
      return true;
    }
    if (!left || !right) {
      return false;
    }
    return left.getTime() === right.getTime();
  }
}
