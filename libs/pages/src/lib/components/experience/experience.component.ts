import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Store } from '@ngrx/store';

import { HighlightPipe } from '@portfolio-v2/shared/pipes';
import {
  GetDateTimeService,
  yearsExperienceLabel,
} from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import { IExperience } from '@portfolio-v2/state/dataModels';
import { experienceSelector } from '@portfolio-v2/state/selectors';

/**
 * Experience page
 */
@Component({
  selector: 'portfolio-v2-experience',
  standalone: true,
  imports: [
    HighlightPipe,
  ],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceComponent {
  /** Date time service */
  private readonly dateTimeService = inject(GetDateTimeService);

  /** Jobs from the store. */
  protected readonly experienceData = this.store.selectSignal(experienceSelector);

  /** Job on screen. The visitor's choice, or the first job once the list arrives. */
  protected readonly selected = computed(() => this.chosen() ?? this.experienceData()?.[0]);

  /** Span label for the selected job. */
  protected readonly yearsOfExperience = computed(() => {
    const job = this.selected();
    if (!job?.startDate || !job?.endDate) {
      return '1 Year';
    }
    return yearsExperienceLabel(
      this.dateTimeService.getYearsOfExperience(job.startDate, job.endDate),
    );
  });

  /** Visitor's choice. Unset until a tab is clicked. */
  private readonly chosen = signal<IExperience | undefined>(undefined);

  /**
   * constructor
   * @param store ngrx store
   */
  constructor(
    private store: Store,
  ) {
    this.store.dispatch(StateActions.experienceStateConnect());
  }

  /**
   * Show the job the visitor picked.
   * @param exp job details
   */
  public displaySelected(exp: IExperience): void {
    if (exp) {
      this.chosen.set(exp);
    }
  }
}
