import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogContent,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import {
  form,
  required,
} from '@angular/forms/signals';
import {
  map,
  Observable,
  of,
  take,
} from 'rxjs';
import { CommonModule } from '@angular/common';

import {
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import {
  firebaseUrl,
  webUrl,
} from '@portfolio-v2/shared/validators';
import { StateActions } from '@portfolio-v2/state';
import { IProjectCard } from '@portfolio-v2/state/dataModels';
import { ProjectCardFieldsComponent } from '../project-card-fields/project-card-fields.component';
import { UploadPhotoComponent } from '../upload-photo/upload-photo.component';
import { ProjectCardType } from '../types/project-cards-type.enum';

/** Text and links for a new project card. */
interface NewCardValues {
  /** Heading. */
  heading: string;
  /** Description. */
  description: string;
  /** Technologies. */
  technologies: string;
  /** Codebase URL. */
  codebase: string;
  /** YouTube URL. */
  youtube: string;
  /** Screenshot URL. */
  screenshot: string;
  /** Documentation URL. */
  documentation: string;
}

/**
 * A blank new card.
 * @returns empty card values
 */
function emptyCard(): NewCardValues {
  return {
    heading: '',
    description: '',
    technologies: '',
    codebase: '',
    youtube: '',
    screenshot: '',
    documentation: '',
  };
}

/**
 * Project Cards Component
 */
@Component({
  selector: 'admin-add-portfolio-record',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogContent,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatDialogClose,
    ProjectCardFieldsComponent,
  ],
  templateUrl: './add-portfolio-record.component.html',
  styleUrl: './add-portfolio-record.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPortfolioRecordComponent implements OnInit, OnDestroy {
  /** Dialog arguments. */
  public readonly data = inject<{
    currentId: number,
    heading: string,
    type: ProjectCardType,
  }>(MAT_DIALOG_DATA);

  /** Values the editor is changing. */
  private readonly model = signal<NewCardValues>(emptyCard());

  /** Card Editor Form. A featured card also requires a heading. */
  protected readonly cardAddForm = form(this.model, (fields) => {
    required(fields.heading, { when: () => this.data.type === this.typeFeatured });
    required(fields.description);
    required(fields.technologies);
    webUrl(fields.codebase);
    webUrl(fields.youtube);
    firebaseUrl(fields.screenshot);
    webUrl(fields.documentation);
  });

  /** Default Image URL */
  protected readonly defaultImageSrc = 'https://placehold.co/300x200.png';

  /** Returns true if the edit is successful */
  protected isEditSuccess = of(false);

  /** Preview Image URL */
  protected readonly imagePreview = signal(this.defaultImageSrc);

  /** Selected Image URL */
  protected readonly imageUrl = signal('');

  /** Upload Complete Flag */
  protected readonly isUploadCompleted = signal(false);

  /** Image Upload Progress Value */
  protected readonly progressValue = signal(0);

  /** Project card type */
  protected readonly typeFeatured = ProjectCardType.featured;

  /** Upload timeout, cleared when the dialog closes. */
  private uploadTimeoutId: number | undefined;

  /** Timeout limit for upload in milliseconds (30 seconds) */
  private static readonly THIRTY_SECONDS_TIMEOUT = 30000;

  /**
   * constructor
   * @param dialog dialog ref
   * @param setDataService set data service
   * @param store ngrx store
   * @param utility utility service
   */
  constructor(
    public dialog: MatDialog,
    private setDataService: SetDataService,
    private store: Store,
    private utility: UtilityService,
  ) {}

  /**
   * Drop the image subscription and any upload timer still running.
   * @inheritdoc
   */
  public ngOnDestroy(): void {
    this.clearUploadTimeout();
  }

  /**
   * Build an empty form for a featured card or a regular card.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.cardAddForm().reset(emptyCard());
  }

  /**
   * Handle the file picker.
   * Display preview image when user selected an image from the file picker.
   * @param event event
   */
  protected onFileSelected(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imageUrl.set(reader.result as string);
          this.imagePreview.set(this.imageUrl());
        };
        reader.readAsDataURL(file);
      }
    }
  }

  /**
   * Open dialog description
   */
  protected openUploadPhotoPanel(): void {
    const paddedId = this.utility.getPaddedDigits(this.data.currentId, 2);
    let fieldPath = '';

    if (this.data.type === ProjectCardType.featured) {
      // For featured projects, screenshots go to the same directory as main images
      fieldPath = `portfolio/project-screenshots/normal/ID-${paddedId}-Screenshot.webp/`;
    } else {
      // For regular projects, screenshots go to the project-screenshots directory
      fieldPath = `portfolio/project-screenshots/normal/ID-${paddedId}-Screenshot.webp/`;
    }

    this.dialog.open(
      UploadPhotoComponent,
      {
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        data: {
          title: 'Upload Project Screenshot',
          fieldPath,
          currentImageUrl: this.defaultImageSrc,
          onImageUploaded: (imageUrl: string) => {
            this.cardAddForm.screenshot().value.set(imageUrl);
          },
        },
      },
    );
  }

  /**
   * Add project card data
   */
  protected async addData(): Promise<void> {
    if (!this.cardAddForm().valid()) return;

    const {
      description, technologies, codebase, youtube, screenshot, documentation,
    } = this.cardAddForm().value();

    let { heading } = this.data;
    let fileStoragePath = '';
    let databaseDocPath = '';

    if (this.data.type === ProjectCardType.featured) {
      heading = this.cardAddForm().value().heading || 'Default Heading';
      fileStoragePath = `portfolio/featured-projects/ID-${this.utility.getPaddedDigits(this.data.currentId, 2)}-Image.webp/`;
      databaseDocPath = `featured-project-section/project-${this.utility.getPaddedDigits(this.data.currentId, 2)}/`;
    } else {
      fileStoragePath = `portfolio/project-card-images/ID-${this.utility.getPaddedDigits(this.data.currentId, 2)}-Image.webp/`;
      databaseDocPath = `project-data-section/project-${this.utility.getPaddedDigits(this.data.currentId, 2)}/`;
    }

    // Handle file upload if a new file was selected (check if imageUrl is not empty/default)
    const chosenImage = this.imageUrl();
    const hasNewFile = chosenImage !== '' && chosenImage !== this.defaultImageSrc;

    let imageURL = this.defaultImageSrc;

    // Handle file upload if a new file was selected
    if (hasNewFile) {
      try {
        // Upload file and wait for Firebase Storage URL
        imageURL = await this.uploadFileAndGetUrl(fileStoragePath);
      } catch (error) {
        // If upload fails, keep default image URL
        console.error('File upload failed, using default image:', error);
        // Error handling can be added here if needed
      }
    }

    // Create updated project card with the correct image URL
    const updatedCard: IProjectCard = {
      id: this.data.currentId,
      heading: this.data.type === ProjectCardType.featured ? heading : this.data.heading,
      imageURL,
      description,
      tools: technologies,
      githubURL: codebase,
      gitDisable: codebase === '',
      demoURL: youtube,
      demoDisable: youtube === '',
      screenshotURL: screenshot,
      ssDisable: screenshot === '',
      documentationURL: documentation,
      docDisable: documentation === '',
    };

    this.isEditSuccess = this.saveDataRecord(
      databaseDocPath,
      updatedCard,
    );
  }

  /**
   * Handle file upload to storage and retrieve image URL
   * @param fileStoragePath path to store the file
   * @returns Promise that resolves with the Firebase Storage URL
   */
  private async uploadFileAndGetUrl(fileStoragePath: string): Promise<string> {
    this.clearUploadTimeout();
    const timeout = new Promise<never>((_resolve, reject) => {
      this.uploadTimeoutId = window.setTimeout(() => {
        reject(new Error('Upload timeout'));
      }, AddPortfolioRecordComponent.THIRTY_SECONDS_TIMEOUT);
    });

    try {
      const result = await Promise.race([
        this.setDataService.uploadDataUrl(fileStoragePath, this.imageUrl(), (percent) => {
          this.progressValue.set(percent);
          this.isUploadCompleted.set(percent === 100);
        }),
        timeout,
      ]);
      this.imageUrl.set(result);
      return result;
    } finally {
      this.clearUploadTimeout();
    }
  }

  /**
   * Stop a pending upload timeout.
   */
  private clearUploadTimeout(): void {
    if (this.uploadTimeoutId !== undefined) {
      window.clearTimeout(this.uploadTimeoutId);
      this.uploadTimeoutId = undefined;
    }
  }

  /**
   * Save project card to database and handle success/updates
   * @param databaseDocPath path to the project document
   * @param newProjectCard updated project card
   * @returns observable of success status
   */
  private saveDataRecord(
    databaseDocPath: string,
    newProjectCard: IProjectCard,
  ): Observable<boolean> {
    return this.setDataService
      .setRecord<IProjectCard>(databaseDocPath, newProjectCard).pipe(
      take(1),
      map((result) => {
        if (result === 'successfull') {
          // Reset the preview to placeholder
          this.imagePreview.set(this.defaultImageSrc);
        }
        if (this.data.type === ProjectCardType.featured) {
          this.store.dispatch(StateActions.featuredProjectCardsStateConnect());
        } else {
          this.store.dispatch(StateActions.portfolioCardsStateConnect());
          this.store.dispatch(StateActions.projectCardsStateConnect());
        }

        return result === 'successfull';
      }),
    );
  }
}
