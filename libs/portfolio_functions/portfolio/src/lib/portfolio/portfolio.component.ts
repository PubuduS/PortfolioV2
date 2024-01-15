import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProjectView } from '@portfolio-v2/interfaces';
import { MatButtonModule } from '@angular/material/button';
import { ProjectCardComponent } from '@portfolio-v2/project_card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GetdataService } from '@portfolio-v2/services';
import { Router } from '@angular/router';

@Component({
  selector: 'portfolio-v2-portfolio',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, ProjectCardComponent],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
})
export class PortfolioComponent {

  private router = inject(Router);
  private dataService  = inject(GetdataService);

  readonly toolTip: string = 'Click here to see more';

  readonly featured: IProjectView = {
    imageURL: 'assets/images/project_icons/Trophy_Ico.png',
    viewHeading: 'Featured Projects',
    viewDescription: 'These are some of my most important projects',
  }

  readonly auditor: IProjectView = {
    imageURL: 'assets/images/project_icons/Auditor_Ico.png',
    viewHeading: 'Auditor Tool',
    viewDescription: 'A helper tool for automate a tuning process in QAM.',
  }

  readonly gameboy: IProjectView = {
    imageURL: 'assets/images/project_icons/Gameboy_Ico.png',
    viewHeading: 'Retro GameBoy',
    viewDescription: 'Developed a gameboy system with classic game collections.',
  }

  readonly sorting: IProjectView = {
    imageURL: 'assets/images/project_icons/Sorting_Ico.png',
    viewHeading: 'Sorting Algorithm',
    viewDescription: 'Developed a collection of sorting algorithem and a visualizer.',
  }

  readonly portfolio: IProjectView = {
    imageURL: 'assets/images/project_icons/Portfolio_Ico.png',
    viewHeading: 'My Portfolio',
    viewDescription: 'Developed a portfolio with my bio.',
  }

  readonly detective: IProjectView = {
    imageURL: 'assets/images/project_icons/Detective_Ico.png',
    viewHeading: 'Detective-Adventure',
    viewDescription: 'Developed a small 2D unity game.',
  }

  readonly inventory: IProjectView = {
    imageURL: 'assets/images/project_icons/Inventory_Ico.png',
    viewHeading: 'Inventory Control System',
    viewDescription: 'A small inventory control system.',
  }

  readonly exporter: IProjectView = {
    imageURL: 'assets/images/project_icons/Exporter_Ico.png',
    viewHeading: 'ETL to CSV Exporter',
    viewDescription: 'Windows performance analyzer',
  }

  constructor(public dialog: MatDialog) {}
  
  public openDialog(selection: string) {
    this.dataService.setSelectedRecord(selection);
    this.dialog.open(ProjectCardComponent);
  }

  public goToFeaturedPRojectsPage(): void {
    this.router.navigate(['featured-projects']);
  }

}
