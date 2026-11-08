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
  type FieldTree,
  form,
  FormField,
  required,
} from '@angular/forms/signals';
import { Store } from '@ngrx/store';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  map,
  of,
  take,
} from 'rxjs';
import { MatDialogModule } from '@angular/material/dialog';

import {
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { ISkills } from '@portfolio-v2/state/dataModels';
import { skillsSelector } from '@portfolio-v2/state/selectors';
import { StateActions } from '@portfolio-v2/state';

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

  /** Returns true if the save is successful */
  protected isSaveSuccess = of(false);

  /**
   * constructor
   * @param store ngrx store
   * @param utility utility service
   * @param setDataService set data service
   */
  constructor(
    private store: Store,
    private utility: UtilityService,
    private setDataService: SetDataService,
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
   * Modify Keys of the languages
   */
  public saveLanguageKeys(): void {
    const skills = this.skillsData();
    if (!skills) {
      // eslint-disable-next-line no-console
      console.log('Cannot save data');
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

    this.isSaveSuccess = this.setDataService
      .setRecord<ISkills>('skills-section/latest/', newSkillsValues)
      .pipe(
        take(1),
        map((result) => {
          this.store.dispatch(StateActions.skillsStateUpdated({ skills: newSkillsValues }));
          return result === 'successfull';
        }),
      );
  }
}
