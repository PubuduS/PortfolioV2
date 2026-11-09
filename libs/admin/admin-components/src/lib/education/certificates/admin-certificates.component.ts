import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
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
import { StateActions } from '@portfolio-v2/state';
import {
  type CertificateEditTarget,
  ICertificateCard,
} from '@portfolio-v2/state/dataModels';
import {
  certificatesSelector,
  nextCertificateIdSelector,
} from '@portfolio-v2/state/selectors';
import { CertificateFormComponent } from './components/certificate-form/certificate-form.component';
import {
  certificateWriteMessage,
  CertificateWriter,
} from './services/certificate-writer.service';

/**
 * Admin list of certificates.
 */
@Component({
  selector: 'admin-certificates',
  standalone: true,
  imports: [
    AddRecordComponent,
    UpdateDeleteButtonsComponent,
  ],
  templateUrl: './admin-certificates.component.html',
  styleUrl: './admin-certificates.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCertificatesComponent implements OnInit {
  /** Icon on every card, the same one the public page uses. */
  protected readonly certificateIconUrl = 'assets/images/certificate-icon/certificate.png';

  /** Application store. */
  private readonly store = inject(Store);

  /** Opens the add, edit and delete dialogs. */
  private readonly dialog = inject(MatDialog);

  /** View container the dialogs attach to, so they see this route's writer. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /** Stored certificates, newest first. */
  protected readonly certificates = this.store.selectSignal(certificatesSelector);

  /** Id a new certificate would get. */
  private readonly nextId = this.store.selectSignal(nextCertificateIdSelector);

  /**
   * Connect the store to the certificate collection.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.store.dispatch(StateActions.certificatesCardsStateConnect());
  }

  /**
   * Open a dialog for the next certificate id.
   */
  protected addCertificate(): void {
    this.openRecordDialog('New certificate', { mode: 'new', id: this.nextId() });
  }

  /**
   * Build the edit and delete actions for one certificate.
   * @param certificate record the buttons belong to
   * @returns button configuration
   */
  protected buttonConfig(certificate: ICertificateCard): IUpdateDeleteBtnConfigs {
    return {
      isVerticalLayout: false,
      deleteButtonDisabled: false,
      editButtonDisabled: false,
      deleteButtonClick: () => this.deleteCertificate(certificate),
      editButtonClick: () => this.editCertificate(certificate),
    };
  }

  /**
   * Open the confirmation dialog. The dialog removes the certificate after confirmation.
   * @param certificate record to remove
   */
  protected deleteCertificate(certificate: ICertificateCard): void {
    openAdminDialog(this.dialog, this.viewContainerRef, AdminDeleteDialogComponent, {
      title: 'Delete certificate',
      lines: [certificate.title],
      record: certificate,
      writer: CertificateWriter,
      writeMessage: certificateWriteMessage,
    }, '800px');
  }

  /**
   * Open a dialog for an existing certificate.
   * @param certificate record to edit
   */
  protected editCertificate(certificate: ICertificateCard): void {
    this.openRecordDialog('Edit certificate', { mode: 'edit', certificate });
  }

  /**
   * Open the shared record dialog for a new or existing certificate.
   * @param heading dialog title
   * @param target record the form loads
   */
  private openRecordDialog(heading: string, target: CertificateEditTarget): void {
    openAdminDialog(this.dialog, this.viewContainerRef, AdminRecordDialogComponent, {
      heading,
      target,
      form: CertificateFormComponent,
      writer: CertificateWriter,
      writeMessage: certificateWriteMessage,
    }, '800px');
  }
}
