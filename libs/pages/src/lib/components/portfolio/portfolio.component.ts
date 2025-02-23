import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { GetDataService } from '@portfolio-v2/shared/services';
import { IProjectView } from '@portfolio-v2/interfaces';
import { ProjectCardComponent } from './components/project_card/project_card.component';

/**
 * Portfolio Section
 */
@Component({
  selector: 'portfolio-v2-portfolio',
  standalone: true,
  imports: [
    CommonModule,
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
  protected readonly projectView$: Observable<IProjectView[]>;

  /**
   * constructor
   * @param router router
   * @param dataService data service
   * @param dialog dialog
   */
  constructor(
    private router: Router,
    private dataService: GetDataService,
    public dialog: MatDialog,
  ) {
    this.projectView$ = this.dataService.getDataArray<IProjectView>('project-icon-section');
  }

  /**
   * Open dialog
   * @param id record id
   */
  protected openDialog(id: number): void {
    this.dataService.getProjectCardById('project-data-section', id);
    this.dialog.open(ProjectCardComponent, { autoFocus: 'first-tabbable', restoreFocus: true });
  }

  /** Go to featured project page */
  protected goToFeaturedPRojectsPage(): void {
    this.router.navigate(['/content/portfolio/featured-projects']);
  }
}
