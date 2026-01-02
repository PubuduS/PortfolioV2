import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';

import {
  GetDataService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import { DisplayValidatorErrorsComponent } from '@portfolio-v2/shared/components';
import { IUploadPhotoConfig } from '../types/upload-photo-config.interface';

/**
 *
 */
@Component({
  selector: 'admin-upload-photo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    DisplayValidatorErrorsComponent,
  ],
  templateUrl: './upload-photo.component.html',
  styleUrl: './upload-photo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadPhotoComponent implements OnInit, OnDestroy {
  /** Upload Photo Form */
  protected uploadPhotoForm!: FormGroup;

  /** Default Image URL */
  private readonly defaultImageSrc = 'https://placehold.co/600x400.png';

  /** Preview Image URL */
  protected imagePreview = this.defaultImageSrc;

  /** Selected Image URL */
  protected imageUrl = '';

  /** Image Upload Progress Value */
  protected progressValue = 0;

  /** Upload Complete Flag */
  protected isUploadCompleted = false;

  /** Current Image URL for display (updated after successful upload) */
  protected currentImageUrl!: string;

  /** Current Data from State */
  protected currentData!: Signal<any>;

  /** My Image Subscription */
  private myImageSubscription!: Subscription;

  /** Image URL Subscription */
  private imageUrlSubscription!: Subscription;

  /** Upload Progress Interval ID */
  private uploadProgressIntervalId: number | undefined;

  /**
   * constructor
   * @param formBuilder form builder
   * @param cdr change detector ref
   * @param setDataService set data service
   * @param getDataService get data service
   * @param store ngrx store
   * @param config upload photo configuration from MAT_DIALOG_DATA
   */
  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private setDataService: SetDataService,
    private getDataService: GetDataService,
    private store: Store,
    @Inject(MAT_DIALOG_DATA) protected readonly config: IUploadPhotoConfig,
  ) {}

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.uploadPhotoForm = this.formBuilder.group({
      filePicker: ['', [Validators.required]],
    });

    // Initialize current image URL for display
    this.currentImageUrl = this.config.currentImageUrl || '';

    // Initialize currentData signal with the provided selector
    if (this.config.stateSelector) {
      this.currentData = this.store.selectSignal(this.config.stateSelector);
    }
  }

  /**
   * @inheritdoc
   */
  public ngOnDestroy(): void {
    if (this.myImageSubscription) {
      this.myImageSubscription.unsubscribe();
    }
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
  protected onFileChange(event: Event): void {
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
   * Upload data
   */
  protected uploadData(): void {
    const { filePicker } = this.uploadPhotoForm.value;
    if (filePicker) {
      const databaseFilePath = this.config.fieldPath;
      if (!databaseFilePath) {
        return;
      }

      // Clear any existing interval before starting a new one
      if (this.uploadProgressIntervalId !== undefined) {
        clearInterval(this.uploadProgressIntervalId);
      }

      this.setDataService.pushFileToStorage(databaseFilePath, this.imageUrl);
      this.uploadProgressIntervalId = window.setInterval(() => {
        this.progressValue = this.setDataService.getProgressValue();
        this.isUploadCompleted = this.setDataService.getUploadCompleteState();
        this.cdr.detectChanges();
      }, 100);

      const newImageUrl = this.getDataService.getPhotoURL(databaseFilePath);
      this.imageUrlSubscription = newImageUrl.subscribe((result) => {
        if (result) {
          this.setDataService.modifyImageSrcField(databaseFilePath, result);
          if (this.currentData && this.config.stateUpdateAction) {
            this.store.dispatch(this.config.stateUpdateAction({
              ...this.currentData(),
              imageSrc: result,
            }));
          }

          // Update UI after successful upload
          this.imagePreview = this.defaultImageSrc; // Reset new photo to default
          this.currentImageUrl = result; // Show uploaded image as current photo

          // Call the optional callback with the uploaded image URL
          if (this.config.onImageUploaded) {
            this.config.onImageUploaded(result);
          }

          this.cdr.detectChanges();
        }
      });
    }
  }
}
