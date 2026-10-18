import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';

import { UpdateDeleteButtonsComponent } from '@portfolio-v2/admin/shared/components';
import { IUpdateDeleteBtnConfigs } from '@portfolio-v2/admin/shared/types';
import { Publication } from '@portfolio-v2/state/dataModels';
import {
  nextPublicationRecordIdSelector,
  publicationRecordsSelector,
} from '@portfolio-v2/state/selectors';
import { StateActions } from '@portfolio-v2/state';
import { DeletePublicationDialogComponent } from './components/delete-publication-dialog/delete-publication-dialog.component';
import { PublicationDialogComponent } from './components/publication-dialog/publication-dialog.component';

/**
 * Admin list of publications.
 */
@Component({
  selector: 'admin-publications',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    UpdateDeleteButtonsComponent,
  ],
  templateUrl: './admin-publications.component.html',
  styleUrl: './admin-publications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPublicationsComponent implements OnInit {
  /** Application store. */
  private readonly store = inject(Store);

  /** Opens the add, edit and delete dialogs. */
  private readonly dialog = inject(MatDialog);

  /** View container the dialogs attach to, so they see this route's writer. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /** Joined publications. */
  protected readonly publications = this.store.selectSignal(publicationRecordsSelector);

  /** Id a new publication would get. */
  private readonly nextId = this.store.selectSignal(nextPublicationRecordIdSelector);

  /**
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.store.dispatch(StateActions.publicationCardsStateConnect());
    this.store.dispatch(StateActions.publicationDetailCardsStateConnect());
  }

  /**
   * @param publication record the buttons belong to
   * @returns button configuration
   */
  protected buttonConfig(publication: Publication): IUpdateDeleteBtnConfigs {
    return {
      isVerticalLayout: false,
      deleteButtonDisabled: false,
      editButtonDisabled: false,
      deleteButtonClick: () => this.deletePublication(publication),
      editButtonClick: () => this.editPublication(publication),
    };
  }

  /**
   * Open a dialog for the next publication id.
   */
  protected addPublication(): void {
    this.openDialog(PublicationDialogComponent, { mode: 'new', id: this.nextId() });
  }

  /**
   * Open a dialog for an existing publication.
   * @param publication record to edit
   */
  protected editPublication(publication: Publication): void {
    this.openDialog(PublicationDialogComponent, { mode: 'edit', publication });
  }

  /**
   * Open the confirmation dialog. The dialog removes the publication after confirmation.
   * @param publication record to remove
   */
  protected deletePublication(publication: Publication): void {
    this.openDialog(DeletePublicationDialogComponent, publication);
  }

  /**
   * Open a dialog in this page's injector so it can see the route writer.
   * @param component dialog type
   * @param data record or editor target
   */
  private openDialog<T, D>(component: Type<T>, data: D): void {
    this.dialog.open(component, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      width: '800px',
      viewContainerRef: this.viewContainerRef,
      data,
    });
  }
}
