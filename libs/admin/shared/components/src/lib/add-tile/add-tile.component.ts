import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogClose,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';
import {
  map,
  Subscription,
  take,
  Observable,
  firstValueFrom,
  BehaviorSubject,
} from 'rxjs';
import { Store } from '@ngrx/store';

import { IProjectView } from '@portfolio-v2/state/dataModels';
import {
  GetDataService,
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import {
  portfolioCardsSelector,
  projectCardSelector,
  newProjectRecordIdSelector,
} from '@portfolio-v2/state/selectors';
import { AddPortfolioRecordComponent } from '../add-portfolio-record/add-portfolio-record.component';
import { ProjectCardType } from '../types/project-cards-type.enum';

/**
 * Add Tile Component
 */
@Component({
  selector: 'admin-add-tile',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogContent,
    MatDialogActions,
    MatDialogModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    ReactiveFormsModule,
    MatDialogClose,
  ],
  templateUrl: './add-tile.component.html',
  styleUrl: './add-tile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTileComponent implements OnInit, OnDestroy {
  /** Tile Editor Form */
  protected tileEditorForm!: FormGroup;

  /** Card ID */
  protected nextCardId = this.store.selectSignal(newProjectRecordIdSelector);

  /** Default Image URL */
  protected readonly defaultImageSrc = 'https://placehold.co/120x120.png';

  /** Preview Image URL */
  protected imagePreview = this.defaultImageSrc;

  /** Selected Image URL */
  protected imageUrl = '';

  /** Selected file for upload */
  protected selectedFile: File | null = null;

  /** Subject for edit success state */
  private editSuccessSubject = new BehaviorSubject<boolean>(false);

  /** Observable for edit success state (used with async pipe) */
  protected isEditSuccess = this.editSuccessSubject.asObservable();

  /** Upload Complete Flag */
  protected isUploadCompleted = false;

  /** Image Upload Progress Value */
  protected progressValue = 0;

  /** New updated image */
  protected newUpdatedImage = this.defaultImageSrc;

  /** Updated image */
  protected readonly updatedImage = this.store.selectSignal(projectCardSelector(this.nextCardId()));

  /** Base Path for Images */
  private readonly basePathForImages = 'portfolio/portfolio-tiles';

  /** Base Path Docs */
  private readonly basePathForDocs = 'project-icon-section';

  /** Current Card ID */
  private readonly currentCardId = this.nextCardId();

  /** Image URL Subscription */
  private imageUrlSubscription!: Subscription;

  /** Observable of project data such as icons, headings and descriptions */
  private readonly projectView = this.store.selectSignal(portfolioCardsSelector);

  /** Timeout limit for upload in milliseconds (30 seconds) */
  private static readonly THIRTY_SECONDS_TIMEOUT = 30000;

  /** Upload Progress Interval ID */
  private uploadProgressIntervalId: number | undefined;

  /** Upload Timeout ID */
  private uploadTimeoutId: number | undefined;

  /**
   * constructor
   * @param cdr change detector ref
   * @param dialog dialog
   * @param dialogRef dialog reference
   * @param formBuilder form builder
   * @param getDataService get data service
   * @param setDataService set data service
   * @param store ngrx store
   * @param utility utility service
   */
  constructor(
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<AddTileComponent>,
    private formBuilder: FormBuilder,
    private getDataService: GetDataService,
    private setDataService: SetDataService,
    private store: Store,
    private utility: UtilityService,
  ) {}

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.tileEditorForm = this.formBuilder.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });
  }

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
    if (this.uploadTimeoutId !== undefined) {
      clearTimeout(this.uploadTimeoutId);
    }
  }

  /**
   * Delete the tile
   * @returns void
   */
  protected async deleteTile(): Promise<void> {
    try {
      // Delete from database (required)
      const isDeleteTileSuccess = await firstValueFrom(
        this.setDataService.deleteRecord(`project-icon-section/project-${this.utility.getPaddedDigits(this.currentCardId, 2)}/`),
      );

      // Try to delete icon file (optional - don't fail if file doesn't exist)
      try {
        await firstValueFrom(
          this.setDataService.deleteFileFromStorage(`portfolio/portfolio-tiles/ID-${this.utility.getPaddedDigits(this.currentCardId, 2)}-Icon.webp`),
        );
      } catch (iconError) {
        // Icon file doesn't exist or can't be deleted - this is OK, continue with database deletion
      }

      if (isDeleteTileSuccess === 'successfull') {
        // Update the store with the new array (without the deleted item)
        this.store.dispatch(StateActions.portfolioCardsStateConnect());
        // Close the dialog if database deletion was successful (icon deletion is optional)
        this.dialogRef.close();
      }
    } catch (error) {
      // Handle any errors that might occur during the delete operation
      // Error handling can be added here if needed
    }
  }

  /**
   * Go to card editor
   */
  protected goToCardEditor(): void {
    this.dialogRef.close();
    this.dialog.open(AddPortfolioRecordComponent, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      width: '800px',
      data: {
        currentId: this.currentCardId,
        heading: this.tileEditorForm.value.title,
        type: ProjectCardType.standard,
      },
    });
  }

  /**
   * Handle the file picker.
   * Display preview image when user
   * selected an image from the file picker.
   * @param event event
   */
  protected onFileSelected(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      const file = event.target.files?.[0];
      if (file) {
        this.selectedFile = file; // Store the selected file
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
   * Save changes
   */
  protected async saveChanges(): Promise<void> {
    // Validate form before proceeding
    if (!this.tileEditorForm.valid) {
      return;
    }

    const { title, description } = this.tileEditorForm.value;
    const imageName = `ID-${this.utility.getPaddedDigits(this.nextCardId(), 2)}-Icon.webp`;
    const fileStoragePath = `${this.basePathForImages}/${imageName}`;
    const databaseDocPath = `${this.basePathForDocs}/project-${this.utility.getPaddedDigits(this.nextCardId(), 2)}/`;

    // Validate project view exists
    const projectViewData = this.projectView();
    if (!projectViewData) {
      return;
    }

    let imageURL = this.defaultImageSrc;

    // Handle file upload if a new file was selected
    if (this.selectedFile) {
      try {
        // Upload file and wait for Firebase Storage URL
        imageURL = await this.uploadFileAndGetUrl(fileStoragePath);
      } catch (error) {
        // If upload fails, keep default image URL
        // Error handling can be added here if needed
      }
    }

    // Create updated project view with the correct image URL
    const newProjectView = this.createNewProjectView(title, description, imageURL);

    // Save to database and handle success/updates
    this.addDataRecord(databaseDocPath, newProjectView).pipe(
      take(1),
    ).subscribe({
      next: (success) => {
        this.editSuccessSubject.next(success);
        this.newUpdatedImage = imageURL;
      },
      error: (_error) => {
        this.editSuccessSubject.next(false);
      },
    });
  }

  /**
   * Create the updated project view object
   * @param title new title
   * @param description new description
   * @param imageURL image URL (new or existing)
   * @returns updated project view
   */
  private createNewProjectView(
    title: string,
    description: string,
    imageURL: string,
  ): IProjectView {
    return {
      id: this.nextCardId(),
      imageURL,
      viewHeading: title,
      viewDescription: description,
    };
  }

  /**
   * Upload file to Firebase Storage and return the download URL
   * @param fileStoragePath path in Firebase Storage
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
          if (this.uploadTimeoutId !== undefined) {
            clearTimeout(this.uploadTimeoutId);
            this.uploadTimeoutId = undefined;
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
      this.uploadTimeoutId = window.setTimeout(() => {
        if (this.uploadProgressIntervalId !== undefined) {
          clearInterval(this.uploadProgressIntervalId);
          this.uploadProgressIntervalId = undefined;
        }
        if (this.uploadTimeoutId !== undefined) {
          clearTimeout(this.uploadTimeoutId);
          this.uploadTimeoutId = undefined;
        }
        reject(new Error('Upload timeout'));
      }, AddTileComponent.THIRTY_SECONDS_TIMEOUT);
    });
  }

  /**
   * Persist project changes to the database
   * @param databaseDocPath path to the project document
   * @param newProjectView updated project view
   * @returns observable of success status
   */
  private addDataRecord(
    databaseDocPath: string,
    newProjectView: IProjectView,
  ): Observable<boolean> {
    return this.setDataService
      .setRecord<IProjectView>(databaseDocPath, newProjectView).pipe(
      take(1),
      map((result) => {
        if (result === 'successfull') {
          // Reset the preview to placeholder
          this.imagePreview = this.defaultImageSrc;
          this.cdr.detectChanges();
        }
        this.store.dispatch(StateActions.portfolioCardsStateConnect());
        return result === 'successfull';
      }),
    );
  }
}
