import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import {
  CommonModule,
  TitleCasePipe,
} from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DisplayValidatorErrorsComponent } from '@portfolio-v2/shared/components';
import { SetDataService } from '@portfolio-v2/shared/services';

/**
 * Landing page admin section
 */
@Component({
  selector: 'admin-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    DisplayValidatorErrorsComponent,
  ],
  providers: [TitleCasePipe],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent implements OnInit {
  /** Landing form */
  protected landingnForm!: FormGroup;

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

  /** Base Path */
  private readonly basePath = 'portfolio/landing-page/banners';

  /**
   * constructor
   * @param formBuilder form builder
   * @param cdr change detenction reference
   * @param titleCasePipe title case pipe
   * @param setDataService Set Data Service
   */
  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private titleCasePipe: TitleCasePipe,
    private setDataService: SetDataService,
  ) {}

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.landingnForm = this.formBuilder.group({
      filePicker: ['', [Validators.required]],
      seasonsPicker: ['winter', [Validators.required]],
    });
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
  public uploadData(): void {
    const { filePicker, seasonsPicker } = this.landingnForm.value;
    if (filePicker && seasonsPicker) {
      const databseFilePath = this.getCorrectBannerPath(seasonsPicker);
      this.setDataService.pushFileToStorage(databseFilePath, this.imageUrl);
      setInterval(() => {
        this.progressValue = this.setDataService.getProgressValue();
        this.isUploadCompleted = this.setDataService.getUploadCompleteState();
        this.cdr.detectChanges();
      }, 100);
    }
  }

  /**
   * Get the correct banner path based on the user selection
   * @param season season
   * @returns path for the correct database location
   */
  private getCorrectBannerPath(season: string): string {
    const seasonName = this.titleCasePipe.transform(season);
    const bannerName = `${seasonName}_Banner.gif`;
    return `${this.basePath}/${season}/${bannerName}`;
  }
}
