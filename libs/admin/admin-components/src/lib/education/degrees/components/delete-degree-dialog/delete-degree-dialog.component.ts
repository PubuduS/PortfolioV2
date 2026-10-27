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

import { IEducation } from '@portfolio-v2/state/dataModels';
import {
  degreeWriteMessage,
  DegreeWriter,
} from '../../services/degree-writer.service';

/** Idle, a delete in flight, or the last write error. */
type DeleteStatus =
  | { readonly kind: 'idle' }
  | { readonly kind: 'deleting' }
  | { readonly kind: 'error'; readonly message: string };

/**
 * Confirm before a degree is removed.
 * The page opens this with its view container so the route-provided writer can be injected.
 */
@Component({
  selector: 'admin-delete-degree-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogModule,
  ],
  templateUrl: './delete-degree-dialog.component.html',
  styleUrl: './delete-degree-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteDegreeDialogComponent {
  /** Record the owner is about to remove. */
  protected readonly degree = inject<IEducation>(MAT_DIALOG_DATA);

  /** Idle, deleting, or the last write error. */
  protected readonly status = signal<DeleteStatus>({ kind: 'idle' });

  /** Message from the last failed delete, or null. */
  protected readonly errorMessage = computed(() => {
    const current = this.status();
    return current.kind === 'error' ? current.message : null;
  });

  private readonly dialogRef = inject<MatDialogRef<DeleteDegreeDialogComponent, boolean>>(
    MatDialogRef,
  );

  /** The writer to use for the delete. */
  private readonly writer = inject(DegreeWriter);

  /**
   * Remove the degree and close, or keep the dialog open with the failure.
   */
  protected async confirm(): Promise<void> {
    this.status.set({ kind: 'deleting' });

    try {
      await this.writer.remove(this.degree);
      this.dialogRef.close(true);
    } catch (error) {
      this.status.set({ kind: 'error', message: degreeWriteMessage(error) });
    }
  }
}
