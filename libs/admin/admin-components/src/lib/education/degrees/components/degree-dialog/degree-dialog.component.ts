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
  EducationEditTarget,
  IEducation,
} from '@portfolio-v2/state/dataModels';
import { DegreeFormComponent } from '../degree-form/degree-form.component';
import {
  degreeWriteMessage,
  DegreeWriter,
} from '../../services/degree-writer.service';

/** Idle, a save in flight, or the last write error. */
type SaveStatus =
  | { readonly kind: 'idle' }
  | { readonly kind: 'saving' }
  | { readonly kind: 'error'; readonly message: string };

/**
 * Add or edit one degree.
 * The page opens this with its view container so the route-provided writer can be injected.
 */
@Component({
  selector: 'admin-degree-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogModule,
    DegreeFormComponent,
  ],
  templateUrl: './degree-dialog.component.html',
  styleUrl: './degree-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DegreeDialogComponent {
  /** Record this dialog was opened with. */
  protected readonly target = inject<EducationEditTarget>(MAT_DIALOG_DATA);

  /** Title for a new record or an existing one. */
  protected readonly heading = this.target.mode === 'new' ? 'New degree' : 'Edit degree';

  /** Idle, saving, or the last write error. */
  protected readonly status = signal<SaveStatus>({ kind: 'idle' });

  /** Message from the last failed write, or null. */
  protected readonly errorMessage = computed(() => {
    const current = this.status();
    return current.kind === 'error' ? current.message : null;
  });

  private readonly dialogRef = inject<MatDialogRef<DegreeDialogComponent, boolean>>(
    MatDialogRef,
  );

  /** The writer to use for the save. */
  private readonly writer = inject(DegreeWriter);

  /** The form to ask for a record. */
  private readonly form = viewChild.required(DegreeFormComponent);

  /**
   * Ask the form for a record.
   */
  protected save(): void {
    this.form().submit();
  }

  /**
   * Save the record and close, or keep the dialog open with the failure.
   * @param degree form result
   */
  protected async onSubmitted(degree: IEducation): Promise<void> {
    this.status.set({ kind: 'saving' });

    try {
      await this.writer.save(degree);
      this.dialogRef.close(true);
    } catch (error) {
      this.status.set({ kind: 'error', message: degreeWriteMessage(error) });
    }
  }
}
