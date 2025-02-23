import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';

import { IPublicationDetails } from '@portfolio-v2/interfaces';
import { GetDataService } from '@portfolio-v2/shared/services';

/**
 * Publication Details Mat Dialog
 */
@Component({
  selector: 'portfolio-v2-publication-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ClipboardModule,
    MatIconModule,
  ],
  templateUrl: './publication_detail.component.html',
  styleUrl: './publication_detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicationDetailComponent {
  /** Publication details */
  public readonly pubDetail$: Observable<IPublicationDetails | undefined>;

  /**
   * constructor
   * @param dataService data service
   */
  constructor(private dataService: GetDataService) {
    this.pubDetail$ = this.dataService.publicationDetailCard;
  }
}
