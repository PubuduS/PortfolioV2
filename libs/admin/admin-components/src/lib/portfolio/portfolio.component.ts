import {
  ChangeDetectionStrategy,
  Component,
  ViewContainerRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

import { StateActions } from '@portfolio-v2/state';
import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';
import { IProjectView } from '@portfolio-v2/state/dataModels';
import {
  openAdminDialog,
  UpdateDeleteButtonsComponent,
  ProjectCardType,
} from '@portfolio-v2/admin/shared/components';
import { ProjectTileComponent } from '@portfolio-v2/portfolio-pages/project-tile';
import { AddPortfolioRecordComponent } from './add-portfolio-record/add-portfolio-record.component';
import {
  AddTileComponent,
  TileEditorNext,
} from './add-tile/add-tile.component';
import { ProjectCardsComponent } from './components/project-cards/project-cards.component';
import { DescriptionCardComponent } from './components/description-card/description-card.component';
import { DeletePortfolioTileComponent } from './components/delete-portfolio-tile/delete-portfolio-tile.component';

/**
 * Portfolio Section
 */
@Component({
  selector: 'admin-portfolio',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    UpdateDeleteButtonsComponent,
    ProjectTileComponent,
  ],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioComponent {
  /** Tooltip */
  protected readonly toolTip: string = 'Click here to see more';

  /** Observable of project data such as icons, headings and descriptions */
  protected readonly projectView = this.store.selectSignal(portfolioCardsSelector);

  /**
   * constructor
   * @param router router
   * @param store ngrx store
   * @param dialog dialog
   * @param viewContainerRef view that can see the route writer
   */
  constructor(
    private router: Router,
    private store: Store,
    public dialog: MatDialog,
    private viewContainerRef: ViewContainerRef,
  ) {
    this.store.dispatch(StateActions.portfolioCardsStateConnect());
  }

  /**
   * Add new record
   */
  protected addNewRecord(): void {
    openAdminDialog<AddTileComponent, undefined, TileEditorNext>(
      this.dialog,
      this.viewContainerRef,
      AddTileComponent,
      undefined,
      '600px',
    ).afterClosed().pipe(take(1)).subscribe((next) => {
      if (next === undefined || next === null) {
        return;
      }
      this.openCardEditor(next);
    });
  }

  /**
   * Open the card editor after the tile dialog has closed.
   * @param next tile that Next handed back
   */
  private openCardEditor(next: TileEditorNext): void {
    openAdminDialog(
      this.dialog,
      this.viewContainerRef,
      AddPortfolioRecordComponent,
      next,
      '800px',
    );
  }

  /**
   * Open dialog
   * @param id record id
   */
  protected openDialog(id: number): void {
    openAdminDialog(
      this.dialog,
      this.viewContainerRef,
      ProjectCardsComponent,
      { cardId: id, type: ProjectCardType.standard },
      '800px',
    );
  }

  /**
   * Get delete click handler for a project
   * @param projectId project id
   * @returns click handler function
   */
  protected getDeleteClickHandler(projectId: number): () => void {
    return () => this.openDeleteDialog(projectId);
  }

  /**
   * Get edit click handler for a project
   * @param project project view
   * @returns click handler function
   */
  protected getEditClickHandler(project: IProjectView): () => void {
    return () => this.openDialogDescription(project);
  }

  /** Go to featured project page */
  protected goToFeaturedPRojectsPage(): void {
    this.router.navigate(['/admin/portfolio/featured-projects']);
  }

  /**
   * Open dialog description
   * @param project project view
   */
  private openDialogDescription(project: IProjectView): void {
    openAdminDialog(
      this.dialog,
      this.viewContainerRef,
      DescriptionCardComponent,
      { project },
      '600px',
    );
  }

  /**
   * Open delete dialog
   * @param projectId project id
   */
  private openDeleteDialog(projectId: number): void {
    openAdminDialog(
      this.dialog,
      this.viewContainerRef,
      DeletePortfolioTileComponent,
      { recordId: projectId, type: ProjectCardType.standard },
      '800px',
    );
  }
}
