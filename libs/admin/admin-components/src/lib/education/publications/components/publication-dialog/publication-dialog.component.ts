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
  EditTarget,
  PublicationDraft,
} from '@portfolio-v2/state/dataModels';
import { PublicationFormComponent } from '../publication-form/publication-form.component';
import {
  publicationWriteMessage,
  PublicationWriter,
} from '../../services/publication-writer.service';

/** Idle, a save in flight, or the last write error. */
type SaveStatus =
  | { readonly kind: 'idle' }
  | { readonly kind: 'saving' }
  | { readonly kind: 'error'; readonly message: string };

/**
 * Add or edit one publication.
 * The page opens this with its view container so the route-provided writer can be injected.
 */
@Component({
  selector: 'admin-publication-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogModule,
    PublicationFormComponent,
  ],
  templateUrl: './publication-dialog.component.html',
  styleUrl: './publication-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicationDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<PublicationDialogComponent, boolean>>(
    MatDialogRef,
  );

  /** Record this dialog was opened with. */
  protected readonly target = inject<EditTarget>(MAT_DIALOG_DATA);

  /** The writer to use for the save. */
  private readonly writer = inject(PublicationWriter);

  /** The form to use for the save. */
  private readonly form = viewChild.required(PublicationFormComponent);

  /** Title for a new record or an existing one. */
  protected readonly heading = this.target.mode === 'new' ? 'New publication' : 'Edit publication';

  /** Idle, saving, or the last write error. */
  protected readonly status = signal<SaveStatus>({ kind: 'idle' });

  /** Message from the last failed write, or null. */
  protected readonly errorMessage = computed(() => {
    const current = this.status();
    return current.kind === 'error' ? current.message : null;
  });

  /**
   * Ask the form for a draft.
   */
  protected save(): void {
    this.form().submit();
  }

  /**
   * Save the draft and close, or keep the dialog open with the failure.
   * @param draft form result
   */
  protected async onSubmitted(draft: PublicationDraft): Promise<void> {
    this.status.set({ kind: 'saving' });

    try {
      await this.writer.save(draft);
      this.dialogRef.close(true);
    } catch (error) {
      this.status.set({ kind: 'error', message: publicationWriteMessage(error) });
    }
  }
}
