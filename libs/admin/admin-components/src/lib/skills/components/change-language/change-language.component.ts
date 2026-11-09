import * as _ from 'lodash';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  form,
  FormField,
  required,
} from '@angular/forms/signals';
import { Store } from '@ngrx/store';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import { fieldHasError } from '@portfolio-v2/shared/forms';
import { UtilityService } from '@portfolio-v2/shared/services';
import { ISkills } from '@portfolio-v2/state/dataModels';
import { skillsSelector } from '@portfolio-v2/state/selectors';
import {
  SkillsWriter,
  skillsWriteMessage,
} from '../../services/skills-writer.service';

/**
 * Change Languege Keys
 */
@Component({
  selector: 'admin-change-language',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './change-language.component.html',
  styleUrl: './change-language.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeLanguageComponent implements OnInit {
  /** Language names, one per paragraph. */
  private readonly model = signal({ languages: '' });

  /** Landing form */
  protected readonly languageForm = form(this.model, (fields) => {
    required(fields.languages);
  });

  /** Signal containing Skills section data */
  public readonly skillsData: Signal<ISkills | undefined>;

  /** True after a save has been written. */
  protected readonly isSaveSuccess = signal(false);

  /** Shown when the write fails. */
  protected readonly saveError = signal<string | null>(null);

  /**
   * constructor
   * @param store ngrx store
   * @param utility utility service
   * @param writer skills writes
   */
  constructor(
    private store: Store,
    private utility: UtilityService,
    private writer: SkillsWriter,
  ) {
    this.skillsData = this.store.selectSignal(skillsSelector);
  }

  /**
   * Fill the language form from the skills currently in the store.
   * @inheritdoc
   */
  public ngOnInit(): void {
    const data = this.skillsData();

    // Merge both language columns and returns a key map
    const languageKeys = [
      ..._.keys(data?.languagesCol1).sort(),
      ..._.keys(data?.languagesCol2).sort(),
    ];

    this.languageForm().reset({
      languages: this.utility.seperateSentences(languageKeys),
    });
  }

  /** Whether a touched or dirty field currently has this error. */
  protected readonly hasError = fieldHasError;

  /**
   * Modify Keys of the languages
   */
  public async saveLanguageKeys(): Promise<void> {
    const skills = this.skillsData();
    if (!skills) {
      return;
    }

    const { languages } = this.languageForm().value();
    const languageArray = this.utility.breakStringToParagraphs(languages);

    const [firstHalf, secondHalf] = [
      languageArray.slice(0, 3),
      languageArray.slice(3, 6),
    ];

    const languageLeftValues = _.values(skills.languagesCol1);
    const languageRightValues = _.values(skills.languagesCol2);

    const languageLeftObject = _.zipObject(firstHalf, languageLeftValues);
    const languageRightObject = _.zipObject(secondHalf, languageRightValues);

    const newSkillsValues: ISkills = {
      ...skills,
      languagesCol1: languageLeftObject,
      languagesCol2: languageRightObject,
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
}
