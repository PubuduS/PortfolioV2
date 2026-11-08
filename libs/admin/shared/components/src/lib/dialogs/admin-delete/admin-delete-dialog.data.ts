import { type ProviderToken } from '@angular/core';

/** Writer the delete dialog calls after confirmation. */
export interface RecordRemover<TRecord> {
  /**
   * Remove one record.
   * @param record row the dialog still holds
   */
  remove(record: TRecord): Promise<void>;
}

/** What the page passes when it opens the delete dialog. */
export interface AdminDeleteDialogData<TRecord> {
  /** Dialog title. */
  readonly title: string;
  /** Lines that name the record. */
  readonly lines: readonly string[];
  /** Record passed to the writer. */
  readonly record: TRecord;
  /** Route writer, or an adapter with one remove method. */
  readonly writer: ProviderToken<RecordRemover<TRecord>>;
  /**
   * Text for a failed delete.
   * @param error failure from the writer
   * @returns text for the dialog
   */
  readonly writeMessage: (error: unknown) => string;
}
