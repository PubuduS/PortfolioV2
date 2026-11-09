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
  form,
  FormField,
  required,
} from '@angular/forms/signals';
import { Store } from '@ngrx/store';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';

import { fieldHasError } from '@portfolio-v2/shared/forms';
import { UtilityService } from '@portfolio-v2/shared/services';
import { aboutMeSelector } from '@portfolio-v2/state/selectors';
import { IAboutMe } from '@portfolio-v2/state/dataModels';
import { UploadPhotoComponent } from '@portfolio-v2/admin/shared/components';
import { webUrl } from '@portfolio-v2/shared/validators';
import { StateActions } from '@portfolio-v2/state';
import { IUploadPhotoConfig } from '@portfolio-v2/admin/shared/types';
import {
  AboutMeWriter,
  aboutMeWriteMessage,
} from './services/about-me-writer.service';

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

  /** True after a save has been written. */
  protected readonly isSaveSuccess = signal(false);

  /** Shown when the write fails. */
  protected readonly saveError = signal<string | null>(null);

  /** Photo chosen in this visit, before it is stored on the document. */
  private readonly uploadedImage = signal<string | undefined>(undefined);

  /** Signal containing About Me section data */
  public readonly aboutMeData: Signal<IAboutMe | undefined>;

  /** True after the form has been filled from a stored record. */
  private hasAppliedAbout = false;

  /**
   * constructor
   * @param writer about-me writes
   * @param store ngrx store
   * @param dialog Mat Dialog
   * @param utility utility service
   */
  constructor(
    private writer: AboutMeWriter,
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

  /** Whether a touched or dirty field currently has this error. */
  protected readonly hasError = fieldHasError;

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
          currentImageUrl: this.aboutMeData()?.imageSrc,
          onImageUploaded: (imageUrl: string) => {
            this.uploadedImage.set(imageUrl);
          },
        } satisfies IUploadPhotoConfig,
      },
    );
  }

  /**
   * Update data
   */
  protected async updateData(): Promise<void> {
    const {
      mainIntro, subIntro, leftPoints, rightPoints, linkField,
    } = this.aboutMeForm().value();

    const newAboutMeValues: IAboutMe = {
      id: 1,
      imageSrc: this.uploadedImage() ?? this.aboutMeData()?.imageSrc ?? '',
      intro: this.utility.breakStringToParagraphs(mainIntro),
      subHeadingIntro: subIntro,
      leftPoints: this.utility.breakStringToParagraphs(leftPoints),
      rightPoints: this.utility.breakStringToParagraphs(rightPoints),
      link: linkField,
    };

    this.isSaveSuccess.set(false);
    this.saveError.set(null);
    try {
      await this.writer.save(newAboutMeValues);
      this.isSaveSuccess.set(true);
    } catch (error) {
      this.saveError.set(aboutMeWriteMessage(error));
    }
  }
}
