import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';

import { UpdateDeleteButtonsComponent } from '@portfolio-v2/admin/shared/components';
import { IUpdateDeleteBtnConfigs } from '@portfolio-v2/admin/shared/types';
import { StateActions } from '@portfolio-v2/state';
import { ICertificateCard } from '@portfolio-v2/state/dataModels';
import {
  certificatesSelector,
  nextCertificateIdSelector,
} from '@portfolio-v2/state/selectors';
import { CertificateDialogComponent } from './components/certificate-dialog/certificate-dialog.component';
import { DeleteCertificateDialogComponent } from './components/delete-certificate-dialog/delete-certificate-dialog.component';

/**
 * Admin list of certificates.
 */
@Component({
  selector: 'admin-certificates',
  standalone: true,
  imports: [
    MatButtonModule,
    UpdateDeleteButtonsComponent,
  ],
  templateUrl: './admin-certificates.component.html',
  styleUrl: './admin-certificates.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCertificatesComponent implements OnInit {
  /** Icon on every card, the same one the public page uses. */
  protected readonly certificateIconUrl = 'assets/images/certificate_Icon/certificate.png';

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
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.store.dispatch(StateActions.certificatesCardsStateConnect());
  }

  /**
   * Open a dialog for the next certificate id.
   */
  protected addCertificate(): void {
    this.openDialog(CertificateDialogComponent, { mode: 'new', id: this.nextId() });
  }

  /**
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
    this.openDialog(DeleteCertificateDialogComponent, certificate);
  }

  /**
   * Open a dialog for an existing certificate.
   * @param certificate record to edit
   */
  protected editCertificate(certificate: ICertificateCard): void {
    this.openDialog(CertificateDialogComponent, { mode: 'edit', certificate });
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
