import * as _ from 'lodash';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import { DisplayValidatorErrorsComponent } from '@portfolio-v2/shared/components';
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
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    DisplayValidatorErrorsComponent,
  ],
  templateUrl: './change-language.component.html',
  styleUrl: './change-language.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeLanguageComponent implements OnInit {
  /** Landing form */
  protected languageForm!: FormGroup;

  /** Signal containing Skills section data */
  public readonly skillsData: Signal<ISkills | undefined>;

  /** Returns true if the save is successful */
  protected isSaveSuccess = of(false);

  /**
   * constructor
   * @param formBuilder form builder
   * @param store ngrx store
   * @param utility utility service
   * @param setDataService set data service
   */
  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private utility: UtilityService,
    private setDataService: SetDataService,
  ) {
    this.skillsData = this.store.selectSignal(skillsSelector);
  }

  /** @inheritdoc */
  public ngOnInit(): void {
    const data = this.skillsData();

    // Merge both language columns and returns a key map
    const languageKeys = [
      ..._.keys(data?.languagesCol1).sort(),
      ..._.keys(data?.languagesCol2).sort(),
    ];

    this.languageForm = this.formBuilder.group({
      languages: [this.utility.seperateSentences(languageKeys), [Validators.required]],
    });
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

    const { languages } = this.languageForm.value;
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
