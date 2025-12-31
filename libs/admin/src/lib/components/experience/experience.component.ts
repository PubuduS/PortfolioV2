/* eslint-disable no-multi-str */
import * as _ from 'lodash';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  distinctUntilChanged,
  map,
  of,
  Subscription,
  take,
} from 'rxjs';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';

import { DisplayValidatorErrorsComponent } from '@portfolio-v2/shared/components';
import { IExperience } from '@portfolio-v2/state/dataModels';
import {
  GetDateTimeService,
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { experienceSelector } from '@portfolio-v2/state/selectors';
import { StateActions } from '@portfolio-v2/state';
import { DeleteComformationComponent } from './components/delete-comformation.component';

/**
 * Admin Experience page
 */
@Component({
  selector: 'admin-experience',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDialogModule,
    DisplayValidatorErrorsComponent,
  ],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminExperienceComponent implements OnInit, OnDestroy {
  /** Experience */
  public experience: IExperience | undefined;

  /** Number of years of experience */
  public yearsOfExperience: Signal<string> = signal<string>('1 Year');

  /**
   * Array of IExperience.
   * Hold the data from the database
   */
  protected readonly experienceData: Signal<IExperience[] | undefined>;

  /** Experience form */
  protected experienceForm!: FormGroup;

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

  /** Form subscription */
  private formSubscription?: Subscription;

  /** Flag to prevent recursive calls */
  private isCalculatingTimePeriod = false;

  /**
   * constructor
   * @param formBuilder form builder
   * @param dialog dialog
   * @param setDataService set data service
   * @param store ngrx store
   * @param utility utility service
   */
  constructor(
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private setDataService: SetDataService,
    private store: Store,
    private utility: UtilityService,
  ) {
    this.experienceData = this.store.selectSignal(experienceSelector);
    if (this.experienceData()) {
      [this.experience] = this.experienceData()!;
      this.totalYearsOfExperience();
    }
  }

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.experienceForm = this.formBuilder.group({
      position: [this.experience?.position ?? '', [Validators.required]],
      employer: [this.experience?.employer ?? '', [Validators.required]],
      startDate: [
        this.dateTimeService.convertISOToDate(this.experience?.startDate ?? ''),
        [Validators.required],
      ],
      endDate: [
        this.dateTimeService.convertISOToDate(this.experience?.endDate ?? ''),
        [Validators.required],
      ],
      isCurrent: [this.experience?.isCurrent ?? false],
      timePeriod: [`${this.experience?.timePeriod} (${this.yearsOfExperience()})`, [Validators.required]],
      shortDescription: [this.experience?.shortDescription ?? '', [Validators.required]],
      points: [this.utility.seperateSentences(this.experience?.points) ?? '', [Validators.required]],
    });

    // Set up form subscription to automatically calculate time period when both dates are entered
    this.formSubscription = this.experienceForm.valueChanges.pipe(
      distinctUntilChanged(),
    ).subscribe((formValue) => {
      // Only calculate if not already calculating and both dates are present
      if (!this.isCalculatingTimePeriod && formValue.startDate && formValue.endDate) {
        this.calculateTimePeriod();
      }
    });
  }

  /**
   * @inheritdoc
   */
  public ngOnDestroy(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
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
      this.experienceForm.patchValue({
        position: this.experience?.position ?? '',
        employer: this.experience?.employer ?? '',
        startDate: this.dateTimeService.convertISOToDate(this.experience?.startDate ?? ''),
        endDate: this.dateTimeService.convertISOToDate(this.experience?.endDate ?? ''),
        isCurrent: this.experience?.isCurrent ?? false,
        timePeriod: `${this.experience?.timePeriod} (${this.yearsOfExperience()})`,
        shortDescription: this.experience?.shortDescription ?? '',
        points: this.utility.seperateSentences(this.experience?.points) ?? '',
      });
    }
  }

  /**
   * Add experience
   */
  protected addExperience(): void {
    if (!this.experienceForm.valid) {
      return;
    }

    const {
      position, employer, startDate, endDate, isCurrent, timePeriod, shortDescription, points,
    } = this.experienceForm.value;

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
      startDate: this.dateTimeService.convertToISOFormat(startDate),
      endDate: isCurrent ? 'present' : this.dateTimeService.convertToISOFormat(endDate),
      isCurrent,
      timePeriod: this.removeYearsFromTimePeriod(timePeriod),
      shortDescription,
      points: points ? this.utility.breakStringToParagraphs(points) : [],
    };

    const newExperienceValuesArray: IExperience[] = [...this.experienceData()!];
    newExperienceValuesArray[newId - 1] = newExperienceValues;

    if (this.experienceForm.valid) {
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
    // Prevent recursive calls
    if (this.isCalculatingTimePeriod) {
      return;
    }

    this.isCalculatingTimePeriod = true;

    try {
      const { startDate, endDate } = this.experienceForm.value;
      const startDateStr = this.dateTimeService.convertToISOFormat(startDate).slice(0, 4);
      const endDatestr = this.dateTimeService.convertToISOFormat(endDate).slice(0, 4);
      const timePeriod = `${startDateStr} - ${endDatestr}`;

      this.experienceForm.patchValue({
        timePeriod,
      }, { emitEvent: false }); // Prevent triggering valueChanges
    } finally {
      this.isCalculatingTimePeriod = false;
    }
  }

  /**
   * Clear the form
   */
  protected clearForm(): void {
    this.isAddSuccess = of(false);
    this.isEditSuccess = of(false);
    this.isDeleteSuccess = of(false);
    this.experienceForm.reset();
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
    } = this.experienceForm.value;

    const newExperienceValues: IExperience = {
      ...this.experience,
      position,
      employer,
      startDate: this.dateTimeService.convertToISOFormat(startDate),
      endDate: isCurrent ? 'present' : this.dateTimeService.convertToISOFormat(endDate),
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
