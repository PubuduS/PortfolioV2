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
import { DisplayValidatorErrorsComponent } from '@portfolio-v2/shared/components';
import { IProjectCard } from '@portfolio-v2/state/dataModels';
import { UploadPhotoComponent } from '../upload-photo/upload-photo.component';

/**
 * Project Cards Component
 */
@Component({
  selector: 'admin-add-portfolio-record',
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

  /** Image URL Subscription */
  private imageUrlSubscription!: Subscription;

  /** Upload Progress Interval ID */
  private uploadProgressIntervalId: number | undefined;

  /**
   * constructor
   * @param dialog dialog ref
   * @param data data
   * @param data.currentId current id
   * @param data.heading heading
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
  }

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
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
    const imageName = `ID-${this.utility.getPaddedDigits(this.data.currentId, 2)}-Screenshot.webp`;
    const fieldPath = `portfolio/project-screenshots/normal/${imageName}/`;

    // Get all project cards and create update action
    const allProjectCards = this.store.selectSignal(portfolioCardsSelector)();
    const stateUpdateAction = (updatedData: any): any => {
      if (allProjectCards && Array.isArray(allProjectCards)) {
        // Update the specific card with new screenshot URL
        const updatedCards = allProjectCards.map((card: any) => (
          card.id === this.data.currentId ? { ...card, screenshotURL: updatedData.imageSrc } : card
        ));
        return StateActions.projectCardsStateUpdated({ projectCards: updatedCards });
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
  protected addData(): void {
    if (!this.cardAddForm.valid) return;

    const {
      description, technologies, codebase, youtube, screenshot, documentation,
    } = this.cardAddForm.value;

    const fileStoragePath = `portfolio/project-card-images/ID-${this.utility.getPaddedDigits(this.data.currentId, 2)}-Image.webp/`;
    const databaseDocPath = `project-data-section/project-${this.utility.getPaddedDigits(this.data.currentId, 2)}/`;

    // Handle file upload if a new file was selected (check if imageUrl is not empty/default)
    const hasNewFile = this.imageUrl && this.imageUrl !== '' && this.imageUrl !== this.defaultImageSrc;
    if (hasNewFile) {
      this.handleFileUpload(fileStoragePath);
    }

    // Only update imageURL if a new photo was provided, otherwise keep existing
    const imageURL = hasNewFile
      ? this.imageUrl
      : this.defaultImageSrc;

    const updatedCard: IProjectCard = {
      id: this.data.currentId,
      heading: this.data.heading,
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
   */
  private handleFileUpload(fileStoragePath: string): void {
    // Clear any existing interval before starting a new one
    if (!this.uploadProgressIntervalId) {
      clearInterval(this.uploadProgressIntervalId);
    }

    this.setDataService.pushFileToStorage(fileStoragePath, this.imageUrl);
    this.uploadProgressIntervalId = window.setInterval(() => {
      this.progressValue = this.setDataService.getProgressValue();
      this.isUploadCompleted = this.setDataService.getUploadCompleteState();
      this.cdr.detectChanges();
    }, 100);

    // Handle image URL retrieval with proper subscription management
    const newImageUrl = this.getDataService.getPhotoURL(fileStoragePath);
    this.imageUrlSubscription = newImageUrl.pipe(
      take(1),
    ).subscribe((result) => {
      if (result) {
        this.imageUrl = result;
      }
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
        this.store.dispatch(StateActions.portfolioCardsStateConnect());
        this.store.dispatch(StateActions.projectCardsStateConnect());
        return result === 'successfull';
      }),
    );
  }
}
