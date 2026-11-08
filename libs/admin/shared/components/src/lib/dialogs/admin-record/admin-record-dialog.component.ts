import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  effect,
  inject,
  OnDestroy,
  signal,
  viewChild,
  ViewContainerRef,
  AfterViewInit,
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
  type AdminRecordDialogData,
  type AdminRecordForm,
  type RecordSaver,
} from './admin-record-dialog.data';

/** Idle, a save in flight, or the last write error. */
type SaveStatus =
  | { readonly kind: 'idle' }
  | { readonly kind: 'saving' }
  | { readonly kind: 'error'; readonly message: string };

/**
 * Add or edit one record.
 * The page opens this with its view container so the route-provided writer can be injected.
 */
@Component({
  selector: 'admin-record-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogModule,
  ],
  templateUrl: './admin-record-dialog.component.html',
  styleUrl: './admin-record-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRecordDialogComponent<TTarget, TRecord> implements AfterViewInit, OnDestroy {
  /** Record, form, and writer this dialog was opened with. */
  protected readonly data = inject<AdminRecordDialogData<TTarget, TRecord>>(MAT_DIALOG_DATA);

  /** Idle, saving, or the last write error. */
  protected readonly status = signal<SaveStatus>({ kind: 'idle' });

  /** Where the form is created. */
  private readonly formHost = viewChild.required('formHost', { read: ViewContainerRef });

  /** Form created for this dialog. */
  private readonly formRef = signal<ComponentRef<AdminRecordForm<TRecord>> | null>(null);

  /** Closes this dialog after a successful save. */
  private readonly dialogRef = inject<
    MatDialogRef<AdminRecordDialogComponent<TTarget, TRecord>, boolean>
  >(MatDialogRef);

  /** The writer to use for the save. */
  private readonly writer = inject<RecordSaver<TRecord>>(this.data.writer);

  /** Subscription to the form's submitted output. */
  private submittedSubscription: { unsubscribe(): void } | null = null;

  /**
   * Disable the form while a save is in flight.
   */
  constructor() {
    effect(() => {
      const saving = this.status().kind === 'saving';
      this.formRef()?.setInput('disabled', saving);
    });
  }

  /**
   * Create the page's form inside this dialog.
   */
  public ngAfterViewInit(): void {
    const ref = this.formHost().createComponent(this.data.form);
    ref.setInput('target', this.data.target);
    ref.setInput('disabled', false);
    this.submittedSubscription = ref.instance.submitted.subscribe((record) => {
      this.onSubmitted(record).catch(() => undefined);
    });
    this.formRef.set(ref);
  }

  /**
   * Drop the form subscription.
   */
  public ngOnDestroy(): void {
    this.submittedSubscription?.unsubscribe();
  }

  /**
   * Ask the form for a record.
   */
  protected save(): void {
    const form = this.formRef();
    if (form) {
      form.instance.submit().catch(() => undefined);
    }
  }

  /**
   * Save the record and close, or keep the dialog open with the failure.
   * @param record form result
   */
  private async onSubmitted(record: TRecord): Promise<void> {
    this.status.set({ kind: 'saving' });

    try {
      await this.writer.save(record);
      this.dialogRef.close(true);
    } catch (error) {
      this.status.set({ kind: 'error', message: this.data.writeMessage(error) });
    }
  }
}
