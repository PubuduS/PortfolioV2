import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Signal,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import {
  map,
  of,
  forkJoin,
  catchError,
} from 'rxjs';
import { CommonModule } from '@angular/common';

import { StateActions } from '@portfolio-v2/state';
import {
  portfolioCardSelector,
  projectCardSelector,
  featuredProjectCardSelector,
} from '@portfolio-v2/state/selectors';
import {
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { ProjectCardType } from '@portfolio-v2/admin/shared/components';
import {
  IProjectCard,
  IProjectView,
} from '@portfolio-v2/state/dataModels';

/**
 * Delete Portfolio Tile Component
 */
@Component({
  selector: 'admin-delete-portfolio-tile',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './delete-portfolio-tile.component.html',
  styleUrl: './delete-portfolio-tile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeletePortfolioTileComponent {
  /** Selected project card */
  protected readonly projectCard: Signal<IProjectCard | undefined>;

  /** Selected portfolio card (not used for featured projects) */
  protected readonly portfolioCard: Signal<IProjectView | undefined> | undefined;

  /** Returns true if the tile delete is successful */
  protected isOverallSuccess = false;

  /**
   * constructor
   * @param dialogRef Dialog ref
   * @param data data
   * @param data.recordId project id to delete
   * @param data.type project card type
   * @param setDataService Set Data service
   * @param store ngrx store
   * @param utility Utility service
   */
  constructor(
    public dialogRef: MatDialogRef<DeletePortfolioTileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { recordId: number, type: ProjectCardType },
    private setDataService: SetDataService,
    private store: Store,
    private utility: UtilityService,
  ) {
    // Select the appropriate card based on type
    if (this.data.type === ProjectCardType.featured) {
      this.projectCard = this.store.selectSignal(featuredProjectCardSelector(this.data.recordId));
      this.portfolioCard = undefined as any; // Not used for featured projects
    } else {
      this.projectCard = this.store.selectSignal(projectCardSelector(this.data.recordId));
      this.portfolioCard = this.store.selectSignal(portfolioCardSelector(this.data.recordId));
    }
  }

  /**
   * Delete the tile and all associated data
   */
  protected deleteTile(): void {
    if (!this.data.recordId) {
      return;
    }

    const projectId = this.data.recordId;
    const paddedId = this.utility.getPaddedDigits(projectId, 2);

    // Combine all delete operations into one
    const deleteOperations = [
      // Delete icon file from storage (optional - don't fail if doesn't exist)
      this.setDataService.deleteFileFromStorage(`portfolio/portfolio-tiles/ID-${paddedId}-Icon.webp`).pipe(
        map((result) => result === 'successfull'),
        // Treat storage delete as optional (return true even if file doesn't exist)
        catchError(() => of(true)),
      ),

      this.setDataService.deleteFileFromStorage(`portfolio/project-screenshots/normal/ID-${paddedId}-Screenshot.webp`).pipe(
        map((result) => result === 'successfull'),
        // Treat screenshot delete as optional (return true even if file doesn't exist)
        catchError(() => of(true)),
      ),

      // Delete icon metadata from database
      this.setDataService.deleteRecord(`project-icon-section/project-${paddedId}/`).pipe(
        map((result) => result === 'successfull'),
      ),

      // Delete project data from database
      this.setDataService.deleteRecord(`project-data-section/project-${paddedId}/`).pipe(
        map((result) => result === 'successfull'),
      ),
    ];

    // Execute all delete operations in parallel and wait for all to complete
    forkJoin(deleteOperations).subscribe({
      next: ([storageSuccess, screenshotSuccess, iconSuccess, cardSuccess]) => {
        // Only consider successful if both database operations succeed
        // Storage delete is optional (may not exist)
        this.isOverallSuccess = iconSuccess && screenshotSuccess && cardSuccess && storageSuccess;

        if (this.isOverallSuccess) {
          // Update the store to reflect the deletion
          this.store.dispatch(StateActions.portfolioCardsStateConnect());
          this.dialogRef.close();
        }
      },
      error: (_error) => {
        this.dialogRef.close(false);
      },
    });
  }

  /**
   * Delete the tile and all associated data
   */
  protected deleteFeaturedProject(): void {
    if (!this.data.recordId) {
      return;
    }

    const projectId = this.data.recordId;
    const paddedId = this.utility.getPaddedDigits(projectId, 2);

    // Combine all delete operations into one
    const deleteOperations = [
      this.setDataService.deleteFileFromStorage(`portfolio/project-screenshots/featured/ID-${paddedId}-Screenshot.webp`).pipe(
        map((result) => result === 'successfull'),
        // Treat screenshot delete as optional (return true even if file doesn't exist)
        catchError(() => of(true)),
      ),

      this.setDataService.deleteFileFromStorage(`portfolio/featured-projects/ID-${paddedId}-Image.webp`).pipe(
        map((result) => result === 'successfull'),
        // Treat screenshot delete as optional (return true even if file doesn't exist)
        catchError(() => of(true)),
      ),

      // Delete project data from database
      this.setDataService.deleteRecord(`featured-project-section/project-${paddedId}/`).pipe(
        map((result) => result === 'successfull'),
      ),
    ];

    // Execute all delete operations in parallel and wait for all to complete
    forkJoin(deleteOperations).subscribe({
      next: ([screenshotSuccess, cardSuccess]) => {
        // Only consider successful if both database operations succeed
        // Storage delete is optional (may not exist)
        this.isOverallSuccess = screenshotSuccess && cardSuccess;

        if (this.isOverallSuccess) {
          // Update the store to reflect the deletion
          this.store.dispatch(StateActions.featuredProjectCardsStateConnect());
          this.dialogRef.close();
        }
      },
      error: (_error) => {
        this.dialogRef.close(false);
      },
    });
  }
}
