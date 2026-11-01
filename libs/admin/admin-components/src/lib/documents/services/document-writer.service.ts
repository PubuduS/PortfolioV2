import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  AuthService,
  SetDataService,
  type TransactionRecipe,
} from '@portfolio-v2/shared/services';
import {
  acceptUpload,
  applyCatalogCommand,
  catalogDocPath,
  type CatalogCommand,
  type CommandResult,
  DocumentWriteError,
  type DocumentKind,
  type DocumentVersion,
  storageObjectPath,
  type UploadAttempt,
  type VersionId,
} from '@portfolio-v2/state/dataModels';

/**
 * The only production writer for catalog documents and their storage objects.
 * Provided on the resume and cover-letter admin routes, not at the application root.
 */
@Injectable()
export class DocumentWriter {
  /**
   * @param setData Firestore and Storage access
   * @param auth signed-in check
   */
  constructor(
    private setData: SetDataService,
    private auth: AuthService,
  ) {}

  /**
   * Store one file and make it the current version.
   * The same attemptId converges. A second id is a second version.
   * @param kind resume or cover letter
   * @param file picked file
   * @param attemptId id minted for this file until upload succeeds
   */
  public async upload(kind: DocumentKind, file: File, attemptId: VersionId): Promise<void> {
    this.assertSignedIn(kind);
    const accepted = acceptUpload(kind, file);
    if (!accepted.ok) {
      throw new DocumentWriteError('rejected-type', kind);
    }

    let downloadUrl: string;
    try {
      downloadUrl = await this.setData.uploadFile(storageObjectPath(kind, attemptId), file);
    } catch (error) {
      throw new DocumentWriteError('upload-failed', kind, error);
    }

    const attempt: UploadAttempt = {
      id: attemptId,
      uploadedAt: new Date().toISOString(),
      downloadUrl,
    };
    const applied = await this.commit(kind, { type: 'upload', attempt });
    await this.deleteStoredPaths(kind, applied.deletePaths);
  }

  /**
   * Remove one version. The only remaining version is left in place.
   * A second call with the same version deletes no live path
   * and succeeds when the row is already gone.
   * @param kind resume or cover letter
   * @param version row the dialog still holds
   */
  public async remove(kind: DocumentKind, version: DocumentVersion): Promise<void> {
    this.assertSignedIn(kind);
    const applied = await this.commit(kind, { type: 'remove', version });
    await this.deleteStoredPaths(kind, applied.deletePaths);
  }

  /**
   * @param kind resume or cover letter
   * @throws DocumentWriteError when nobody is signed in
   */
  private assertSignedIn(kind: DocumentKind): void {
    if (!this.auth.isUserLoggedIn()) {
      throw new DocumentWriteError('unauthenticated', kind);
    }
  }

  /**
   * @param kind document id
   * @param command upload or remove
   * @returns a command that committed, or that left the document alone on purpose
   */
  private async commit(
    kind: DocumentKind,
    command: CatalogCommand,
  ): Promise<CommandResult & { ok: true }> {
    let applied: CommandResult;
    try {
      applied = await this.setData.transact<CommandResult>(
        catalogDocPath(kind),
        (current): TransactionRecipe<CommandResult> => {
          const result = applyCatalogCommand(kind, current, command);
          if (!result.ok) {
            return { next: null, result };
          }
          const next = result.wire === null
            ? null
            : result.wire as unknown as { readonly [key: string]: unknown };
          return {
            next,
            result,
          };
        },
      );
    } catch (error) {
      throw new DocumentWriteError('commit-failed', kind, error);
    }
    if (!applied.ok) {
      throw new DocumentWriteError(applied.reason === 'protected' ? 'protected' : 'commit-failed', kind);
    }
    return applied;
  }

  /**
   * A missing object is success. Any other storage error leaves the saved catalog in place.
   * @param kind resume or cover letter
   * @param paths storage paths the recipe named
   */
  private async deleteStoredPaths(kind: DocumentKind, paths: readonly string[]): Promise<void> {
    await Promise.all(paths.map(async (path) => {
      const outcome = await firstValueFrom(this.setData.deleteFileFromStorage(path));
      if (outcome.includes('object-not-found')) {
        return;
      }
      if (outcome.includes('error')) {
        throw new DocumentWriteError('cleanup-failed', kind);
      }
    }));
  }
}
