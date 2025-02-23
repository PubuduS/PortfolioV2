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
import { Observable } from 'rxjs';

import { IPublication } from '@portfolio-v2/interfaces';
import { GetDataService } from '@portfolio-v2/shared/services';
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
  protected readonly publicationList$: Observable<IPublication[]>;

  /**
   * constructor
   * @param dataService data service
   * @param dialog mat dialog
   */
  constructor(
    private dataService: GetDataService,
    private dialog: MatDialog,
  ) {
    this.publicationList$ = this.dataService.getPublications('publication-section');
  }

  /**
   * Open a dialog
   * @param id ID
   */
  public openDialog(id: number): void {
    this.dataService.getPublicationDetailsCardById('publication-details-section', id);
    this.dialog.open(PublicationDetailComponent, { autoFocus: 'first-tabbable', restoreFocus: true });
  }
}
