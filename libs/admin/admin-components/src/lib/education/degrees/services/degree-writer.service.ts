import { Injectable } from '@angular/core';

import {
  educationDocPath,
  IEducation,
} from '@portfolio-v2/state/dataModels';
import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import { SingleDocWriter } from '../../single-doc-writer';

/** Why a degree write stopped before the document changed, or failed. */
export type DegreeWriteFailure = 'unauthenticated' | 'commit-failed';

/**
 * A degree write that did not finish.
 * `unauthenticated` is thrown before any Firestore call.
 */
export class DegreeWriteError extends Error {
  /**
   * Record which step failed and the error that caused it.
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
export class DegreeWriter extends SingleDocWriter<IEducation> {
  /**
   * Build the writer with Firestore and the signed-in check.
   * @param setData Firestore access
   * @param auth signed-in check
   */
  constructor(setData: SetDataService, auth: AuthService) {
    super(setData, auth, {
      path: educationDocPath,
      createError: (reason, cause) => new DegreeWriteError(reason, cause),
    });
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
