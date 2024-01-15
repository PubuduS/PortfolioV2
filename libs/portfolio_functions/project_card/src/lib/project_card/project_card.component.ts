import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon';
import { GetdataService } from '@portfolio-v2/services';
import { IProjectCard } from '@portfolio-v2/interfaces';

@Component({
  selector: 'portfolio-v2-project-card',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule ],
  templateUrl: './project_card.component.html',
  styleUrl: './project_card.component.css',
})
export class ProjectCardComponent {
  private dataService = inject(GetdataService);

  public readonly dataRecord: IProjectCard = this.dataService.getPortfolioData(this.dataService.getSelectedRecord());
}
