import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';

import { publicationCardsSelector } from '@portfolio-v2/state/selectors';
import { StateActions } from '@portfolio-v2/state';
import { PublicationDetailComponent } from '../publication_detail/publication_detail.component';

/**
 * Publications Component
 */
@Component({
  selector: 'portfolio-v2-publications',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
  ],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicationsComponent {
  /** Observable of IPublication array */
  protected readonly publicationList = this.store.selectSignal(publicationCardsSelector);

  /**
   * constructor
   * @param dialog mat dialog
   * @param store ngrx store
   */
  constructor(
    private dialog: MatDialog,
    private store: Store,
  ) {}

  /**
   * Open a dialog
   * @param id ID
   */
  public openDialog(id: number): void {
    this.store.dispatch(StateActions.selectedPublicationCardIDStateUpdated(
      { selectedPublicationID: id },
    ));
    this.dialog.open(PublicationDetailComponent, { autoFocus: 'first-tabbable', restoreFocus: true });
  }
}
