/* eslint-disable no-multi-str */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Signal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  filter,
  map,
  take,
} from 'rxjs';
import { Store } from '@ngrx/store';

import { IExperience } from '@portfolio-v2/state/dataModels';
import { GetDateTimeService } from '@portfolio-v2/shared/services';
import { experienceSelector } from '@portfolio-v2/state/selectors';
import { HighlightPipePipe } from '@portfolio-v2/shared/pipes';

/**
 * Experience page
 */
@Component({
  selector: 'portfolio-v2-experience',
  standalone: true,
  imports: [
    CommonModule,
    HighlightPipePipe,
  ],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceComponent {
  /**
   * Array of IExperience.
   * Hold the data from the database
   */
  protected readonly experienceData = this.store.select(experienceSelector);

  /** Selected job */
  protected selectedJob = '';

  /** Date time service */
  private dateTimeService = inject(GetDateTimeService);

  /** Experience */
  public experience: IExperience | undefined;

  /** Number of years of experience */
  public yearsOfExperience: Signal<string> = signal<string>('1 Year');

  /**
   * constructor
   * @param store ngrx store
   */
  constructor(
    private store: Store,
  ) {
    this.experienceData.pipe(
      take(1),
      filter((data) => data !== undefined),
      map((data) => data[0]),
    ).subscribe((exp) => this.displaySelected(exp));
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
    }
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
