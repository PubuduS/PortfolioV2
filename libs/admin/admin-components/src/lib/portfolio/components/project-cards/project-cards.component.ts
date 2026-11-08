import {
  ChangeDetectionStrategy,
  Component,
  effect,
  Inject,
  OnDestroy,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import {
  type FieldTree,
  form,
  FormField,
  required,
} from '@angular/forms/signals';
import {
  map,
  Observable,
  of,
  Subscription,
  take,
} from 'rxjs';
import { CommonModule } from '@angular/common';

import {
  projectCardSelector,
  portfolioCardsSelector,
  featuredProjectCardSelector,
} from '@portfolio-v2/state/selectors';
import {
  GetDataService,
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import {
  firebaseUrl,
  webUrl,
} from '@portfolio-v2/shared/validators';
import { StateActions } from '@portfolio-v2/state';
import {
  UploadPhotoComponent,
  ProjectCardType,
} from '@portfolio-v2/admin/shared/components';
import { IProjectCard } from '@portfolio-v2/state/dataModels';

/** Text and links the project-card editor saves. */
interface ProjectCardValues {
  /** Description. */
  description: string;
  /** Technologies. */
  technologies: string;
  /** Codebase URL. */
  codebase: string;
  /** YouTube URL. */
  youtube: string;
  /** Screenshot URL. */
  screenshot: string;
  /** Documentation URL. */
  documentation: string;
}

/**
 * A blank project card.
 * @returns empty card values
 */
function emptyCard(): ProjectCardValues {
  return {
    description: '',
    technologies: '',
    codebase: '',
    youtube: '',
    screenshot: '',
    documentation: '',
  };
}

/**
 * Project Cards Component
 */
@Component({
  selector: 'admin-project-cards',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatDialogClose,
    FormField,
  ],
  templateUrl: './project-cards.component.html',
  styleUrl: './project-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardsComponent implements OnInit, OnDestroy {
  /** Values the editor is changing. */
  private readonly model = signal<ProjectCardValues>(emptyCard());

  /** Card Editor Form */
  protected readonly cardEditorForm = form(this.model, (fields) => {
    required(fields.description);
    required(fields.technologies);
    webUrl(fields.codebase);
    webUrl(fields.youtube);
    firebaseUrl(fields.screenshot);
    webUrl(fields.documentation);
  });

  /** Default Image URL */
  protected readonly defaultImageSrc = 'https://placehold.co/300x200.png';

  /** Returns true if the edit is successful */
  protected isEditSuccess = of(false);

  /** Preview Image URL */
  protected readonly imagePreview = signal(this.defaultImageSrc);

  /** Selected Image URL */
  protected readonly imageUrl = signal('');

  /** Selected file for upload */
  protected selectedFile: File | null = null;

  /** Upload Complete Flag */
  protected readonly isUploadCompleted = signal(false);

  /** Selected card ID */
  private cardId = 1;

  /** Selected project card */
  protected readonly projectCard: Signal<IProjectCard | undefined> = signal(undefined);

  /** True after the editor has been filled from a stored card. */
  private hasAppliedCard = false;

  /** Image URL Subscription */
  private imageUrlSubscription!: Subscription;

  /** Image Upload Progress Value */
  protected readonly progressValue = signal(0);

  /** Upload Progress Interval ID */
  private uploadProgressIntervalId: number | undefined;

  /**
   * constructor
   * @param data data
   * @param data.cardId card id
   * @param data.type project card type
   * @param dialog dialog ref
   * @param getDataService get data service
   * @param setDataService set data service
   * @param store ngrx store
   * @param utility utility service
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { cardId: number, type: ProjectCardType },
    public dialog: MatDialog,
    private getDataService: GetDataService,
    private setDataService: SetDataService,
    private store: Store,
    private utility: UtilityService,
  ) {
    this.cardId = this.data.cardId ?? 1;
    if (this.data.type === ProjectCardType.featured) {
      this.store.dispatch(StateActions.featuredProjectCardsStateConnect());
      this.projectCard = this.store.selectSignal(featuredProjectCardSelector(this.cardId));
    } else {
      this.store.dispatch(StateActions.projectCardsStateConnect());
      this.projectCard = this.store.selectSignal(projectCardSelector(this.cardId));
    }
    effect(() => {
      this.applyCard(this.projectCard());
    });
  }

  /**
   * Drop the image subscription and any upload timer still running.
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
   * Build the card form from the project this dialog was opened with.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.applyCard(this.projectCard());
  }

  /**
   * Whether a touched or dirty field currently has this error.
   * @param field field to read
   * @param kind error kind
   * @returns true when that error should be shown
   */
  protected hasError(field: FieldTree<unknown>, kind: string): boolean {
    const state = field();
    return (state.touched() || state.dirty()) && state.getError(kind) !== undefined;
  }

  /**
   * Fill the editor once the stored card arrives.
   * @param card Stored project card.
   */
  private applyCard(card: IProjectCard | undefined): void {
    if (!card || this.hasAppliedCard) {
      return;
    }
    this.hasAppliedCard = true;
    this.cardEditorForm().reset({
      description: card.description ?? '',
      technologies: card.tools ?? '',
      codebase: card.githubURL ?? '',
      youtube: card.demoURL ?? '',
      screenshot: card.screenshotURL ?? '',
      documentation: card.documentationURL ?? '',
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
   * Open dialog description
   */
  protected openUploadPhotoPanel(): void {
    const imageName = `ID-${this.utility.getPaddedDigits(this.cardId, 2)}-Screenshot.webp`;
    const basePath = 'portfolio/project-screenshots';
    let fieldPath = '';
    if (this.data.type === ProjectCardType.featured) {
      fieldPath = `${basePath}/featured/${imageName}/`;
    } else {
      fieldPath = `${basePath}/normal/${imageName}/`;
    }

    // Get all project cards and create update action
    const allProjectCards = this.store.selectSignal(portfolioCardsSelector)();
    const stateUpdateAction = (updatedData: any): any => {
      if (allProjectCards && Array.isArray(allProjectCards)) {
        // Update the specific card with new screenshot URL
        const updatedCards = allProjectCards.map((card: any) => (
          card.id === this.cardId ? { ...card, screenshotURL: updatedData.imageSrc } : card
        ));
        if (this.data.type === ProjectCardType.featured) {
          return StateActions.featuredProjectCardsStateUpdated({ projectCards: updatedCards });
        }
        return StateActions.projectCardsStateUpdated({ projectCards: updatedCards });
      }
      if (this.data.type === ProjectCardType.featured) {
        return StateActions.featuredProjectCardsStateUpdated({ projectCards: [] });
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
          currentImageUrl: this.projectCard()?.screenshotURL ?? this.defaultImageSrc,
          stateUpdateAction,
          onImageUploaded: (imageUrl: string) => {
            // Update the form field with the uploaded image URL
            this.cardEditorForm.screenshot().value.set(imageUrl);
          },
        },
      },
    );
  }

  /**
   * Update project card data
   */
  protected updateData(): void {
    if (!this.cardEditorForm().valid()) return;

    const {
      description, technologies, codebase, youtube, screenshot, documentation,
    } = this.cardEditorForm().value();

    let fileStoragePath = '';
    let databaseDocPath = '';
    if (this.data.type === ProjectCardType.featured) {
      fileStoragePath = `portfolio/featured-projects/ID-${this.utility.getPaddedDigits(this.cardId, 2)}-Image.webp/`;
      databaseDocPath = `featured-project-section/project-${this.utility.getPaddedDigits(this.cardId, 2)}/`;
    } else {
      fileStoragePath = `portfolio/project-card-images/ID-${this.utility.getPaddedDigits(this.cardId, 2)}-Image.webp/`;
      databaseDocPath = `project-data-section/project-${this.utility.getPaddedDigits(this.cardId, 2)}/`;
    }

    // Handle file upload if a new file was selected (check if imageUrl is not empty/default)
    const chosenImage = this.imageUrl();
    const hasNewFile = chosenImage !== '' && chosenImage !== this.defaultImageSrc;
    if (hasNewFile) {
      this.handleFileUpload(fileStoragePath);
    }

    // Only update imageURL if a new photo was provided, otherwise keep existing
    const imageURL = hasNewFile
      ? chosenImage
      : this.projectCard()?.imageURL ?? this.defaultImageSrc;

    const updatedCard: IProjectCard = {
      ...this.projectCard()!,
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

    this.setDataService.pushFileToStorage(fileStoragePath, this.imageUrl()).catch(() => undefined);
    this.uploadProgressIntervalId = window.setInterval(() => {
      this.progressValue.set(this.setDataService.getProgressValue());
      this.isUploadCompleted.set(this.setDataService.getUploadCompleteState());
    }, 100);

    // Handle image URL retrieval with proper subscription management
    const newImageUrl = this.getDataService.getPhotoURL(fileStoragePath);
    this.imageUrlSubscription = newImageUrl.pipe(
      take(1),
    ).subscribe((result) => {
      if (result) {
        this.imageUrl.set(result);
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
          this.imagePreview.set(this.defaultImageSrc);
        }
        if (this.data.type === ProjectCardType.featured) {
          this.store.dispatch(StateActions.featuredProjectCardsStateConnect());
        } else {
          this.store.dispatch(StateActions.portfolioCardsStateConnect());
        }
        return result === 'successfull';
      }),
    );
  }
}
