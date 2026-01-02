import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  MatDialogActions,
  MatDialogContent,
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose,
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
  of,
  Subscription,
  take,
  Observable,
} from 'rxjs';
import { Store } from '@ngrx/store';

import { IProjectView } from '@portfolio-v2/state/dataModels';
import {
  GetDataService,
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';

/**
 * Description Card Component
 */
@Component({
  selector: 'admin-description-card',
  imports: [
    CommonModule,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    ReactiveFormsModule,
    MatDialogClose,
  ],
  templateUrl: './description-card.component.html',
  styleUrl: './description-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionCardComponent implements OnInit, OnDestroy {
  /** Tile Editor Form */
  protected tileEditorForm!: FormGroup;

  /** Default Image URL */
  protected readonly defaultImageSrc = 'https://placehold.co/120x120.png';

  /** Preview Image URL */
  protected imagePreview = this.defaultImageSrc;

  /** Selected Image URL */
  protected imageUrl = '';

  /** Returns true if the edit is successful */
  protected isEditSuccess = of(false);

  /** Upload Complete Flag */
  protected isUploadCompleted = false;

  /** Image Upload Progress Value */
  protected progressValue = 0;

  /** Base Path for Images */
  private readonly basePathForImages = 'portfolio/portfolio-tiles';

  /** Base Path Docs */
  private readonly basePathForDocs = 'project-icon-section';

  /** Image URL Subscription */
  private imageUrlSubscription!: Subscription;

  /** Upload Progress Interval ID */
  private uploadProgressIntervalId: number | undefined;

  /** Observable of project data such as icons, headings and descriptions */
  private readonly projectView = this.store.selectSignal(portfolioCardsSelector);

  /**
   * constructor
   * @param cdr change detector ref
   * @param dialogRef dialog ref
   * @param data data
   * @param data.project project view
   * @param formBuilder form builder
   * @param getDataService get data service
   * @param setDataService set data service
   * @param store ngrx store
   * @param utility utility service
   */
  constructor(
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<DescriptionCardComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project: IProjectView },
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
      title: [this.data.project.viewHeading ?? 'title', [Validators.required]],
      description: [this.data.project.viewDescription ?? 'description', [Validators.required]],
      filePicker: [''],
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
  protected saveChanges(): void {
    // Validate form before proceeding
    if (!this.tileEditorForm.valid) {
      return;
    }

    const { filePicker, title, description } = this.tileEditorForm.value;
    const imageName = `ID-${this.utility.getPaddedDigits(this.data.project.id, 2)}-Icon.webp`;
    const fileStoragePath = `${this.basePathForImages}/${imageName}`;
    const databaseDocPath = `${this.basePathForDocs}/project-${this.utility.getPaddedDigits(this.data.project.id, 2)}/`;

    // Handle file upload if a new file was selected
    if (filePicker) {
      this.handleFileUpload(fileStoragePath);
    }

    // Validate project view exists
    const projectViewData = this.projectView();
    if (!projectViewData) {
      return;
    }

    // Only update imageURL if a new photo was provided, otherwise keep existing
    const imageURL = filePicker ? this.imageUrl : this.data.project.imageURL;

    // Create updated project view
    const newProjectView = this.createUpdatedProjectView(title, description, imageURL);

    // Save to database and handle success/updates
    this.isEditSuccess = this.saveDataRecord(
      databaseDocPath,
      newProjectView,
      title,
    );
  }

  /**
   * Create the updated project view object
   * @param title new title
   * @param description new description
   * @param imageURL image URL (new or existing)
   * @returns updated project view
   */
  private createUpdatedProjectView(
    title: string,
    description: string,
    imageURL: string,
  ): IProjectView {
    return {
      ...this.data.project,
      imageURL,
      viewHeading: title,
      viewDescription: description,
    };
  }

  /**
   * Handle file upload to storage and retrieve image URL
   * @param fileStoragePath path to store the file
   */
  private handleFileUpload(fileStoragePath: string): void {
    // Clear any existing interval before starting a new one
    if (this.uploadProgressIntervalId !== undefined) {
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
    this.imageUrlSubscription = newImageUrl.pipe(take(1)).subscribe((result) => {
      if (result) {
        this.imageUrl = result;
      }
    });
  }

  /**
   * Persist project changes to the database
   * @param databaseDocPath path to the project document
   * @param newProjectView updated project view
   * @param title new project title
   * @returns observable of success status
   */
  private saveDataRecord(
    databaseDocPath: string,
    newProjectView: IProjectView,
    title: string,
  ): Observable<boolean> {
    return this.setDataService
      .setRecord<IProjectView>(databaseDocPath, newProjectView).pipe(
      take(1),
      map((result) => {
        if (result === 'successfull') {
          // Update the displayed project data with the new image
          this.data.project = newProjectView;
          // Reset the preview to placeholder
          this.imagePreview = this.defaultImageSrc;
          this.cdr.detectChanges();

          // Update the related project card
          this.updateRelatedProjectCard(title);
        }
        this.store.dispatch(StateActions.portfolioCardsStateConnect());
        return result === 'successfull';
      }),
    );
  }

  /**
   * Update related project card in the database
   * @param title new title for the project card
   */
  private updateRelatedProjectCard(title: string): void {
    if (this.data.project.id !== 1) {
      const projectCardPath = `project-data-section/project-${this.utility.getPaddedDigits(this.data.project.id, 2)}/`;
      this.setDataService.modifyAField(projectCardPath, title, 'heading')
        .pipe(
          take(1),
          map((result) => {
            if (result === 'successfull') {
              this.store.dispatch(StateActions.projectCardIDStateConnect());
            }
            return result;
          }),
        )
        .subscribe();
    }
  }
}
