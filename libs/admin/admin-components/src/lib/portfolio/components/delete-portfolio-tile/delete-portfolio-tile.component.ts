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
import { CommonModule } from '@angular/common';

import { StateActions } from '@portfolio-v2/state';
import {
  portfolioCardSelector,
  projectCardSelector,
  featuredProjectCardSelector,
} from '@portfolio-v2/state/selectors';
import { ProjectCardType } from '@portfolio-v2/admin/shared/components';
import {
  IProjectCard,
  IProjectView,
} from '@portfolio-v2/state/dataModels';
import { PortfolioWriter } from '../../services/portfolio-writer.service';

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
   * @param writer portfolio writes
   * @param store ngrx store
   */
  constructor(
    public dialogRef: MatDialogRef<DeletePortfolioTileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { recordId: number, type: ProjectCardType },
    private writer: PortfolioWriter,
    private store: Store,
  ) {
    // Select the appropriate card based on type
    if (this.data.type === ProjectCardType.featured) {
      this.projectCard = this.store.selectSignal(featuredProjectCardSelector(this.data.recordId));
      this.portfolioCard = undefined;
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

    this.writer.removeStandardProject(this.data.recordId).then(() => {
      this.isOverallSuccess = true;
      this.store.dispatch(StateActions.portfolioCardsStateConnect());
      this.dialogRef.close();
    }).catch(() => {
      this.isOverallSuccess = false;
    });
  }

  /**
   * Delete the tile and all associated data
   */
  protected deleteFeaturedProject(): void {
    if (!this.data.recordId) {
      return;
    }

    this.writer.removeFeaturedProject(this.data.recordId).then(() => {
      this.isOverallSuccess = true;
      this.store.dispatch(StateActions.featuredProjectCardsStateConnect());
      this.dialogRef.close();
    }).catch(() => {
      this.isOverallSuccess = false;
    });
  }
}
