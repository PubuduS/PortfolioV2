import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
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
import {
  DisplayValidatorErrorsComponent,
  UploadPhotoComponent,
} from '@portfolio-v2/admin/shared/components';
import { urlValidator } from '@portfolio-v2/shared/validators';
import { StateActions } from '@portfolio-v2/state';
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

  /** True after the form has been filled from a stored record. */
  private hasAppliedAbout = false;

  /**
   * constructor
   * @param formBuilder form builder
   * @param setDataService Set Data Service
   * @param store ngrx store
   * @param dialog Mat Dialog
   * @param utility utility service
   * @param changeDetector change detector
   */
  constructor(
    private formBuilder: FormBuilder,
    private setDataService: SetDataService,
    private store: Store,
    private dialog: MatDialog,
    private utility: UtilityService,
    private changeDetector: ChangeDetectorRef,
  ) {
    this.store.dispatch(StateActions.aboutMeStateConnect());
    this.aboutMeData = this.store.selectSignal(aboutMeSelector);
    effect(() => {
      this.applyAboutMe(this.aboutMeData());
    });
  }

  /**
   * Fill the about-me form from the current store slice.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.applyAboutMe(this.aboutMeData());
  }

  /**
   * Build or fill the form from the stored about record.
   * @param aboutObject Stored about record, once the listener has delivered it.
   */
  private applyAboutMe(aboutObject: IAboutMe | undefined): void {
    if (this.hasAppliedAbout) {
      return;
    }
    const values = {
      mainIntro: aboutObject ? this.utility.seperateSentences(aboutObject.intro) : '',
      subIntro: aboutObject?.subHeadingIntro ?? '',
      leftPoints: aboutObject ? this.utility.seperateSentences(aboutObject.leftPoints) : '',
      rightPoints: aboutObject ? this.utility.seperateSentences(aboutObject.rightPoints) : '',
      linkField: aboutObject?.link ?? '',
    };
    if (!this.aboutMeForm) {
      this.aboutMeForm = this.formBuilder.group({
        mainIntro: [values.mainIntro, [Validators.required]],
        subIntro: [values.subIntro, [Validators.required]],
        leftPoints: [values.leftPoints, [Validators.required]],
        rightPoints: [values.rightPoints, [Validators.required]],
        linkField: [values.linkField, [Validators.required, urlValidator()]],
      });
    } else if (aboutObject) {
      this.aboutMeForm.patchValue(values);
    }
    if (aboutObject) {
      this.hasAppliedAbout = true;
      this.changeDetector.markForCheck();
    }
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
