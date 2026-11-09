import { Injectable } from '@angular/core';

import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import {
  ISkills,
  SKILLS_DOC_PATH,
} from '@portfolio-v2/state/dataModels';
import { SingleDocWriter } from '../../education/single-doc-writer';

/** Why a skills write stopped before the document changed, or failed. */
export type SkillsWriteFailure = 'unauthenticated' | 'commit-failed';

/**
 * A skills write that did not finish.
 * `unauthenticated` is thrown before any Firestore call.
 */
export class SkillsWriteError extends Error {
  /**
   * Record which step failed and the error that caused it.
   * @param reason which step failed
   * @param cause underlying error, when the failure came from Firebase
   */
  constructor(
    public readonly reason: SkillsWriteFailure,
    cause?: unknown,
  ) {
    super(reason);
    this.name = 'SkillsWriteError';
    (this as { cause?: unknown }).cause = cause;
  }
}

/**
 * The only code that writes the skills document.
 * Provided on the admin skills route.
 */
@Injectable()
export class SkillsWriter extends SingleDocWriter<ISkills> {
  /**
   * Build the writer with Firestore and the signed-in check.
   * @param setData Firestore access
   * @param auth signed-in check
   */
  constructor(setData: SetDataService, auth: AuthService) {
    super(setData, auth, {
      path: () => SKILLS_DOC_PATH,
      createError: (reason, cause) => new SkillsWriteError(reason, cause),
    });
  }
}

/**
 * Text for a failed save.
 * @param error failure from the writer, or anything else thrown around it
 * @returns text for the page
 */
export function skillsWriteMessage(error: unknown): string {
  if (error instanceof SkillsWriteError && error.reason === 'unauthenticated') {
    return 'Sign in before changing skills.';
  }

  return 'Skills could not be saved.';
}
