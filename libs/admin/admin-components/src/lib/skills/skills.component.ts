import * as _ from 'lodash';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
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
import {
  map,
  of,
  take,
} from 'rxjs';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';

import {
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { skillsSelector } from '@portfolio-v2/state/selectors';
import { ISkills } from '@portfolio-v2/state/dataModels';
import { DisplayValidatorErrorsComponent } from '@portfolio-v2/admin/shared/components';
import { StateActions } from '@portfolio-v2/state';
import { ChangeLanguageComponent } from './components/change-language/change-language.component';

/**
 * Skills admin functions
 */
@Component({
  selector: 'admin-skills',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    DisplayValidatorErrorsComponent,
  ],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent implements OnInit {
  /** Skills form */
  protected skillsForm!: FormGroup;
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
   * @param dialog mat dialog
   */
  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private utility: UtilityService,
    private setDataService: SetDataService,
    private dialog: MatDialog,
  ) {
    this.skillsData = this.store.selectSignal(skillsSelector);
  }

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    const data = this.skillsData();

    const introControl = {
      skillsIntro: [data?.intro ?? '', [Validators.required]],
      toolHeading: [data?.toolHeading ?? '', [Validators.required]],
      leftSubHeading: [data?.leftSubHeading ?? '', [Validators.required]],
      rightSubHeading: [data?.rightSubHeading ?? '', [Validators.required]],
      leftPoints: [this.utility.seperateSentences(data?.framework), [Validators.required]],
      rightPoints: [this.utility.seperateSentences(data?.software), [Validators.required]],
    };

    // Merge both language columns and create controls
    const languageControls = _.mapValues(
      _.merge({}, data?.languagesCol1, data?.languagesCol2),
      (value) => [value],
    );

    this.skillsForm = this.formBuilder.group({
      ...introControl,
      ...languageControls,
    });
  }

  /**
   * Open the photo upload dialog
   */
  protected openDialog(): void {
    this.dialog.open(ChangeLanguageComponent, { autoFocus: 'first-tabbable', restoreFocus: true });
  }

  /**
   * Update data
   */
  protected updateData(): void {
    const {
      skillsIntro, toolHeading, leftSubHeading,
      rightSubHeading, leftPoints, rightPoints,
    } = this.skillsForm.value;

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

    this.isSaveSuccess = this.setDataService.setRecord<ISkills>('skills-section/latest/', newSkillsValues).pipe(
      take(1),
      map((result) => {
        this.store.dispatch(StateActions.skillsStateUpdated({
          skills: newSkillsValues,
        }));
        return result === 'successfull';
      }),
    );
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
        const value = parseInt(this.skillsForm.controls[key]?.value, 10) ?? 10;
        newObject[key] = value;
      });
    }

    return newObject;
  }
}
