import { Injectable } from '@angular/core';

import {
  educationDocPath,
  IEducation,
} from '@portfolio-v2/state/dataModels';
import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';

/** Why a degree write stopped before the document changed, or failed. */
export type DegreeWriteFailure = 'unauthenticated' | 'commit-failed';

/**
 * A degree write that did not finish.
 * `unauthenticated` is thrown before any Firestore call.
 */
export class DegreeWriteError extends Error {
  /**
   * @param reason which step failed
   * @param cause underlying error, when the failure came from Firebase
   */
  constructor(
    public readonly reason: DegreeWriteFailure,
    cause?: unknown,
  ) {
    super(reason);
    this.name = 'DegreeWriteError';
    // The app compiles this file against es2022, where Error already has cause.
    // Declaring the field here fails that build, and override fails the es2020 library build.
    (this as { cause?: unknown }).cause = cause;
  }
}

/**
 * The only code that writes education documents.
 * Provided on the admin degrees route, not at the application root.
 */
@Injectable()
export class DegreeWriter {
  /**
   * @param setData Firestore access
   * @param auth signed-in check
   */
  constructor(
    private setData: SetDataService,
    private auth: AuthService,
  ) {}

  /**
   * Create or replace one education document.
   * A second call with the same id overwrites the same document.
   * @param degree record to store
   * @returns the record that was committed
   */
  public async save(degree: IEducation): Promise<IEducation> {
    this.assertSignedIn();

    try {
      await this.setData.commit([
        { kind: 'set', path: educationDocPath(degree.id), value: degree },
      ]);
    } catch (error) {
      throw new DegreeWriteError('commit-failed', error);
    }

    return degree;
  }

  /**
   * Delete one education document.
   * @param degree record to remove
   */
  public async remove(degree: IEducation): Promise<void> {
    this.assertSignedIn();

    try {
      await this.setData.commit([
        { kind: 'delete', path: educationDocPath(degree.id) },
      ]);
    } catch (error) {
      throw new DegreeWriteError('commit-failed', error);
    }
  }

  /**
   * @throws DegreeWriteError when nobody is signed in
   */
  private assertSignedIn(): void {
    if (!this.auth.isUserLoggedIn()) {
      throw new DegreeWriteError('unauthenticated');
    }
  }
}

/**
 * Text for a failed save or delete.
 * @param error failure from the writer, or anything else thrown around it
 * @returns text for the dialog
 */
export function degreeWriteMessage(error: unknown): string {
  if (error instanceof DegreeWriteError && error.reason === 'unauthenticated') {
    return 'Sign in before changing degrees.';
  }

  return 'The degree could not be saved.';
}
