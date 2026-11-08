import {
  ChangeDetectionStrategy,
  Component,
  effect,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  type FieldTree,
  form,
  FormField,
  required,
} from '@angular/forms/signals';
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
import { UploadPhotoComponent } from '@portfolio-v2/admin/shared/components';
import { webUrl } from '@portfolio-v2/shared/validators';
import { StateActions } from '@portfolio-v2/state';
import { IUploadPhotoConfig } from '@portfolio-v2/admin/shared/types';

/** Text the about-me editor saves. */
interface AboutMeValues {
  /** Main introduction. */
  mainIntro: string;
  /** Sub introduction. */
  subIntro: string;
  /** Left points. */
  leftPoints: string;
  /** Right points. */
  rightPoints: string;
  /** Link field. */
  linkField: string;
}

/**
 * A blank about-me record.
 * @returns empty about-me values
 */
function emptyAbout(): AboutMeValues {
  return {
    mainIntro: '',
    subIntro: '',
    leftPoints: '',
    rightPoints: '',
    linkField: '',
  };
}

/**
 * About me admin section
 */
@Component({
  selector: 'admin-about-me',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatDialogModule,
  ],
  templateUrl: './about-me.component.html',
  styleUrl: './about-me.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMeComponent implements OnInit {
  /** Values the editor is changing. */
  private readonly model = signal<AboutMeValues>(emptyAbout());

  /** Landing form */
  protected readonly aboutMeForm = form(this.model, (fields) => {
    required(fields.mainIntro);
    required(fields.subIntro);
    required(fields.leftPoints);
    required(fields.rightPoints);
    required(fields.linkField);
    webUrl(fields.linkField);
  });

  /** Returns true if the save is successful */
  protected isSaveSuccess = of(false);

  /** Signal containing About Me section data */
  public readonly aboutMeData: Signal<IAboutMe | undefined>;

  /** True after the form has been filled from a stored record. */
  private hasAppliedAbout = false;

  /**
   * constructor
   * @param setDataService Set Data Service
   * @param store ngrx store
   * @param dialog Mat Dialog
   * @param utility utility service
   */
  constructor(
    private setDataService: SetDataService,
    private store: Store,
    private dialog: MatDialog,
    private utility: UtilityService,
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
   * Build or fill the form from the stored about record.
   * @param aboutObject Stored about record, once the listener has delivered it.
   */
  private applyAboutMe(aboutObject: IAboutMe | undefined): void {
    if (this.hasAppliedAbout) {
      return;
    }
    this.aboutMeForm().reset({
      mainIntro: aboutObject ? this.utility.seperateSentences(aboutObject.intro) : '',
      subIntro: aboutObject?.subHeadingIntro ?? '',
      leftPoints: aboutObject ? this.utility.seperateSentences(aboutObject.leftPoints) : '',
      rightPoints: aboutObject ? this.utility.seperateSentences(aboutObject.rightPoints) : '',
      linkField: aboutObject?.link ?? '',
    });
    if (aboutObject) {
      this.hasAppliedAbout = true;
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
    } = this.aboutMeForm().value();

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
