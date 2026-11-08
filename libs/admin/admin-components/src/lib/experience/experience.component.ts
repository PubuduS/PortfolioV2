import * as _ from 'lodash';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  Signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import {
  type FieldTree,
  form,
  FormField,
  required,
} from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDatepickerInput,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  map,
  of,
  take,
} from 'rxjs';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';

import { IExperience } from '@portfolio-v2/state/dataModels';
import {
  GetDateTimeService,
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { experienceSelector } from '@portfolio-v2/state/selectors';
import { StateActions } from '@portfolio-v2/state';
import { DeleteComformationComponent } from './components/delete-comformation.component';

/** Text, dates, and current-job flag the experience editor saves. */
interface ExperienceValues {
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
function emptyExperience(): ExperienceValues {
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
 * Admin Experience page
 */
@Component({
  selector: 'admin-experience',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDialogModule,
  ],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminExperienceComponent {
  /** Experience */
  public experience: IExperience | undefined;

  /** Number of years of experience */
  public yearsOfExperience: Signal<string> = signal<string>('1 Year');

  /**
   * Array of IExperience.
   * Hold the data from the database
   */
  protected readonly experienceData: Signal<IExperience[] | undefined>;

  /** Values the editor is changing. */
  private readonly model = signal<ExperienceValues>(emptyExperience());

  /** Start and end date inputs, in template order. */
  private readonly dateInputs = viewChildren(MatDatepickerInput);

  /** Experience form */
  protected readonly experienceForm = form(this.model, (fields) => {
    required(fields.position);
    required(fields.employer);
    required(fields.startDate);
    required(fields.endDate);
    required(fields.timePeriod);
    required(fields.shortDescription);
    required(fields.points);
  });

  /** Returns true if the edit is successful */
  protected isEditSuccess = of(false);

  /** Returns true if the add is successful */
  protected isAddSuccess = of(false);

  /** Returns true if the delete is successful */
  protected isDeleteSuccess = of(false);

  /** Selected job */
  protected selectedJob = '';

  /** Date time service */
  private dateTimeService = inject(GetDateTimeService);

  /**
   * constructor
   * @param dialog dialog
   * @param setDataService set data service
   * @param store ngrx store
   * @param utility utility service
   */
  constructor(
    private dialog: MatDialog,
    private setDataService: SetDataService,
    private store: Store,
    private utility: UtilityService,
  ) {
    this.store.dispatch(StateActions.experienceStateConnect());
    this.experienceData = this.store.selectSignal(experienceSelector);
    const firstJob = this.experienceData()?.[0];
    if (firstJob) {
      this.displaySelected(firstJob);
    }
    effect(() => {
      const nextJob = this.experienceData()?.[0];
      if (!nextJob || this.experience) {
        return;
      }
      this.displaySelected(nextJob);
    });
    effect(() => {
      const inputs = this.dateInputs();
      const { startDate, endDate } = this.experienceForm().value();
      untracked(() => {
        this.writePicker(inputs[0], startDate);
        this.writePicker(inputs[1], endDate);
      });
    });
    effect(() => {
      const { startDate, endDate } = this.experienceForm().value();
      if (!startDate || !endDate) {
        return;
      }
      untracked(() => this.calculateTimePeriod());
    });
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
   * Store the start date chosen in the date picker.
   * @param value selected date
   */
  protected setStart(value: Date | null): void {
    if (this.sameInstant(this.experienceForm.startDate().value(), value)) {
      return;
    }
    this.experienceForm.startDate().value.set(value);
  }

  /**
   * Store the end date chosen in the date picker.
   * @param value selected date
   */
  protected setEnd(value: Date | null): void {
    if (this.sameInstant(this.experienceForm.endDate().value(), value)) {
      return;
    }
    this.experienceForm.endDate().value.set(value);
  }

  /**
   * Store the current-job flag.
   * @param isCurrent true when the job is current
   */
  protected setCurrent(isCurrent: boolean): void {
    this.experienceForm.isCurrent().value.set(isCurrent);
  }

  /**
   * Display selected
   * @param exp job details
   */
  public displaySelected(exp: IExperience): void {
    if (exp) {
      this.experience = exp;
      this.selectedJob = this.experience.employer;
      this.totalYearsOfExperience();
      this.experienceForm().reset(this.valuesFrom(this.experience));
    }
  }

  /**
   * Add experience
   */
  protected addExperience(): void {
    if (!this.experienceForm().valid()) {
      return;
    }

    const {
      position, employer, startDate, endDate, isCurrent, timePeriod, shortDescription, points,
    } = this.experienceForm().value();

    let newId = 0;
    if (this.experienceData()) {
      const lastElement = _.first(this.experienceData()!);
      newId = (lastElement?.id ?? 0) + 1;
    } else {
      newId = 1;
    }
    const newExperienceValues: IExperience = {
      id: newId,
      position,
      employer,
      startDate: this.dateTimeService.convertToISOFormat(startDate ?? ''),
      endDate: isCurrent ? 'present' : this.dateTimeService.convertToISOFormat(endDate ?? ''),
      isCurrent,
      timePeriod: this.removeYearsFromTimePeriod(timePeriod),
      shortDescription,
      points: points ? this.utility.breakStringToParagraphs(points) : [],
    };

    const newExperienceValuesArray: IExperience[] = [...this.experienceData()!];
    newExperienceValuesArray[newId - 1] = newExperienceValues;

    if (this.experienceForm().valid()) {
      this.isAddSuccess = this.setDataService.setRecord<IExperience>(`experience-section/experience${this.utility.getPaddedDigits(newId, 2)}/`, newExperienceValues).pipe(
        take(1),
        map((result) => {
          this.store.dispatch(StateActions.experienceStateUpdated({
            experiences: newExperienceValuesArray,
          }));
          return result === 'successfull';
        }),
      );
    }
  }

  /**
   * Calculate the time period
   */
  protected calculateTimePeriod(): void {
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
   * Clear the form
   */
  protected clearForm(): void {
    this.isAddSuccess = of(false);
    this.isEditSuccess = of(false);
    this.isDeleteSuccess = of(false);
    this.experienceForm().reset(emptyExperience());
  }

  /**
   * Delete experience
   */
  protected deleteExperience(): void {
    if (!this.experience) {
      return;
    }

    // Remove from local array
    const newExperienceValuesArray: IExperience[] = [...this.experienceData()!];
    const index = newExperienceValuesArray.findIndex((exp) => exp.id === this.experience!.id);

    if (index !== -1) {
      newExperienceValuesArray.splice(index, 1);
    }

    // Delete from database
    this.isDeleteSuccess = this.setDataService.deleteRecord(`experience-section/experience${this.utility.getPaddedDigits(this.experience.id, 2)}/`).pipe(
      take(1),
      map((result) => {
        if (result === 'successfull') {
          // Update the store with the new array (without the deleted item)
          this.store.dispatch(StateActions.experienceStateUpdated({
            experiences: newExperienceValuesArray,
          }));

          // Clear selection
          this.experience = _.first(newExperienceValuesArray);
          this.selectedJob = this.experience?.employer ?? 'Mock Employer';

          return true;
        }
        return false;
      }),
    );
  }

  /**
   * Edit experience
   */
  protected editExperience(): void {
    if (!this.experience) {
      return;
    }

    const {
      position, employer, startDate, endDate, isCurrent, timePeriod, shortDescription, points,
    } = this.experienceForm().value();

    const newExperienceValues: IExperience = {
      ...this.experience,
      position,
      employer,
      startDate: this.dateTimeService.convertToISOFormat(startDate ?? ''),
      endDate: isCurrent ? 'present' : this.dateTimeService.convertToISOFormat(endDate ?? ''),
      isCurrent,
      timePeriod: this.removeYearsFromTimePeriod(timePeriod),
      shortDescription,
      points: this.utility.breakStringToParagraphs(points),
    };

    const newExperienceValuesArray: IExperience[] = [...this.experienceData()!];
    newExperienceValuesArray[this.experience.id - 1] = newExperienceValues;

    this.isEditSuccess = this.setDataService.setRecord<IExperience>(`experience-section/experience${this.utility.getPaddedDigits(this.experience.id, 2)}/`, newExperienceValues).pipe(
      take(1),
      map((result) => {
        this.store.dispatch(StateActions.experienceStateUpdated({
          experiences: newExperienceValuesArray,
        }));
        return result === 'successfull';
      }),
    );
  }

  /**
   * Open delete confirmation dialog
   */
  protected openDeleteConfirmation(): void {
    const dialogRef = this.dialog.open(DeleteComformationComponent, {
      data: { record: this.experience },
    });

    dialogRef.afterClosed()
      .pipe(
        take(1),
      )
      .subscribe((result) => {
        if (result) {
          this.deleteExperience();
        }
      });
  }

  /**
   * Values for one stored job.
   * @param job job to show
   * @returns form values
   */
  private valuesFrom(job: IExperience): ExperienceValues {
    return {
      position: job.position ?? '',
      employer: job.employer ?? '',
      startDate: this.dateTimeService.convertISOToDate(job.startDate ?? ''),
      endDate: this.dateTimeService.convertISOToDate(job.endDate ?? ''),
      isCurrent: job.isCurrent ?? false,
      timePeriod: `${job.timePeriod} (${this.yearsOfExperience()})`,
      shortDescription: job.shortDescription ?? '',
      points: this.utility.seperateSentences(job.points) ?? '',
    };
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

  /**
   * Remove the years part from time period strings
   * @param timePeriod time period string (e.g., "2023 - Present (1.9 Years)")
   * @returns time period without years (e.g., "2023 - Present")
   */
  private removeYearsFromTimePeriod(timePeriod: string): string {
    if (!timePeriod) {
      return '';
    }

    // Remove the pattern "(X.X Years)" or "(X.X Year)" from the end of the string
    return timePeriod.replace(/\s*\(\d+\.?\d*\s*(?:Years?|Year)\)$/, '').trim();
  }

  /**
   * Calculate the total years of experience by
   * calculating the difference between the start and end date
   */
  private totalYearsOfExperience(): void {
    if (!this.experience?.startDate || !this.experience?.endDate) {
      this.yearsOfExperience = signal('1 Year');
      return;
    }

    const numOfYears = this.dateTimeService
      .getYearsOfExperience(this.experience.startDate, this.experience.endDate);

    this.yearsOfExperience = signal(numOfYears > 1.0 ? `${numOfYears.toString()} Years` : `${numOfYears.toString()} Year`);
  }
}
