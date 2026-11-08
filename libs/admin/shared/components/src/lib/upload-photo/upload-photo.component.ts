import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  form,
  required,
} from '@angular/forms/signals';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';

import { fieldHasError } from '@portfolio-v2/shared/forms';
import { SetDataService } from '@portfolio-v2/shared/services';
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
export class UploadPhotoComponent implements OnInit {
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

  /**
   * constructor
   * @param setDataService set data service
   * @param config upload photo configuration from MAT_DIALOG_DATA
   */
  constructor(
    private setDataService: SetDataService,
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
  protected async uploadData(): Promise<void> {
    this.uploadPhotoForm.fileName().markAsTouched();
    if (!this.uploadPhotoForm().valid()) {
      return;
    }
    const databaseFilePath = this.config.fieldPath;
    if (!databaseFilePath) {
      return;
    }

    try {
      const result = await this.setDataService.uploadDataUrl(
        databaseFilePath,
        this.imageUrl(),
        (percent) => {
          this.progressValue.set(percent);
          this.isUploadCompleted.set(percent === 100);
        },
      );
      this.imagePreview.set(this.defaultImageSrc);
      this.currentImageUrl.set(result);
      this.config.onImageUploaded?.(result);
    } catch {
      // The progress bar stays where the upload stopped.
    }
  }
}
