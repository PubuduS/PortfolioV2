/* eslint-disable no-multi-str */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  map,
  Observable,
  take,
} from 'rxjs';

import { IExperience } from '@portfolio-v2/interfaces';
import {
  GetDataService,
  GetDateTimeService,
} from '@portfolio-v2/shared/services';

/**
 * Experience page
 */
@Component({
  selector: 'portfolio-v2-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceComponent {
  /**
   * Array of IExperience.
   * Hold the data from the database
   */
  protected readonly experienceData: Observable<IExperience[]>;

  /** Selected job */
  protected selectedJob = '';

  /** Date time service */
  private dateTimeService = inject(GetDateTimeService);

  /** Experience */
  public experience: IExperience | undefined;

  /** Number of years of experience */
  public yearsOfExperience = '1 Year';

  /**
   * constructor
   * @param dataService Database service
   */
  constructor(private dataService: GetDataService) {
    this.experienceData = this.dataService.getExperienceSectionData('experience-section');
    this.experienceData.pipe(
      take(1),
      map((data) => data[0]),
    ).subscribe((exp) => this.displaySelected(exp));
  }

  /**
   * Display selected
   * @param job job details
   */
  public displaySelected(job: IExperience): void {
    if (job) {
      this.experience = job;
      this.selectedJob = this.experience.employer;
      const result = this.dateTimeService
        .getYearsOfExperience(this.experience.startDate, this.experience.endDate);

      if (result > 1.0) {
        this.yearsOfExperience = `${result.toString()} Years`;
      } else {
        this.yearsOfExperience = `${result.toString()} Year`;
      }
    }
  }
}
