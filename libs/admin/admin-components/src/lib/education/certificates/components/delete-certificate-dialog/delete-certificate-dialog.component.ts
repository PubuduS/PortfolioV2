import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { ICertificateCard } from '@portfolio-v2/state/dataModels';
import {
  certificateWriteMessage,
  CertificateWriter,
} from '../../services/certificate-writer.service';

/** Idle, a delete in flight, or the last write error. */
type DeleteStatus =
  | { readonly kind: 'idle' }
  | { readonly kind: 'deleting' }
  | { readonly kind: 'error'; readonly message: string };

/**
 * Confirm before a certificate is removed.
 * The page opens this with its view container so the route-provided writer can be injected.
 */
@Component({
  selector: 'admin-delete-certificate-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogModule,
  ],
  templateUrl: './delete-certificate-dialog.component.html',
  styleUrl: './delete-certificate-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteCertificateDialogComponent {
  /** Record the owner is about to remove. */
  protected readonly certificate = inject<ICertificateCard>(MAT_DIALOG_DATA);

  /** Idle, deleting, or the last write error. */
  protected readonly status = signal<DeleteStatus>({ kind: 'idle' });

  /** Message from the last failed delete, or null. */
  protected readonly errorMessage = computed(() => {
    const current = this.status();
    return current.kind === 'error' ? current.message : null;
  });

  private readonly dialogRef = inject<MatDialogRef<DeleteCertificateDialogComponent, boolean>>(
    MatDialogRef,
  );

  /** The writer to use for the delete. */
  private readonly writer = inject(CertificateWriter);

  /**
   * Remove the certificate and close, or keep the dialog open with the failure.
   */
  protected async confirm(): Promise<void> {
    this.status.set({ kind: 'deleting' });

    try {
      await this.writer.remove(this.certificate);
      this.dialogRef.close(true);
    } catch (error) {
      this.status.set({ kind: 'error', message: certificateWriteMessage(error) });
    }
  }
}
