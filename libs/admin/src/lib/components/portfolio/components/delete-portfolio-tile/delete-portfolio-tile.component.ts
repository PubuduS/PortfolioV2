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
  take,
  of,
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
  /** Returns true if the tile delete is successful */
  protected isTileDeleteSuccess = of(false);

  /** Returns true if the card delete is successful */
  protected isCardDeleteSuccess = of(false);

  /** Selected project card */
  protected readonly projectCard = this.store.selectSignal(
    projectCardSelector(this.data.project.id),
  );

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
   * Delete the tile
   */
  protected deleteTile(): void {
    if (!this.data.project.id) {
      return;
    }

    // Delete from database
    this.isTileDeleteSuccess = this.setDataService.deleteRecord(`project-icon-section/project-${this.utility.getPaddedDigits(this.data.project.id, 2)}/`).pipe(
      take(1),
      map((result) => {
        if (result === 'successfull') {
          // Update the store with the new array (without the deleted item)
          this.store.dispatch(StateActions.portfolioCardsStateConnect());
          return true;
        }
        return false;
      }),
    );

    this.isCardDeleteSuccess = this.setDataService.deleteRecord(`project-data-section/project-${this.utility.getPaddedDigits(this.data.project.id, 2)}/`).pipe(
      take(1),
      map((result) => {
        if (result === 'successfull') {
          return true;
        }
        return false;
      }),
    );
  }
}
