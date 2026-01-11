import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
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
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  map,
  Observable,
  of,
  Subscription,
  take,
} from 'rxjs';
import { CommonModule } from '@angular/common';

import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';
import {
  GetDataService,
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import {
  urlValidator,
  firebaseURLValidator,
} from '@portfolio-v2/shared/validators';
import { StateActions } from '@portfolio-v2/state';
import { IProjectCard } from '@portfolio-v2/state/dataModels';
import { UploadPhotoComponent } from '../upload-photo/upload-photo.component';
import { DisplayValidatorErrorsComponent } from '../validator-errors/display-validator-errors.component';
import { ProjectCardType } from '../types/project-cards-type.enum';

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
    ReactiveFormsModule,
    DisplayValidatorErrorsComponent,
  ],
  templateUrl: './add-portfolio-record.component.html',
  styleUrl: './add-portfolio-record.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPortfolioRecordComponent implements OnInit, OnDestroy {
  /** Card Editor Form */
  protected cardAddForm!: FormGroup;

  /** Default Image URL */
  protected readonly defaultImageSrc = 'https://placehold.co/300x200.png';

  /** Returns true if the edit is successful */
  protected isEditSuccess = of(false);

  /** Preview Image URL */
  protected imagePreview = this.defaultImageSrc;

  /** Selected Image URL */
  protected imageUrl = '';

  /** Upload Complete Flag */
  protected isUploadCompleted = false;

  /** Image Upload Progress Value */
  protected progressValue = 0;

  /** Project card type */
  protected readonly typeFeatured = ProjectCardType.featured;

  /** Image URL Subscription */
  private imageUrlSubscription!: Subscription;

  /** Upload Progress Interval ID */
  private uploadProgressIntervalId: number | undefined;

  /** Upload Check Timeout ID */
  private uploadCheckTimeoutId: number | undefined;

  /** Timeout limit for upload in milliseconds (30 seconds) */
  private static readonly THIRTY_SECONDS_TIMEOUT = 30000;

  /**
   * constructor
   * @param dialog dialog ref
   * @param data data
   * @param data.currentId current id
   * @param data.heading heading
   * @param data.type project card type
   * @param cdr change detector ref
   * @param formBuilder form builder
   * @param getDataService get data service
   * @param setDataService set data service
   * @param store ngrx store
   * @param utility utility service
   */
  constructor(
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: {
      currentId: number,
      heading: string,
      type: ProjectCardType,
    },
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private getDataService: GetDataService,
    private setDataService: SetDataService,
    private store: Store,
    private utility: UtilityService,
  ) {}

  /**
   * @inheritdoc
   */
  public ngOnDestroy(): void {
    if (this.imageUrlSubscription) {
      this.imageUrlSubscription.unsubscribe();
    }
    if (this.uploadProgressIntervalId !== undefined) {
      clearInterval(this.uploadProgressIntervalId);
    }
    if (this.uploadCheckTimeoutId !== undefined) {
      clearTimeout(this.uploadCheckTimeoutId);
    }
  }

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    if (this.data.type === this.typeFeatured) {
      this.cardAddForm = this.formBuilder.group({
        heading: ['', [Validators.required]],
        description: ['', [Validators.required]],
        technologies: ['', [Validators.required]],
        codebase: ['', [urlValidator()]],
        youtube: ['', [urlValidator()]],
        screenshot: ['', [firebaseURLValidator()]],
        documentation: ['', [urlValidator()]],
      });
      return;
    }

    this.cardAddForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      technologies: ['', [Validators.required]],
      codebase: ['', [urlValidator()]],
      youtube: ['', [urlValidator()]],
      screenshot: ['', [firebaseURLValidator()]],
      documentation: ['', [urlValidator()]],
    });
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
          this.imageUrl = reader.result as string;
          this.imagePreview = this.imageUrl;
          this.cdr.detectChanges();
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

    // Get all project cards and create update action
    const allProjectCards = this.store.selectSignal(portfolioCardsSelector)();
    const stateUpdateAction = (updatedData: any): any => {
      if (allProjectCards && Array.isArray(allProjectCards)) {
        // Update the specific card with new screenshot URL
        const updatedCards = allProjectCards.map((card: any) => (
          card.id === this.data.currentId ? { ...card, screenshotURL: updatedData.imageSrc } : card
        ));
        if (this.data.type === ProjectCardType.featured) {
          return StateActions.featuredProjectCardsStateUpdated({ projectCards: updatedCards });
        }
        return StateActions.projectCardsStateUpdated({ projectCards: updatedCards });
      }

      if (this.data.type === ProjectCardType.featured) {
        return StateActions.featuredProjectCardsStateUpdated({ projectCards: [] });
      }
      return StateActions.projectCardsStateUpdated({ projectCards: [] });
    };

    this.dialog.open(
      UploadPhotoComponent,
      {
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        data: {
          title: 'Upload Project Screenshot',
          fieldPath,
          currentImageUrl: this.defaultImageSrc,
          stateUpdateAction,
          onImageUploaded: (imageUrl: string) => {
            // Update the form field with the uploaded image URL
            this.cardAddForm.patchValue({
              screenshot: imageUrl,
            });
          },
        },
      },
    );
  }

  /**
   * Add project card data
   */
  protected async addData(): Promise<void> {
    if (!this.cardAddForm.valid) return;

    const {
      description, technologies, codebase, youtube, screenshot, documentation,
    } = this.cardAddForm.value;

    let { heading } = this.data;
    let fileStoragePath = '';
    let databaseDocPath = '';

    if (this.data.type === ProjectCardType.featured) {
      heading = this.cardAddForm.value.heading ?? 'Default Heading';
      fileStoragePath = `portfolio/featured-projects/ID-${this.utility.getPaddedDigits(this.data.currentId, 2)}-Image.webp/`;
      databaseDocPath = `featured-project-section/project-${this.utility.getPaddedDigits(this.data.currentId, 2)}/`;
    } else {
      fileStoragePath = `portfolio/project-card-images/ID-${this.utility.getPaddedDigits(this.data.currentId, 2)}-Image.webp/`;
      databaseDocPath = `project-data-section/project-${this.utility.getPaddedDigits(this.data.currentId, 2)}/`;
    }

    // Handle file upload if a new file was selected (check if imageUrl is not empty/default)
    const hasNewFile = this.imageUrl && this.imageUrl !== '' && this.imageUrl !== this.defaultImageSrc;

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
    return new Promise((resolve, reject) => {
      // Clear any existing interval before starting a new one
      if (this.uploadProgressIntervalId !== undefined) {
        clearInterval(this.uploadProgressIntervalId);
      }

      // Start the upload
      this.setDataService.pushFileToStorage(fileStoragePath, this.imageUrl);

      // Set up progress tracking and wait for completion
      this.uploadProgressIntervalId = window.setInterval(() => {
        this.progressValue = this.setDataService.getProgressValue();
        this.isUploadCompleted = this.setDataService.getUploadCompleteState();
        this.cdr.detectChanges();

        // Check if upload is complete
        if (this.isUploadCompleted) {
          // Clear the interval
          clearInterval(this.uploadProgressIntervalId);
          this.uploadProgressIntervalId = undefined;

          // Clear the timeout since upload completed successfully
          if (this.uploadCheckTimeoutId !== undefined) {
            clearTimeout(this.uploadCheckTimeoutId);
            this.uploadCheckTimeoutId = undefined;
          }

          // Now get the download URL
          const newImageUrl = this.getDataService.getPhotoURL(fileStoragePath);
          this.imageUrlSubscription = newImageUrl.pipe(take(1)).subscribe({
            next: (result) => {
              if (result) {
                this.imageUrl = result; // Update local imageUrl for consistency
                resolve(result); // Return the Firebase Storage URL
              } else {
                reject(new Error('Failed to get upload URL'));
              }
            },
            error: (error) => {
              reject(error);
            },
          });
        }
      }, 100);

      // Timeout after 30 seconds
      this.uploadCheckTimeoutId = window.setTimeout(() => {
        if (this.uploadProgressIntervalId !== undefined) {
          clearInterval(this.uploadProgressIntervalId);
          this.uploadProgressIntervalId = undefined;
        }
        if (this.uploadCheckTimeoutId !== undefined) {
          clearTimeout(this.uploadCheckTimeoutId);
          this.uploadCheckTimeoutId = undefined;
        }
        reject(new Error('Upload timeout'));
      }, AddPortfolioRecordComponent.THIRTY_SECONDS_TIMEOUT);
    });
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
          this.imagePreview = this.defaultImageSrc;
          this.cdr.detectChanges();
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
