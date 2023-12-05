import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProjectView } from 'libs/interfaces/project_display/IProjectCard';

@Component({
  selector: 'portfolio-v2-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
})
export class PortfolioComponent {

  readonly toolTip: string = 'Click here to see more';

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

}
