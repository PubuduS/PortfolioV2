import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef,
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
import { Store } from '@ngrx/store';

import {
  IProjectView,
  projectIconFilePath,
} from '@portfolio-v2/state/dataModels';
import { SetDataService } from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import {
  portfolioCardsSelector,
  projectCardSelector,
  newProjectRecordIdSelector,
} from '@portfolio-v2/state/selectors';
import {
  ProjectCardType,
  TilePreviewComponent,
} from '@portfolio-v2/admin/shared/components';
import { PortfolioWriter } from '../services/portfolio-writer.service';

/** What Next asks the portfolio page to open. */
export interface TileEditorNext {
  /** Id of the tile that was just stored. */
  currentId: number;
  /** Heading copied onto the new card. */
  heading: string;
  /** Standard card, never the featured card. */
  type: ProjectCardType;
}

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
    FormField,
    MatDialogClose,
    TilePreviewComponent,
  ],
  templateUrl: './add-tile.component.html',
  styleUrl: './add-tile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTileComponent implements OnInit, OnDestroy {
  /** Title and description the editor is changing. */
  private readonly model = signal({ title: '', description: '' });

  /** Tile Editor Form */
  protected readonly tileEditorForm = form(this.model, (fields) => {
    required(fields.title);
    required(fields.description);
  });

  /** Card ID */
  protected nextCardId = this.store.selectSignal(newProjectRecordIdSelector);

  /** Default Image URL */
  protected readonly defaultImageSrc = 'https://placehold.co/120x120.png';

  /** Preview Image URL */
  protected readonly imagePreview = signal(this.defaultImageSrc);

  /** Selected Image URL */
  protected readonly imageUrl = signal('');

  /** Selected file for upload */
  protected selectedFile: File | null = null;

  /** True after a tile is stored. */
  protected readonly isEditSuccess = signal(false);

  /** Upload Complete Flag */
  protected readonly isUploadCompleted = signal(false);

  /** Image Upload Progress Value */
  protected readonly progressValue = signal(0);

  /** New updated image */
  protected readonly newUpdatedImage = signal(this.defaultImageSrc);

  /** Updated image */
  protected readonly updatedImage = this.store.selectSignal(projectCardSelector(this.nextCardId()));

  /** Current Card ID */
  private readonly currentCardId = this.nextCardId();

  /** Observable of project data such as icons, headings and descriptions */
  private readonly projectView = this.store.selectSignal(portfolioCardsSelector);

  /** Timeout limit for upload in milliseconds (30 seconds) */
  private static readonly THIRTY_SECONDS_TIMEOUT = 30000;

  /** Upload timeout, cleared when the dialog closes. */
  private uploadTimeoutId: number | undefined;

  /**
   * constructor
   * @param dialogRef dialog reference
   * @param setDataService set data service
   * @param store ngrx store
   * @param writer portfolio writes
   */
  constructor(
    private dialogRef: MatDialogRef<AddTileComponent, TileEditorNext>,
    private setDataService: SetDataService,
    private store: Store,
    private writer: PortfolioWriter,
  ) {}

  /**
   * Build an empty tile form.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.tileEditorForm().reset({ title: '', description: '' });
  }

  /**
   * Drop the image subscription and any upload timer still running.
   * @inheritdoc
   */
  public ngOnDestroy(): void {
    this.clearUploadTimeout();
  }

  /**
   * Delete the tile
   * @returns void
   */
  protected async deleteTile(): Promise<void> {
    try {
      await this.writer.removeNewTile(this.currentCardId);
      this.store.dispatch(StateActions.portfolioCardsStateConnect());
      this.dialogRef.close();
    } catch (_error) {
      // Leave the dialog open when the tile document is still there.
    }
  }

  /**
   * Ask the portfolio page to open the card editor.
   * Opening it here attaches the next dialog to this view, and closing
   * this dialog destroys that view before the form can render.
   */
  protected goToCardEditor(): void {
    this.dialogRef.close({
      currentId: this.currentCardId,
      heading: this.tileEditorForm().value().title,
      type: ProjectCardType.standard,
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
  protected async saveChanges(): Promise<void> {
    // Validate form before proceeding
    if (!this.tileEditorForm().valid()) {
      return;
    }

    const { title, description } = this.tileEditorForm().value();
    const fileStoragePath = projectIconFilePath(this.nextCardId());

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
      } catch (_error) {
        // If upload fails, keep default image URL
        // Error handling can be added here if needed
      }
    }

    // Create updated project view with the correct image URL
    const newProjectView = this.createNewProjectView(title, description, imageURL);

    await this.addDataRecord(newProjectView);
    this.newUpdatedImage.set(imageURL);
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
    this.clearUploadTimeout();
    const timeout = new Promise<never>((_resolve, reject) => {
      this.uploadTimeoutId = window.setTimeout(() => {
        reject(new Error('Upload timeout'));
      }, AddTileComponent.THIRTY_SECONDS_TIMEOUT);
    });

    try {
      const result = await Promise.race([
        this.setDataService.uploadDataUrl(fileStoragePath, this.imageUrl(), (percent) => {
          this.progressValue.set(percent);
          this.isUploadCompleted.set(percent === 100);
        }),
        timeout,
      ]);
      this.imageUrl.set(result);
      return result;
    } finally {
      this.clearUploadTimeout();
    }
  }

  /**
   * Stop a pending upload timeout.
   */
  private clearUploadTimeout(): void {
    if (this.uploadTimeoutId !== undefined) {
      window.clearTimeout(this.uploadTimeoutId);
      this.uploadTimeoutId = undefined;
    }
  }

  /**
   * Persist project changes to the database
   * @param newProjectView updated project view
   * @returns true when the tile is stored
   */
  private async addDataRecord(newProjectView: IProjectView): Promise<boolean> {
    this.isEditSuccess.set(false);
    try {
      await this.writer.saveTile(newProjectView);
      this.imagePreview.set(this.defaultImageSrc);
      this.store.dispatch(StateActions.portfolioCardsStateConnect());
      this.isEditSuccess.set(true);
      return true;
    } catch {
      this.store.dispatch(StateActions.portfolioCardsStateConnect());
      this.isEditSuccess.set(false);
      return false;
    }
  }
}
