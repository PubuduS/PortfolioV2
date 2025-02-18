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
 *
 */
@Component({
  selector: 'portfolio-v2-portfolio',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
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
    this.projectView$ = this.dataService.getProjectView('project-icon-section');
  }

  /**
   * Open dialog
   * @param selection selected record
   */
  protected openDialog(selection: string): void {
    this.dataService.setSelectedRecord(selection);
    this.dialog.open(ProjectCardComponent);
  }

  /** Go to featured project page */
  protected goToFeaturedPRojectsPage(): void {
    this.router.navigate(['/content/portfolio/featured-projects']);
  }
}
