import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';

import {
  publicationDetailCardSelector,
  selectedPublicationIDSelector,
} from '@portfolio-v2/state/selectors';

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
  /** Selected publication ID */
  private readonly publicationId = this.store.selectSignal(selectedPublicationIDSelector);

  /** Selected publication card details */
  protected readonly pubDetail = this.store.selectSignal(
    publicationDetailCardSelector(this.publicationId()),
  );

  /**
   * constructor
   * @param store ngrx store
   */
  constructor(private store: Store) {}
}
