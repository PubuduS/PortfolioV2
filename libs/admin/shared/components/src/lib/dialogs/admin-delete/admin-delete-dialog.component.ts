import {
  ChangeDetectionStrategy,
  Component,
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

import {
  type AdminDeleteDialogData,
  type RecordRemover,
} from './admin-delete-dialog.data';

/** Idle, a delete in flight, or the last write error. */
type DeleteStatus =
  | { readonly kind: 'idle' }
  | { readonly kind: 'deleting' }
  | { readonly kind: 'error'; readonly message: string };

/**
 * Confirm before one record is removed.
 * The page opens this with its view container so the route-provided writer can be injected.
 */
@Component({
  selector: 'admin-delete-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogModule,
  ],
  templateUrl: './admin-delete-dialog.component.html',
  styleUrl: './admin-delete-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDeleteDialogComponent<TRecord> {
  /** Record and writer this dialog was opened with. */
  protected readonly data = inject<AdminDeleteDialogData<TRecord>>(MAT_DIALOG_DATA);

  /** Idle, deleting, or the last write error. */
  protected readonly status = signal<DeleteStatus>({ kind: 'idle' });

  /** Closes this dialog after a successful delete. */
  private readonly dialogRef = inject<MatDialogRef<AdminDeleteDialogComponent<TRecord>, boolean>>(
    MatDialogRef,
  );

  /** The writer to use for the delete. */
  private readonly writer = inject<RecordRemover<TRecord>>(this.data.writer);

  /**
   * Remove the record and close, or keep the dialog open with the failure.
   */
  protected async confirm(): Promise<void> {
    this.status.set({ kind: 'deleting' });

    try {
      await this.writer.remove(this.data.record);
      this.dialogRef.close(true);
    } catch (error) {
      this.status.set({ kind: 'error', message: this.data.writeMessage(error) });
    }
  }
}
