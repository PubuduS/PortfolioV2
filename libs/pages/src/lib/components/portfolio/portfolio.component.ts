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

import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';
import { StateActions } from '@portfolio-v2/state';
import { ProjectCardComponent } from './components/project_card/project_card.component';

/**
 * Portfolio Section
 */
@Component({
  selector: 'portfolio-v2-portfolio',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
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
   * Open dialog
   * @param id record id
   */
  protected openDialog(id: number): void {
    this.store.dispatch(StateActions.projectCardIDStateUpdated({ selectedProjectCardID: id }));
    this.dialog.open(ProjectCardComponent, { autoFocus: 'first-tabbable', restoreFocus: true });
  }

  /** Go to featured project page */
  protected goToFeaturedPRojectsPage(): void {
    this.router.navigate(['/content/portfolio/featured-projects']);
  }
}
