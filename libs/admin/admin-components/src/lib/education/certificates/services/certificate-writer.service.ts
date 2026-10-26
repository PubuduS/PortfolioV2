import { Injectable } from '@angular/core';

import {
  certificateDocPath,
  ICertificateCard,
} from '@portfolio-v2/state/dataModels';
import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';

/** Why a certificate write stopped before the document changed, or failed. */
export type CertificateWriteFailure = 'unauthenticated' | 'commit-failed';

/**
 * A certificate write that did not finish.
 * `unauthenticated` is thrown before any Firestore call.
 */
export class CertificateWriteError extends Error {
  /**
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
export class CertificateWriter {
  /**
   * @param setData Firestore access
   * @param auth signed-in check
   */
  constructor(
    private setData: SetDataService,
    private auth: AuthService,
  ) {}

  /**
   * Create or replace one certificate document.
   * A second call with the same id overwrites the same document.
   * @param certificate record to store
   * @returns the certificate that was committed
   */
  public async save(certificate: ICertificateCard): Promise<ICertificateCard> {
    this.assertSignedIn();

    try {
      await this.setData.commit([
        { kind: 'set', path: certificateDocPath(certificate.id), value: certificate },
      ]);
    } catch (error) {
      throw new CertificateWriteError('commit-failed', error);
    }

    return certificate;
  }

  /**
   * Delete one certificate document.
   * @param certificate record to remove
   */
  public async remove(certificate: ICertificateCard): Promise<void> {
    this.assertSignedIn();

    try {
      await this.setData.commit([
        { kind: 'delete', path: certificateDocPath(certificate.id) },
      ]);
    } catch (error) {
      throw new CertificateWriteError('commit-failed', error);
    }
  }

  /**
   * @throws CertificateWriteError when nobody is signed in
   */
  private assertSignedIn(): void {
    if (!this.auth.isUserLoggedIn()) {
      throw new CertificateWriteError('unauthenticated');
    }
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
