import { Injectable } from '@angular/core';

import {
  certificateDocPath,
  ICertificateCard,
} from '@portfolio-v2/state/dataModels';
import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import { SingleDocWriter } from '../../single-doc-writer';

/** Why a certificate write stopped before the document changed, or failed. */
export type CertificateWriteFailure = 'unauthenticated' | 'commit-failed';

/**
 * A certificate write that did not finish.
 * `unauthenticated` is thrown before any Firestore call.
 */
export class CertificateWriteError extends Error {
  /**
   * Record which step failed and the error that caused it.
   * @param reason which step failed
   * @param cause underlying error, when the failure came from Firebase
   */
  constructor(
    public readonly reason: CertificateWriteFailure,
    cause?: unknown,
  ) {
    super(reason);
    this.name = 'CertificateWriteError';
    // The app compiles this file against es2022, where Error already has cause.
    // Declaring the field here fails that build, and override fails the es2020 library build.
    (this as { cause?: unknown }).cause = cause;
  }
}

/**
 * The only code that writes certificate documents.
 * Provided on the admin certificates route, not at the application root.
 */
@Injectable()
export class CertificateWriter extends SingleDocWriter<ICertificateCard> {
  /**
   * Build the writer with Firestore and the signed-in check.
   * @param setData Firestore access
   * @param auth signed-in check
   */
  constructor(setData: SetDataService, auth: AuthService) {
    super(setData, auth, {
      path: certificateDocPath,
      createError: (reason, cause) => new CertificateWriteError(reason, cause),
    });
  }
}

/**
 * Text for a failed save or delete.
 * @param error failure from the writer, or anything else thrown around it
 * @returns text for the dialog
 */
export function certificateWriteMessage(error: unknown): string {
  if (error instanceof CertificateWriteError && error.reason === 'unauthenticated') {
    return 'Sign in before changing certificates.';
  }

  return 'The certificate could not be saved.';
}
