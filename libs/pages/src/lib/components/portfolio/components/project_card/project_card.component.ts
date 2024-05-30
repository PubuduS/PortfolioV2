import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon';
import { GetDataService } from '@portfolio-v2/services';
import { IProjectCard } from '@portfolio-v2/interfaces';

/**
 * Project Card
 */
@Component({
  selector: 'portfolio-v2-project-card',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule ],
  templateUrl: './project_card.component.html',
  styleUrl: './project_card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  /** Data Service */
  private dataService = inject(GetDataService);

  /** Data record */
  public readonly dataRecord: IProjectCard = this.dataService.getPortfolioData(this.dataService.getSelectedRecord());
}
