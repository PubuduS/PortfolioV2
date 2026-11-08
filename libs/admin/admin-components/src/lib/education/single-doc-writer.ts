import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import { type AllowedRecords } from '@portfolio-v2/shared/types';

/** Why a single-document write stopped. */
export type SingleDocWriteFailure = 'unauthenticated' | 'commit-failed';

/** Path and error factory for one single-document collection. */
export interface SingleDocWriterConfig {
  /** Firestore path for a record id. */
  readonly path: (id: number) => string;
  /**
   * Build the error the feature's message function already understands.
   * @param reason which step failed
   * @param cause underlying error, when the failure came from Firebase
   * @returns the feature error
   */
  readonly createError: (reason: SingleDocWriteFailure, cause?: unknown) => Error;
}

/**
 * Create or delete one document whose id is a number.
 * Certificate and degree writers supply the path and the error type.
 */
export class SingleDocWriter<T extends AllowedRecords & { readonly id: number }> {
  /**
   * Build the writer with Firestore, the signed-in check, and the collection config.
   * @param setData Firestore access
   * @param auth signed-in check
   * @param config path and error factory
   */
  constructor(
    private readonly setData: SetDataService,
    private readonly auth: AuthService,
    private readonly config: SingleDocWriterConfig,
  ) {}

  /**
   * Create or replace one document.
   * A second call with the same id overwrites the same document.
   * @param record record to store
   * @returns the record that was committed
   */
  public async save(record: T): Promise<T> {
    this.assertSignedIn();

    try {
      await this.setData.commit([
        { kind: 'set', path: this.config.path(record.id), value: record },
      ]);
    } catch (error) {
      throw this.config.createError('commit-failed', error);
    }

    return record;
  }

  /**
   * Delete one document.
   * @param record record to remove
   */
  public async remove(record: T): Promise<void> {
    this.assertSignedIn();

    try {
      await this.setData.commit([
        { kind: 'delete', path: this.config.path(record.id) },
      ]);
    } catch (error) {
      throw this.config.createError('commit-failed', error);
    }
  }

  /**
   * Refuse the write when nobody is signed in.
   */
  private assertSignedIn(): void {
    if (!this.auth.isUserLoggedIn()) {
      throw this.config.createError('unauthenticated');
    }
  }
}
