import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  signal,
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
  form,
  FormField,
  required,
} from '@angular/forms/signals';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';
import {
  catchError,
  from,
  map,
  Observable,
  of,
  take,
} from 'rxjs';
import { Store } from '@ngrx/store';

import { TilePreviewComponent } from '@portfolio-v2/admin/shared/components';
import {
  IProjectView,
  projectIconFilePath,
} from '@portfolio-v2/state/dataModels';
import { SetDataService } from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';
import { PortfolioWriter } from '../../services/portfolio-writer.service';

/**
 * Description Card Component
 */
@Component({
  selector: 'admin-description-card',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    FormField,
    MatDialogClose,
    TilePreviewComponent,
  ],
  templateUrl: './description-card.component.html',
  styleUrl: './description-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionCardComponent implements OnInit {
  /** Title and description the editor is changing. */
  private readonly model = signal({ title: '', description: '' });

  /** Tile Editor Form */
  protected readonly tileEditorForm = form(this.model, (fields) => {
    required(fields.title);
    required(fields.description);
  });

  /** Default Image URL */
  protected readonly defaultImageSrc = 'https://placehold.co/120x120.png';

  /** Preview Image URL */
  protected readonly imagePreview = signal(this.defaultImageSrc);

  /** Selected Image URL */
  protected readonly imageUrl = signal('');

  /** Returns true if the edit is successful */
  protected isEditSuccess = of(false);

  /** Upload Complete Flag */
  protected readonly isUploadCompleted = signal(false);

  /** Image Upload Progress Value */
  protected readonly progressValue = signal(0);

  /** Observable of project data such as icons, headings and descriptions */
  private readonly projectView = this.store.selectSignal(portfolioCardsSelector);

  /**
   * constructor
   * @param dialogRef dialog ref
   * @param data data
   * @param data.project project view
   * @param setDataService set data service
   * @param writer portfolio writes
   * @param store ngrx store
   */
  constructor(
    public dialogRef: MatDialogRef<DescriptionCardComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project: IProjectView },
    private setDataService: SetDataService,
    private writer: PortfolioWriter,
    private store: Store,
  ) {}

  /**
   * Build the tile form from the project this dialog was opened with.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.tileEditorForm().reset({
      title: this.data.project.viewHeading ?? 'title',
      description: this.data.project.viewDescription ?? 'description',
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
   * Save changes
   */
  protected saveChanges(): void {
    // Validate form before proceeding
    if (!this.tileEditorForm().valid()) {
      return;
    }

    const { title, description } = this.tileEditorForm().value();
    const filePicker = this.imageUrl();
    const fileStoragePath = projectIconFilePath(this.data.project.id);

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
    const imageURL = filePicker ? this.imageUrl() : this.data.project.imageURL;

    // Create updated project view
    const newProjectView = this.createUpdatedProjectView(title, description, imageURL);

    // Save to database and handle success/updates
    this.isEditSuccess = this.saveDataRecord(newProjectView, title);
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
    this.setDataService.uploadDataUrl(fileStoragePath, this.imageUrl(), (percent) => {
      this.progressValue.set(percent);
      this.isUploadCompleted.set(percent === 100);
    }).then((result) => {
      this.imageUrl.set(result);
    }).catch(() => undefined);
  }

  /**
   * Persist project changes to the database
   * @param newProjectView updated project view
   * @param title new project title
   * @returns observable of success status
   */
  private saveDataRecord(
    newProjectView: IProjectView,
    title: string,
  ): Observable<boolean> {
    return from(this.writer.saveTile(newProjectView)).pipe(
      take(1),
      map(() => {
        this.data.project = newProjectView;
        this.imagePreview.set(this.defaultImageSrc);
        this.updateRelatedProjectCard(title);
        this.store.dispatch(StateActions.portfolioCardsStateConnect());
        return true;
      }),
      catchError(() => {
        this.store.dispatch(StateActions.portfolioCardsStateConnect());
        return of(false);
      }),
    );
  }

  /**
   * Update related project card in the database.
   * The featured tile has no standard card to patch.
   * @param title new title for the project card
   */
  private updateRelatedProjectCard(title: string): void {
    if (this.data.project.id === 1) {
      return;
    }
    this.writer.patchCardHeading(this.data.project.id, title).catch(() => undefined);
  }
}
