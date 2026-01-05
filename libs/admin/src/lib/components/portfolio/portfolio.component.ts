import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatIconModule } from '@angular/material/icon';

import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';
import { StateActions } from '@portfolio-v2/state';
import { IProjectView } from '@portfolio-v2/state/dataModels';
import { ProjectCardsComponent } from './components/project-cards/project-cards.component';
import { DescriptionCardComponent } from './components/description-card/description-card.component';
import { DeletePortfolioTileComponent } from './components/delete-portfolio-tile/delete-portfolio-tile.component';
import { AddTileComponent } from '../shared/add-tile/add-tile.component';
import { UpdateDeleteButtonsComponent } from '../shared/update-delete-buttons/update-delete-buttons.component';

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
   */
  constructor(
    private router: Router,
    private store: Store,
    public dialog: MatDialog,
  ) {}

  /**
   * Add new record
   */
  protected addNewRecord(): void {
    this.dialog.open(AddTileComponent, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      width: '600px',
    });
  }

  /**
   * Open dialog
   * @param id record id
   */
  protected openDialog(id: number): void {
    this.store.dispatch(StateActions.projectCardIDStateUpdated({ selectedProjectCardID: id }));
    this.dialog.open(ProjectCardsComponent, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      width: '800px',
    });
  }

  /**
   * Get delete click handler for a project
   * @param project project view
   * @returns click handler function
   */
  protected getDeleteClickHandler(project: IProjectView): () => void {
    return () => this.openDeleteDialog(project);
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
    this.router.navigate(['/content/portfolio/featured-projects']);
  }

  /**
   * Open dialog description
   * @param project project view
   */
  private openDialogDescription(project: IProjectView): void {
    this.dialog.open(
      DescriptionCardComponent,
      {
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        width: '600px',
        data: { project },
      },
    );
  }

  /**
   * Open delete dialog
   * @param project project view
   */
  private openDeleteDialog(project: IProjectView): void {
    this.dialog.open(
      DeletePortfolioTileComponent,
      {
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        width: '800px',
        data: { project },
      },
    );
  }
}
