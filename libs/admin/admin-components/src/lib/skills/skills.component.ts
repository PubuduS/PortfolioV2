import {
  ChangeDetectionStrategy,
  Component,
  effect,
  OnInit,
  signal,
  Signal,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import {
  form,
  FormField,
  required,
} from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';

import { openAdminDialog } from '@portfolio-v2/admin/shared/components';
import { fieldHasError } from '@portfolio-v2/shared/forms';
import { UtilityService } from '@portfolio-v2/shared/services';
import { skillsSelector } from '@portfolio-v2/state/selectors';
import { ISkills } from '@portfolio-v2/state/dataModels';
import { StateActions } from '@portfolio-v2/state';
import { ChangeLanguageComponent } from './components/change-language/change-language.component';
import {
  SkillsWriter,
  skillsWriteMessage,
} from './services/skills-writer.service';

/** Text the skills editor saves. Language levels sit beside the form. */
interface SkillsValues {
  /** Skills introduction. */
  skillsIntro: string;
  /** Tool heading. */
  toolHeading: string;
  /** Left sub heading. */
  leftSubHeading: string;
  /** Right sub heading. */
  rightSubHeading: string;
  /** Left points. */
  leftPoints: string;
  /** Right points. */
  rightPoints: string;
}

/**
 * A blank skills record.
 * @returns empty skills values
 */
function emptySkills(): SkillsValues {
  return {
    skillsIntro: '',
    toolHeading: '',
    leftSubHeading: '',
    rightSubHeading: '',
    leftPoints: '',
    rightPoints: '',
  };
}

/**
 * Skills admin functions
 */
@Component({
  selector: 'admin-skills',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent implements OnInit {
  /** Values the editor is changing. */
  private readonly model = signal<SkillsValues>(emptySkills());

  /** Skills form */
  protected readonly skillsForm = form(this.model, (fields) => {
    required(fields.skillsIntro);
    required(fields.toolHeading);
    required(fields.leftSubHeading);
    required(fields.rightSubHeading);
    required(fields.leftPoints);
    required(fields.rightPoints);
  });

  /** Percentage for each language key. */
  protected readonly languageLevels = signal<Record<string, number>>({});

  /** Signal containing Skills section data */
  public readonly skillsData: Signal<ISkills | undefined>;
  /** True after a save has been written. */
  protected readonly isSaveSuccess = signal(false);

  /** Shown when the write fails. */
  protected readonly saveError = signal<string | null>(null);

  /** True after the form has been filled from a stored record. */
  private hasAppliedSkills = false;

  /**
   * constructor
   * @param store ngrx store
   * @param utility utility service
   * @param writer skills writes
   * @param dialog mat dialog
   * @param viewContainerRef view that can see the route writer
   */
  constructor(
    private store: Store,
    private utility: UtilityService,
    private writer: SkillsWriter,
    private dialog: MatDialog,
    private viewContainerRef: ViewContainerRef,
  ) {
    this.store.dispatch(StateActions.skillsStateConnect());
    this.skillsData = this.store.selectSignal(skillsSelector);
    effect(() => {
      this.applySkills(this.skillsData());
    });
  }

  /**
   * Fill the skills form from the slice currently in the store.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.applySkills(this.skillsData());
  }

  /** Whether a touched or dirty field currently has this error. */
  protected readonly hasError = fieldHasError;

  /**
   * Store one language percentage.
   * @param key language name
   * @param event range input event
   */
  protected setLanguage(key: string, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    const level = Number(event.target.value);
    this.languageLevels.update((current) => ({ ...current, [key]: level }));
  }

  /**
   * Build the skills form from the stored record.
   * @param data Stored skills record, once the listener has delivered it.
   */
  private applySkills(data: ISkills | undefined): void {
    if (this.hasAppliedSkills) {
      return;
    }
    this.skillsForm().reset({
      skillsIntro: data?.intro ?? '',
      toolHeading: data?.toolHeading ?? '',
      leftSubHeading: data?.leftSubHeading ?? '',
      rightSubHeading: data?.rightSubHeading ?? '',
      leftPoints: this.utility.seperateSentences(data?.framework),
      rightPoints: this.utility.seperateSentences(data?.software),
    });
    this.languageLevels.set({
      ...(data?.languagesCol1 ?? {}),
      ...(data?.languagesCol2 ?? {}),
    });
    if (data) {
      this.hasAppliedSkills = true;
    }
  }

  /**
   * Open the photo upload dialog
   */
  protected openDialog(): void {
    openAdminDialog(this.dialog, this.viewContainerRef, ChangeLanguageComponent, undefined);
  }

  /**
   * Update data
   */
  protected async updateData(): Promise<void> {
    const {
      skillsIntro, toolHeading, leftSubHeading,
      rightSubHeading, leftPoints, rightPoints,
    } = this.skillsForm().value();

    const newSkillsValues: ISkills = {
      id: 1,
      intro: skillsIntro,
      languagesCol1: this.getNewSkillMap(true),
      languagesCol2: this.getNewSkillMap(false),
      toolHeading,
      leftSubHeading,
      rightSubHeading,
      framework: this.utility.breakStringToParagraphs(leftPoints),
      software: this.utility.breakStringToParagraphs(rightPoints),
    };

    this.isSaveSuccess.set(false);
    this.saveError.set(null);
    try {
      await this.writer.save(newSkillsValues);
      this.isSaveSuccess.set(true);
    } catch (error) {
      this.saveError.set(skillsWriteMessage(error));
    }
  }

  /**
   * Create a new skill map from the dynamic range form controls.
   * @param isLeft if true capture the left coloum
   * @returns returns the new map with updated values.
   */
  private getNewSkillMap(isLeft: boolean): { [key: string]: number } {
    const oldMap = isLeft ? this.skillsData()?.languagesCol1 : this.skillsData()?.languagesCol2;
    const newObject: { [key: string]: number } = {};

    if (oldMap) {
      Object.keys(oldMap).forEach((key) => {
        newObject[key] = this.languageLevels()[key] ?? 10;
      });
    }

    return newObject;
  }
}
