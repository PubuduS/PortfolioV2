import {
  type OutputRef,
  type ProviderToken,
  type Type,
} from '@angular/core';

/** Form the record dialog creates and asks to submit. */
export interface AdminRecordForm<TRecord> {
  /** Emit a record, or show the first rule that failed. */
  submit(): Promise<void>;
  /** Record the form accepted. */
  readonly submitted: OutputRef<TRecord>;
}

/** Writer the record dialog calls after the form emits. */
export interface RecordSaver<TRecord> {
  /**
   * Persist one record.
   * @param record form result
   */
  save(record: TRecord): Promise<unknown>;
}

/** What the page passes when it opens the record dialog. */
export interface AdminRecordDialogData<TTarget, TRecord> {
  /** Dialog title. */
  readonly heading: string;
  /** Record the form loads. */
  readonly target: TTarget;
  /** Form created inside the dialog. */
  readonly form: Type<AdminRecordForm<TRecord>>;
  /** Route writer. Opening without the page injector cannot see it. */
  readonly writer: ProviderToken<RecordSaver<TRecord>>;
  /**
   * Text for a failed save.
   * @param error failure from the writer
   * @returns text for the dialog
   */
  readonly writeMessage: (error: unknown) => string;
}
