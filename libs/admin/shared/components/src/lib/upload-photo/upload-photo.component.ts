import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  form,
  required,
} from '@angular/forms/signals';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';

import { fieldHasError } from '@portfolio-v2/shared/forms';
import {
  GetDataService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import { IUploadPhotoConfig } from '@portfolio-v2/admin/shared/types';

/** Dialog that uploads a replacement photo and previews it. */
@Component({
  selector: 'admin-upload-photo',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './upload-photo.component.html',
  styleUrl: './upload-photo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadPhotoComponent implements OnInit, OnDestroy {
  /** Chosen file name. Empty until a file is selected. */
  private readonly model = signal({ fileName: '' });

  /** Upload Photo Form */
  protected readonly uploadPhotoForm = form(this.model, (fields) => {
    required(fields.fileName);
  });

  /** Default Image URL */
  private readonly defaultImageSrc = 'https://placehold.co/600x400.png';

  /** Preview Image URL */
  protected readonly imagePreview = signal(this.defaultImageSrc);

  /** Selected Image URL */
  protected readonly imageUrl = signal('');

  /** Image Upload Progress Value */
  protected readonly progressValue = signal(0);

  /** Upload Complete Flag */
  protected readonly isUploadCompleted = signal(false);

  /** Current Image URL for display (updated after successful upload) */
  protected readonly currentImageUrl = signal('');

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
   * @param setDataService set data service
   * @param getDataService get data service
   * @param store ngrx store
   * @param config upload photo configuration from MAT_DIALOG_DATA
   */
  constructor(
    private setDataService: SetDataService,
    private getDataService: GetDataService,
    private store: Store,
    @Inject(MAT_DIALOG_DATA) protected readonly config: IUploadPhotoConfig,
  ) {}

  /**
   * Build the file form and load the photo this dialog was opened with.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.uploadPhotoForm().reset({ fileName: '' });

    // Initialize current image URL for display
    this.currentImageUrl.set(this.config.currentImageUrl || '');

    // Initialize currentData signal with the provided selector
    if (this.config.stateSelector) {
      this.currentData = this.store.selectSignal(this.config.stateSelector);
    }
  }

  /**
   * Drop the image subscriptions and any upload timer still running.
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
        this.uploadPhotoForm.fileName().value.set(file.name);
        const reader = new FileReader();
        reader.onload = () => {
          this.imageUrl.set(reader.result as string);
          this.imagePreview.set(this.imageUrl());
        };
        reader.readAsDataURL(file);
      }
    }
  }

  /** Whether a touched or dirty field currently has this error. */
  protected readonly hasError = fieldHasError;

  /**
   * Upload data
   */
  protected uploadData(): void {
    this.uploadPhotoForm.fileName().markAsTouched();
    if (this.uploadPhotoForm().valid()) {
      const databaseFilePath = this.config.fieldPath;
      if (!databaseFilePath) {
        return;
      }

      // Clear any existing interval before starting a new one
      if (this.uploadProgressIntervalId !== undefined) {
        clearInterval(this.uploadProgressIntervalId);
      }

      this.setDataService.pushFileToStorage(databaseFilePath, this.imageUrl())
        .catch(() => undefined);
      this.uploadProgressIntervalId = window.setInterval(() => {
        this.progressValue.set(this.setDataService.getProgressValue());
        this.isUploadCompleted.set(this.setDataService.getUploadCompleteState());
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
          this.imagePreview.set(this.defaultImageSrc);
          this.currentImageUrl.set(result);

          // Call the optional callback with the uploaded image URL
          if (this.config.onImageUploaded) {
            this.config.onImageUploaded(result);
          }
        }
      });
    }
  }
}
