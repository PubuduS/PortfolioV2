import { Injectable } from '@angular/core';

import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import {
  experienceDocPath,
  IExperience,
} from '@portfolio-v2/state/dataModels';
import { SingleDocWriter } from '../../education/single-doc-writer';

/** Why an experience write stopped before the document changed, or failed. */
export type ExperienceWriteFailure = 'unauthenticated' | 'commit-failed';

/**
 * An experience write that did not finish.
 * `unauthenticated` is thrown before any Firestore call.
 */
export class ExperienceWriteError extends Error {
  /**
   * Record which step failed and the error that caused it.
   * @param reason which step failed
   * @param cause underlying error, when the failure came from Firebase
   */
  constructor(
    public readonly reason: ExperienceWriteFailure,
    cause?: unknown,
  ) {
    super(reason);
    this.name = 'ExperienceWriteError';
    (this as { cause?: unknown }).cause = cause;
  }
}

/**
 * The only code that writes experience documents.
 * Provided on the admin experience route, not at the application root.
 */
@Injectable()
export class ExperienceWriter extends SingleDocWriter<IExperience> {
  /**
   * Build the writer with Firestore and the signed-in check.
   * @param setData Firestore access
   * @param auth signed-in check
   */
  constructor(setData: SetDataService, auth: AuthService) {
    super(setData, auth, {
      path: experienceDocPath,
      createError: (reason, cause) => new ExperienceWriteError(reason, cause),
    });
  }
}

/**
 * Text for a failed save or delete.
 * @param error failure from the writer, or anything else thrown around it
 * @returns text for the dialog
 */
export function experienceWriteMessage(error: unknown): string {
  if (error instanceof ExperienceWriteError && error.reason === 'unauthenticated') {
    return 'Sign in before changing experience.';
  }

  return 'The experience could not be saved.';
}
