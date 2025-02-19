import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogActions,
  MatDialogContent,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { GetDataService } from '@portfolio-v2/shared/services';

/**
 * Project Card
 */
@Component({
  selector: 'portfolio-v2-project-card',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './project_card.component.html',
  styleUrl: './project_card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  /** Data Service */
  private dataService = inject(GetDataService);

  /** Data record */
  public readonly data = this.dataService.projectCard;
}
