import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';

import {
  AddRecordComponent,
  AdminDeleteDialogComponent,
  AdminRecordDialogComponent,
  openAdminDialog,
  UpdateDeleteButtonsComponent,
} from '@portfolio-v2/admin/shared/components';
import { IUpdateDeleteBtnConfigs } from '@portfolio-v2/admin/shared/types';
import {
  type EditTarget,
  Publication,
} from '@portfolio-v2/state/dataModels';
import {
  nextPublicationRecordIdSelector,
  publicationRecordsSelector,
} from '@portfolio-v2/state/selectors';
import { StateActions } from '@portfolio-v2/state';
import { PublicationFormComponent } from './components/publication-form/publication-form.component';
import {
  publicationWriteMessage,
  PublicationWriter,
} from './services/publication-writer.service';

/**
 * Admin list of publications.
 */
@Component({
  selector: 'admin-publications',
  standalone: true,
  imports: [
    AddRecordComponent,
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
   * Connect the store to the publication cards and their details.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.store.dispatch(StateActions.publicationCardsStateConnect());
    this.store.dispatch(StateActions.publicationDetailCardsStateConnect());
  }

  /**
   * Build the edit and delete actions for one publication.
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
    this.openRecordDialog('New publication', { mode: 'new', id: this.nextId() });
  }

  /**
   * Open a dialog for an existing publication.
   * @param publication record to edit
   */
  protected editPublication(publication: Publication): void {
    this.openRecordDialog('Edit publication', { mode: 'edit', publication });
  }

  /**
   * Open the confirmation dialog. The dialog removes the publication after confirmation.
   * @param publication record to remove
   */
  protected deletePublication(publication: Publication): void {
    openAdminDialog(this.dialog, this.viewContainerRef, AdminDeleteDialogComponent, {
      title: 'Delete publication',
      lines: [publication.title],
      record: publication,
      writer: PublicationWriter,
      writeMessage: publicationWriteMessage,
    }, '800px');
  }

  /**
   * Open the shared record dialog for a new or existing publication.
   * @param heading dialog title
   * @param target record the form loads
   */
  private openRecordDialog(heading: string, target: EditTarget): void {
    openAdminDialog(this.dialog, this.viewContainerRef, AdminRecordDialogComponent, {
      heading,
      target,
      form: PublicationFormComponent,
      writer: PublicationWriter,
      writeMessage: publicationWriteMessage,
    }, '800px');
  }
}
