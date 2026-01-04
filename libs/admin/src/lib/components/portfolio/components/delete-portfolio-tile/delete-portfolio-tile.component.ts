import {
  ChangeDetectionStrategy,
  Component,
  Inject,
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
import { IProjectView } from '@portfolio-v2/state/dataModels';
import { projectCardSelector } from '@portfolio-v2/state/selectors';
import {
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';

/**
 * Delete Portfolio Tile Component
 */
@Component({
  selector: 'admin-delete-portfolio-tile',
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
  protected readonly projectCard = this.store.selectSignal(
    projectCardSelector(this.data.project.id),
  );

  /** Returns true if the tile delete is successful */
  protected isOverallSuccess = false;

  /**
   * constructor
   * @param dialogRef Dialog ref
   * @param data data
   * @param data.project project to delete
   * @param setDataService Set Data service
   * @param store ngrx store
   * @param utility Utility service
   */
  constructor(
    public dialogRef: MatDialogRef<DeletePortfolioTileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project: IProjectView },
    private setDataService: SetDataService,
    private store: Store,
    private utility: UtilityService,
  ) {}

  /**
   * Delete the tile and all associated data
   */
  protected deleteTile(): void {
    if (!this.data.project.id) {
      return;
    }

    const projectId = this.data.project.id;
    const paddedId = this.utility.getPaddedDigits(projectId, 2);

    // Combine all delete operations into one
    const deleteOperations = [
      // Delete icon file from storage (optional - don't fail if doesn't exist)
      this.setDataService.deleteFileFromStorage(`portfolio/portfolio-tiles/ID-${paddedId}-Icon.webp`).pipe(
        map((result) => result === 'successfull'),
        // Treat storage delete as optional (return true even if file doesn't exist)
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
      next: ([storageSuccess, iconSuccess, cardSuccess]) => {
        // Only consider successful if both database operations succeed
        // Storage delete is optional (may not exist)
        this.isOverallSuccess = iconSuccess && cardSuccess && storageSuccess;

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
}
