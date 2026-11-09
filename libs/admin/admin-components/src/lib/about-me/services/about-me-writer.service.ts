import { Injectable } from '@angular/core';

import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import {
  ABOUT_ME_DOC_PATH,
  IAboutMe,
} from '@portfolio-v2/state/dataModels';
import { SingleDocWriter } from '../../education/single-doc-writer';

/** Why an about-me write stopped before the document changed, or failed. */
export type AboutMeWriteFailure = 'unauthenticated' | 'commit-failed';

/**
 * An about-me write that did not finish.
 * `unauthenticated` is thrown before any Firestore call.
 */
export class AboutMeWriteError extends Error {
  /**
   * Record which step failed and the error that caused it.
   * @param reason which step failed
   * @param cause underlying error, when the failure came from Firebase
   */
  constructor(
    public readonly reason: AboutMeWriteFailure,
    cause?: unknown,
  ) {
    super(reason);
    this.name = 'AboutMeWriteError';
    (this as { cause?: unknown }).cause = cause;
  }
}

/**
 * The only code that writes the about-me document.
 * Provided on the admin about-me route.
 */
@Injectable()
export class AboutMeWriter extends SingleDocWriter<IAboutMe> {
  /**
   * Build the writer with Firestore and the signed-in check.
   * @param setData Firestore access
   * @param auth signed-in check
   */
  constructor(setData: SetDataService, auth: AuthService) {
    super(setData, auth, {
      path: () => ABOUT_ME_DOC_PATH,
      createError: (reason, cause) => new AboutMeWriteError(reason, cause),
    });
  }
}

/**
 * Text for a failed save.
 * @param error failure from the writer, or anything else thrown around it
 * @returns text for the page
 */
export function aboutMeWriteMessage(error: unknown): string {
  if (error instanceof AboutMeWriteError && error.reason === 'unauthenticated') {
    return 'Sign in before changing about me.';
  }

  return 'About me could not be saved.';
}
