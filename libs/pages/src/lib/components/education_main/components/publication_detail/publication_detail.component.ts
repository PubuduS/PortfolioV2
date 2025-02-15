import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatIconModule } from '@angular/material/icon';

import { IPublicationDetails } from '@portfolio-v2/interfaces';
import { GetDataService } from '@portfolio-v2/shared/services';

/**
 *
 */
@Component({
  selector: 'portfolio-v2-publication-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ClipboardModule, MatIconModule],
  templateUrl: './publication_detail.component.html',
  styleUrl: './publication_detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicationDetailComponent {
  private dataService = inject(GetDataService);
  public readonly pubDetail: IPublicationDetails
    = this.dataService.getPublicationDetail(this.dataService.getSelectedRecord());
}
