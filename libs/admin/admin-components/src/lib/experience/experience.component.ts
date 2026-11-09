import * as _ from 'lodash';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  Signal,
  untracked,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';

import {
  AdminDeleteDialogComponent,
  openAdminDialog,
} from '@portfolio-v2/admin/shared/components';
import { fieldHasError } from '@portfolio-v2/shared/forms';
import {
  GetDateTimeService,
  UtilityService,
  yearsExperienceLabel,
} from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import { IExperience } from '@portfolio-v2/state/dataModels';
import { experienceSelector } from '@portfolio-v2/state/selectors';
import {
  ExperienceFormComponent,
  ExperienceValues,
} from './experience-form/experience-form.component';
import {
  ExperienceWriter,
  experienceWriteMessage,
} from './services/experience-writer.service';

/**
 * Admin Experience page
 */
@Component({
  selector: 'admin-experience',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    ExperienceFormComponent,
  ],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminExperienceComponent {
  /** Date time service */
  private readonly dateTimeService = inject(GetDateTimeService);

  /** Experience */
  public experience: IExperience | undefined;

  /** Job whose year span is on screen. */
  private readonly selectedExperience = signal<IExperience | undefined>(undefined);

  /** Number of years of experience */
  public readonly yearsOfExperience = computed(() => {
    const job = this.selectedExperience();
    if (!job?.startDate || !job?.endDate) {
      return '1 Year';
    }
    return yearsExperienceLabel(
      this.dateTimeService.getYearsOfExperience(job.startDate, job.endDate),
    );
  });

  /**
   * Array of IExperience.
   * Hold the data from the database
   */
  protected readonly experienceData: Signal<IExperience[] | undefined>;

  /** Job fields. */
  protected readonly jobForm = viewChild(ExperienceFormComponent);

  /** True after a new job is stored. */
  protected readonly isAddSuccess = signal(false);

  /** True after an edit is stored. */
  protected readonly isEditSuccess = signal(false);

  /** True after a job is removed. */
  protected readonly isDeleteSuccess = signal(false);

  /** Shown when a save fails. */
  protected readonly saveError = signal<string | null>(null);

  /** Selected job */
  protected selectedJob = '';

  /** Dialog service. */
  private readonly dialog = inject(MatDialog);

  /** Page view, so the delete dialog can see the route writer. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /** Experience writes. */
  private readonly writer = inject(ExperienceWriter);

  /** Application store. */
  private readonly store = inject(Store);

  /** Utility service. */
  private readonly utility = inject(UtilityService);

  /**
   * Open the experience listener and show the first job once the form exists.
   */
  constructor() {
    this.store.dispatch(StateActions.experienceStateConnect());
    this.experienceData = this.store.selectSignal(experienceSelector);
    effect(() => {
      const form = this.jobForm();
      const nextJob = this.experienceData()?.[0];
      if (!form || !nextJob || this.experience) {
        return;
      }
      untracked(() => this.displaySelected(nextJob));
    });
  }

  /**
   * The job form, once the view has created it.
   * @returns the form field tree
   */
  protected get experienceForm(): ExperienceFormComponent['experienceForm'] {
    const editor = this.jobForm();
    if (!editor) {
      throw new Error('missing experience form');
    }
    return editor.experienceForm;
  }

  /**
   * Store the start date chosen in the date picker.
   * @param value selected date
   */
  protected setStart(value: Date | null): void {
    this.jobForm()?.setStart(value);
  }

  /**
   * Store the end date chosen in the date picker.
   * @param value selected date
   */
  protected setEnd(value: Date | null): void {
    this.jobForm()?.setEnd(value);
  }

  /**
   * Store the current-job flag.
   * @param isCurrent true when the job is current
   */
  protected setCurrent(isCurrent: boolean): void {
    this.jobForm()?.setCurrent(isCurrent);
  }

  /**
   * Calculate the time period.
   */
  protected calculateTimePeriod(): void {
    this.jobForm()?.calculateTimePeriod();
  }

  /** Whether a touched or dirty field currently has this error. */
  protected readonly hasError = fieldHasError;

  /**
   * Display selected
   * @param exp job details
   */
  public displaySelected(exp: IExperience): void {
    if (!exp) {
      return;
    }
    this.experience = exp;
    this.selectedExperience.set(exp);
    this.selectedJob = this.experience.employer;
    this.jobForm()?.apply(this.experience, this.yearsOfExperience());
  }

  /**
   * Add experience
   */
  protected async addExperience(): Promise<void> {
    const editor = this.jobForm();
    const jobs = this.experienceData();
    if (!editor || !editor.experienceForm().valid() || !jobs) {
      return;
    }

    const nextId = (_.first(jobs)?.id ?? 0) + 1;
    await this.persist(this.recordFrom(nextId, editor.experienceForm().value()), true);
  }

  /**
   * Clear the form
   */
  protected clearForm(): void {
    this.isAddSuccess.set(false);
    this.isEditSuccess.set(false);
    this.isDeleteSuccess.set(false);
    this.saveError.set(null);
    this.jobForm()?.clear();
  }

  /**
   * Edit experience
   */
  protected async editExperience(): Promise<void> {
    const editor = this.jobForm();
    if (!this.experience || !editor || !editor.experienceForm().valid()) {
      return;
    }

    const next = this.recordFrom(
      this.experience.id,
      editor.experienceForm().value(),
      this.experience,
    );
    await this.persist(next, false);
  }

  /**
   * Open delete confirmation dialog
   */
  protected openDeleteConfirmation(): void {
    const job = this.experience;
    if (!job) {
      return;
    }

    const dialogRef = openAdminDialog(
      this.dialog,
      this.viewContainerRef,
      AdminDeleteDialogComponent,
      {
        title: 'Delete experience',
        lines: [job.employer, job.position],
        record: job,
        writer: ExperienceWriter,
        writeMessage: experienceWriteMessage,
      },
      '800px',
    );

    dialogRef.afterClosed().pipe(take(1)).subscribe((removed) => {
      if (!removed) {
        return;
      }
      this.isDeleteSuccess.set(true);
      const remaining = (this.experienceData() ?? []).filter((item) => item.id !== job.id);
      const next = _.first(remaining);
      this.experience = next;
      this.selectedJob = next?.employer ?? 'Mock Employer';
      if (next) {
        this.displaySelected(next);
      }
    });
  }

  /**
   * Store one job. The live listener refreshes the list.
   * @param record job to store
   * @param isNew true when this is an add
   */
  private async persist(record: IExperience, isNew: boolean): Promise<void> {
    this.isAddSuccess.set(false);
    this.isEditSuccess.set(false);
    this.saveError.set(null);
    try {
      await this.writer.save(record);
      if (isNew) {
        this.isAddSuccess.set(true);
      } else {
        this.isEditSuccess.set(true);
      }
    } catch (error) {
      this.saveError.set(experienceWriteMessage(error));
    }
  }

  /**
   * Build the stored job from the form.
   * A current job keeps the end date as `present`.
   * @param id job id
   * @param values form values
   * @param current job being edited, when this is not a new job
   * @returns the document to store
   */
  private recordFrom(
    id: number,
    values: ExperienceValues,
    current?: IExperience,
  ): IExperience {
    return {
      ...current,
      id,
      position: values.position,
      employer: values.employer,
      startDate: this.dateTimeService.convertToISOFormat(values.startDate ?? ''),
      endDate: values.isCurrent
        ? 'present'
        : this.dateTimeService.convertToISOFormat(values.endDate ?? ''),
      isCurrent: values.isCurrent,
      timePeriod: this.removeYearsFromTimePeriod(values.timePeriod),
      shortDescription: values.shortDescription,
      points: this.utility.breakStringToParagraphs(values.points),
    };
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

    return timePeriod.replace(/\s*\(\d+\.?\d*\s*(?:Years?|Year)\)$/, '').trim();
  }
}
