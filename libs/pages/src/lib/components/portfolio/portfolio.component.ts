import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { Router } from '@angular/router';

import { GetDataService } from '@portfolio-v2/shared/services';
import { IProjectView } from '@portfolio-v2/interfaces';
import { ProjectCardComponent } from './components/project_card/project_card.component';

/**
 *
 */
@Component({
  selector: 'portfolio-v2-portfolio',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, ProjectCardComponent],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioComponent {
  /** Router */
  private router = inject(Router);

  /** Data service */
  private dataService = inject(GetDataService);

  /** Tooltip */
  public readonly toolTip: string = 'Click here to see more';

  /** Featured project data */
  public readonly featured: IProjectView = {
    imageURL: 'assets/images/project_icons/Trophy_Ico.png',
    viewHeading: 'Featured Projects',
    viewDescription: 'These are some of my most important projects',
  };

  /** Auditor project data */
  public readonly auditor: IProjectView = {
    imageURL: 'assets/images/project_icons/Auditor_Ico.png',
    viewHeading: 'Auditor Tool',
    viewDescription: 'A helper tool for automate a tuning process in QAM.',
  };

  /** Gameboy project data */
  public readonly gameboy: IProjectView = {
    imageURL: 'assets/images/project_icons/Gameboy_Ico.png',
    viewHeading: 'Retro GameBoy',
    viewDescription: 'Developed a gameboy system with classic game collections.',
  };

  /** Sorting project data */
  public readonly sorting: IProjectView = {
    imageURL: 'assets/images/project_icons/Sorting_Ico.png',
    viewHeading: 'Sorting Algorithm',
    viewDescription: 'Developed a collection of sorting algorithem and a visualizer.',
  };

  /** Portfolio project data */
  public readonly portfolio: IProjectView = {
    imageURL: 'assets/images/project_icons/Portfolio_Ico.png',
    viewHeading: 'My Portfolio',
    viewDescription: 'Developed a portfolio with my bio.',
  };

  /** Detective game project data */
  public readonly detective: IProjectView = {
    imageURL: 'assets/images/project_icons/Detective_Ico.png',
    viewHeading: 'Detective-Adventure',
    viewDescription: 'Developed a small 2D unity game.',
  };

  /** Inventory project data */
  public readonly inventory: IProjectView = {
    imageURL: 'assets/images/project_icons/Inventory_Ico.png',
    viewHeading: 'Inventory Control System',
    viewDescription: 'A small inventory control system.',
  };

  /** Exporter project data */
  public readonly exporter: IProjectView = {
    imageURL: 'assets/images/project_icons/Exporter_Ico.png',
    viewHeading: 'ETL to CSV Exporter',
    viewDescription: 'Windows performance analyzer',
  };

  /**
   * constructor
   * @param dialog dialog
   */
  constructor(public dialog: MatDialog) {}

  /**
   * Open dialog
   * @param selection selected record
   */
  public openDialog(selection: string): void {
    this.dataService.setSelectedRecord(selection);
    this.dialog.open(ProjectCardComponent);
  }

  /** Go to featured project page */
  public goToFeaturedPRojectsPage(): void {
    this.router.navigate(['featured-projects']);
  }
}
