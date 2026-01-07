import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  map,
  of,
  take,
} from 'rxjs';

import {
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { aboutMeSelector } from '@portfolio-v2/state/selectors';
import { IAboutMe } from '@portfolio-v2/state/dataModels';
import { DisplayValidatorErrorsComponent } from '@portfolio-v2/shared/components';
import { urlValidator } from '@portfolio-v2/shared/validators';
import { StateActions } from '@portfolio-v2/state';
import { UploadPhotoComponent } from '@portfolio-v2/admin/shared/components';
import { IUploadPhotoConfig } from '@portfolio-v2/admin/shared/types';

/**
 * About me admin section
 */
@Component({
  selector: 'admin-about-me',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatDialogModule,
    DisplayValidatorErrorsComponent,
  ],
  templateUrl: './about-me.component.html',
  styleUrl: './about-me.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMeComponent implements OnInit {
  /** Landing form */
  protected aboutMeForm!: FormGroup;

  /** Returns true if the save is successful */
  protected isSaveSuccess = of(false);

  /** Signal containing About Me section data */
  public readonly aboutMeData: Signal<IAboutMe | undefined>;

  /**
   * constructor
   * @param formBuilder form builder
   * @param setDataService Set Data Service
   * @param store ngrx store
   * @param dialog Mat Dialog
   * @param utility utility service
   */
  constructor(
    private formBuilder: FormBuilder,
    private setDataService: SetDataService,
    private store: Store,
    private dialog: MatDialog,
    private utility: UtilityService,
  ) {
    this.aboutMeData = this.store.selectSignal(aboutMeSelector);
  }

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    const aboutObject = this.aboutMeData();
    const allParagraphs = this.utility.seperateSentences(aboutObject?.intro);

    this.aboutMeForm = this.formBuilder.group({
      mainIntro: [`${allParagraphs}`, [Validators.required]],
      subIntro: [`${aboutObject?.subHeadingIntro}`, [Validators.required]],
      leftPoints: [`${this.utility.seperateSentences(aboutObject?.leftPoints)}`, [Validators.required]],
      rightPoints: [`${this.utility.seperateSentences(aboutObject?.rightPoints)}`, [Validators.required]],
      linkField: [`${aboutObject?.link}`, [Validators.required, urlValidator()]],
    });
  }

  /**
   * Open the photo upload dialog
   */
  protected openDialog(): void {
    this.dialog.open(
      UploadPhotoComponent,
      {
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        data: {
          title: 'Upload Profile Photo',
          fieldPath: 'portfolio/about-me-section/profile/MyPhoto.webp/',
          stateSelector: aboutMeSelector,
          stateUpdateAction: (updatedData: any) => StateActions.aboutMeStateUpdated({
            aboutMe: { ...this.aboutMeData(), ...updatedData },
          }),
          currentImageUrl: this.aboutMeData()?.imageSrc,
        } as IUploadPhotoConfig,
      },
    );
  }

  /**
   * Update data
   */
  protected updateData(): void {
    const {
      mainIntro, subIntro, leftPoints, rightPoints, linkField,
    } = this.aboutMeForm.value;

    const newAboutMeValues: IAboutMe = {
      id: 1,
      imageSrc: this.aboutMeData()?.imageSrc ?? '',
      intro: this.utility.breakStringToParagraphs(mainIntro),
      subHeadingIntro: subIntro,
      leftPoints: this.utility.breakStringToParagraphs(leftPoints),
      rightPoints: this.utility.breakStringToParagraphs(rightPoints),
      link: linkField,
    };

    this.isSaveSuccess = this.setDataService.setRecord<IAboutMe>('about-me-section/part-01/', newAboutMeValues).pipe(
      take(1),
      map((result) => {
        this.store.dispatch(StateActions.aboutMeStateUpdated({
          aboutMe: newAboutMeValues,
        }));
        return result === 'successfull';
      }),
    );
  }
}
