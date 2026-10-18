import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  AssetInput,
  planDelete,
  Publication,
  PublicationDraft,
  PublicationId,
  publicationDocPaths,
  publicationFilePath,
  PublicationAsset,
  toPublicationDocs,
} from '@portfolio-v2/state/dataModels';
import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';

/** Why a publication write stopped before the documents changed, or the batch failed. */
export type PublicationWriteFailure = 'unauthenticated' | 'upload-failed' | 'commit-failed';

/**
 * A publication write that did not finish.
 * `unauthenticated` is thrown before any storage or Firestore call.
 */
export class PublicationWriteError extends Error {
  /**
   * @param reason which step failed
   * @param cause underlying error, when the failure came from Firebase
   */
  constructor(
    public readonly reason: PublicationWriteFailure,
    cause?: unknown,
  ) {
    super(reason);
    this.name = 'PublicationWriteError';
    // The app compiles this file against es2022, where Error already has cause.
    // Declaring the field here fails that build, and override fails the es2020 library build.
    (this as { cause?: unknown }).cause = cause;
  }
}

/**
 * The only code that writes publication documents or files.
 * Provided on the admin education route, not at the application root.
 */
@Injectable()
export class PublicationWriter {
  /**
   * @param setData Firestore and Storage access
   * @param auth signed-in check
   */
  constructor(
    private setData: SetDataService,
    private auth: AuthService,
  ) {}

  /**
   * Create or replace both documents for one publication.
   * A second call with the same id overwrites the same documents and storage objects.
   * @param draft form result, including any files still to upload
   * @returns the publication that was committed
   */
  public async save(draft: PublicationDraft): Promise<Publication> {
    this.assertSignedIn();

    const publication = await this.withStoredFiles(draft);
    const docs = toPublicationDocs(publication);
    const paths = publicationDocPaths(publication.id);

    try {
      await this.setData.commit([
        { kind: 'set', path: paths.card, value: docs.card },
        { kind: 'set', path: paths.details, value: docs.details },
      ]);
    } catch (error) {
      throw new PublicationWriteError('commit-failed', error);
    }

    return publication;
  }

  /**
   * Delete both documents, then the storage objects.
   * Documents go first so a failed file delete cannot leave a card pointing at a missing image.
   * @param publication record to remove
   */
  public async remove(publication: Publication): Promise<void> {
    this.assertSignedIn();

    const plan = planDelete(publication);

    try {
      await this.setData.commit(plan.docs.map((path) => ({
        kind: 'delete' as const,
        path,
      })));
    } catch (error) {
      throw new PublicationWriteError('commit-failed', error);
    }

    await this.deleteStoredFiles(plan.files);
  }

  /**
   * @throws PublicationWriteError when nobody is signed in
   */
  private assertSignedIn(): void {
    if (!this.auth.isUserLoggedIn()) {
      throw new PublicationWriteError('unauthenticated');
    }
  }

  /**
   * Upload any picked files. An existing asset is kept as-is.
   * @param draft draft whose files may still be local
   * @returns the same draft with storage urls in place of files
   */
  private async withStoredFiles(draft: PublicationDraft): Promise<Publication> {
    try {
      const cover = await this.storedAsset(draft.id, 'cover', draft.cover);
      const paper = draft.paper === null ? null : {
        asset: await this.storedAsset(draft.id, 'paper', draft.paper.asset),
        fileName: draft.paper.fileName,
      };

      return {
        ...draft,
        cover,
        paper,
      };
    } catch (error) {
      throw new PublicationWriteError('upload-failed', error);
    }
  }

  /**
   * @param id publication id
   * @param kind cover or paper
   * @param asset file or already-stored asset
   * @returns stored asset
   */
  private async storedAsset(
    id: PublicationId,
    kind: 'cover' | 'paper',
    asset: AssetInput,
  ): Promise<PublicationAsset> {
    if (!(asset instanceof File)) {
      return asset;
    }

    const url = await this.setData.uploadFile(publicationFilePath(id, kind), asset);

    return { source: 'storage', url };
  }

  /**
   * A missing object is ignored. The documents are already gone.
   * @param files storage paths from the delete plan
   */
  private async deleteStoredFiles(files: readonly string[]): Promise<void> {
    await Promise.all(files.map(async (path) => {
      const result = await firstValueFrom(this.setData.deleteFileFromStorage(path));
      if (result.startsWith('error') && !result.includes('object-not-found')) {
        throw new Error(result);
      }
    }));
  }
}

/**
 * Text for one writer failure.
 * @param reason writer failure
 * @returns text for the dialog
 */
function publicationFailureMessage(reason: PublicationWriteFailure): string {
  switch (reason) {
    case 'unauthenticated':
      return 'Sign in before changing publications.';
    case 'upload-failed':
      return 'The file did not upload. Nothing was saved.';
    case 'commit-failed':
      return 'The publication could not be saved.';
    default: {
      const unexpected: never = reason;
      throw new Error(`Unexpected publication write failure: ${String(unexpected)}`);
    }
  }
}

/**
 * Text for a failed save or delete.
 * @param error failure from the writer, or anything else thrown around it
 * @returns text for the dialog
 */
export function publicationWriteMessage(error: unknown): string {
  if (!(error instanceof PublicationWriteError)) {
    return 'The publication could not be saved.';
  }
  return publicationFailureMessage(error.reason);
}
