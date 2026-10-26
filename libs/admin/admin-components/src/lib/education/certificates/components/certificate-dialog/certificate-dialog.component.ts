import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
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

import {
  CertificateEditTarget,
  ICertificateCard,
} from '@portfolio-v2/state/dataModels';
import { CertificateFormComponent } from '../certificate-form/certificate-form.component';
import {
  certificateWriteMessage,
  CertificateWriter,
} from '../../services/certificate-writer.service';

/** Idle, a save in flight, or the last write error. */
type SaveStatus =
  | { readonly kind: 'idle' }
  | { readonly kind: 'saving' }
  | { readonly kind: 'error'; readonly message: string };

/**
 * Add or edit one certificate.
 * The page opens this with its view container so the route-provided writer can be injected.
 */
@Component({
  selector: 'admin-certificate-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogModule,
    CertificateFormComponent,
  ],
  templateUrl: './certificate-dialog.component.html',
  styleUrl: './certificate-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateDialogComponent {
  /** Record this dialog was opened with. */
  protected readonly target = inject<CertificateEditTarget>(MAT_DIALOG_DATA);

  /** Title for a new record or an existing one. */
  protected readonly heading = this.target.mode === 'new' ? 'New certificate' : 'Edit certificate';

  /** Idle, saving, or the last write error. */
  protected readonly status = signal<SaveStatus>({ kind: 'idle' });

  /** Message from the last failed write, or null. */
  protected readonly errorMessage = computed(() => {
    const current = this.status();
    return current.kind === 'error' ? current.message : null;
  });

  private readonly dialogRef = inject<MatDialogRef<CertificateDialogComponent, boolean>>(
    MatDialogRef,
  );

  /** The writer to use for the save. */
  private readonly writer = inject(CertificateWriter);

  /** The form to ask for a record. */
  private readonly form = viewChild.required(CertificateFormComponent);

  /**
   * Ask the form for a record.
   */
  protected save(): void {
    this.form().submit();
  }

  /**
   * Save the record and close, or keep the dialog open with the failure.
   * @param certificate form result
   */
  protected async onSubmitted(certificate: ICertificateCard): Promise<void> {
    this.status.set({ kind: 'saving' });

    try {
      await this.writer.save(certificate);
      this.dialogRef.close(true);
    } catch (error) {
      this.status.set({ kind: 'error', message: certificateWriteMessage(error) });
    }
  }
}
