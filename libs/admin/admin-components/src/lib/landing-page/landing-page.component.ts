import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import {
  CommonModule,
  TitleCasePipe,
} from '@angular/common';
import {
  form,
  FormField,
  required,
} from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { SetDataService } from '@portfolio-v2/shared/services';

/** One public banner file the landing editor can replace. */
interface BannerAsset {
  /** Storage suffix after `{Season}_Banner-`. */
  suffix: string;
  /** Label shown beside the file input. */
  label: string;
  /** File types the input accepts. */
  accept: string;
}

/**
 * Landing page admin section
 */
@Component({
  selector: 'admin-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    FormField,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
  ],
  providers: [TitleCasePipe],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  /** Files the public banner requests for the selected season. */
  protected readonly bannerAssets: BannerAsset[] = [
    { suffix: 'poster-mobile.webp', label: 'Phone still (WebP)', accept: 'image/webp' },
    { suffix: 'poster-desktop.webp', label: 'Desktop still (WebP)', accept: 'image/webp' },
    { suffix: 'mobile.webm', label: 'Phone clip (WebM)', accept: 'video/webm' },
    { suffix: 'mobile.mp4', label: 'Phone clip (MP4)', accept: 'video/mp4' },
    { suffix: 'desktop.webm', label: 'Desktop clip (WebM)', accept: 'video/webm' },
    { suffix: 'desktop.mp4', label: 'Desktop clip (MP4)', accept: 'video/mp4' },
  ];

  /** Selected season. */
  private readonly seasonModel = signal({ seasonsPicker: 'winter' });

  /** Landing form */
  protected readonly landingForm = form(this.seasonModel, (fields) => {
    required(fields.seasonsPicker);
  });

  /** Default Image URL */
  private readonly defaultImageSrc = 'https://placehold.co/600x400.png';

  /** Preview Image URL */
  protected readonly imagePreview = signal(this.defaultImageSrc);

  /** Image Upload Progress Value */
  protected readonly progressValue = signal(0);

  /** Upload Complete Flag */
  protected readonly isUploadCompleted = signal(false);

  /** True once at least one banner file is chosen. */
  protected readonly hasSelectedFile = signal(false);

  /** Base Path */
  private readonly basePath = 'portfolio/landing-page/banners';

  /** Files chosen for this upload, keyed by the public suffix. */
  private readonly selectedFiles = new Map<string, File>();

  /**
   * constructor
   * @param titleCasePipe title case pipe
   * @param setDataService Set Data Service
   */
  constructor(
    private titleCasePipe: TitleCasePipe,
    private setDataService: SetDataService,
  ) {}

  /**
   * Keep the chosen file and preview a still when the file is an image.
   * @param suffix Public banner suffix this input replaces.
   * @param event File input change event.
   */
  protected onBannerFile(suffix: string, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    const file = event.target.files?.[0];
    if (!file) {
      this.selectedFiles.delete(suffix);
      this.hasSelectedFile.set(this.selectedFiles.size > 0);
      return;
    }
    this.selectedFiles.set(suffix, file);
    this.hasSelectedFile.set(true);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview.set(String(reader.result));
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Upload each chosen file to the public banner path for the selected season.
   */
  protected startUpload(): void {
    this.uploadSelectedFiles().catch(() => undefined);
  }

  /**
   * Upload the chosen files one after another.
   * @returns Resolves when every chosen file has finished uploading.
   */
  public async uploadSelectedFiles(): Promise<void> {
    const season = this.landingForm().value().seasonsPicker;
    const uploads = this.bannerAssets.flatMap((asset) => {
      const file = this.selectedFiles.get(asset.suffix);
      return file ? [{ file, suffix: asset.suffix }] : [];
    });
    if (!season || uploads.length === 0) {
      return;
    }
    this.isUploadCompleted.set(false);
    await uploads.reduce(
      (chain, upload) => chain.then(() => this.uploadOne(season, upload.file, upload.suffix)),
      Promise.resolve(),
    );
    this.isUploadCompleted.set(true);
  }

  /**
   * Upload one banner file and refresh the progress bar while it runs.
   * @param season Selected season.
   * @param file Chosen file.
   * @param suffix Public suffix this file replaces.
   * @returns Resolves when that file has finished uploading.
   */
  private async uploadOne(season: string, file: File, suffix: string): Promise<void> {
    const url = URL.createObjectURL(file);
    const path = this.bannerStoragePath(season, suffix);
    const pending = this.setDataService.pushFileToStorage(path, url);
    const timer = setInterval(() => {
      this.progressValue.set(this.setDataService.getProgressValue());
    }, 100);
    try {
      await pending;
    } finally {
      clearInterval(timer);
      URL.revokeObjectURL(url);
    }
    this.progressValue.set(this.setDataService.getProgressValue());
  }

  /**
   * Storage path for one public banner file.
   * @param season Selected season.
   * @param suffix File suffix, such as `poster-mobile.webp`.
   * @returns Path inside the storage bucket.
   */
  private bannerStoragePath(season: string, suffix: string): string {
    const seasonName = this.titleCasePipe.transform(season);
    return `${this.basePath}/${season}/${seasonName}_Banner-${suffix}`;
  }
}
