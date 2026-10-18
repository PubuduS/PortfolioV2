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

import { Publication } from '@portfolio-v2/state/dataModels';
import {
  publicationWriteMessage,
  PublicationWriter,
} from '../../services/publication-writer.service';

/** Idle, a delete in flight, or the last write error. */
type DeleteStatus =
  | { readonly kind: 'idle' }
  | { readonly kind: 'deleting' }
  | { readonly kind: 'error'; readonly message: string };

/**
 * Confirm before a publication is removed.
 * The page opens this with its view container so the route-provided writer can be injected.
 */
@Component({
  selector: 'admin-delete-publication-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogModule,
  ],
  templateUrl: './delete-publication-dialog.component.html',
  styleUrl: './delete-publication-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeletePublicationDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<DeletePublicationDialogComponent, boolean>>(
    MatDialogRef,
  );

  /** Record the owner is about to remove. */
  protected readonly publication = inject<Publication>(MAT_DIALOG_DATA);

  /** The writer to use for the delete. */
  private readonly writer = inject(PublicationWriter);

  /** Idle, deleting, or the last write error. */
  protected readonly status = signal<DeleteStatus>({ kind: 'idle' });

  /** Message from the last failed delete, or null. */
  protected readonly errorMessage = computed(() => {
    const current = this.status();
    return current.kind === 'error' ? current.message : null;
  });

  /**
   * Remove the publication and close, or keep the dialog open with the failure.
   */
  protected async confirm(): Promise<void> {
    this.status.set({ kind: 'deleting' });

    try {
      await this.writer.remove(this.publication);
      this.dialogRef.close(true);
    } catch (error) {
      this.status.set({ kind: 'error', message: publicationWriteMessage(error) });
    }
  }
}
