import { Injectable } from '@angular/core';
import {
  catchError,
  firstValueFrom,
  of,
} from 'rxjs';

import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import {
  featuredProjectDocPath,
  IProjectCard,
  IProjectView,
  projectDataDocPath,
  projectIconDocPath,
  projectIconFilePath,
  projectScreenshotFilePath,
} from '@portfolio-v2/state/dataModels';

/** Why a portfolio write stopped before a document changed, or failed. */
export type PortfolioWriteFailure = 'unauthenticated' | 'commit-failed';

/**
 * A portfolio write that did not finish.
 * `unauthenticated` is thrown before any Firestore call.
 */
export class PortfolioWriteError extends Error {
  /**
   * Record which step failed and the error that caused it.
   * @param reason which step failed
   * @param cause underlying error, when the failure came from Firebase
   */
  constructor(
    public readonly reason: PortfolioWriteFailure,
    cause?: unknown,
  ) {
    super(reason);
    this.name = 'PortfolioWriteError';
    (this as { cause?: unknown }).cause = cause;
  }
}

/**
 * The only code that writes portfolio tiles and project cards.
 * Provided on the admin portfolio routes.
 */
@Injectable()
export class PortfolioWriter {
  /**
   * Build the writer with Firestore, storage, and the signed-in check.
   * @param setData Firestore and storage access
   * @param auth signed-in check
   */
  constructor(
    private readonly setData: SetDataService,
    private readonly auth: AuthService,
  ) {}

  /**
   * Create or replace one portfolio tile.
   * @param tile tile to store
   */
  public async saveTile(tile: IProjectView): Promise<void> {
    await this.replace(projectIconDocPath(tile.id), tile);
  }

  /**
   * Delete a tile that was just added and has no project card yet.
   * A missing icon file still counts as removed.
   * @param id tile id
   */
  public async removeNewTile(id: number): Promise<void> {
    await this.removeDocuments([projectIconDocPath(id)]);
    await this.optionalFile(projectIconFilePath(id));
  }

  /**
   * Create or replace one project card.
   * @param card card to store
   * @param featured true when the card lives in the featured collection
   */
  public async saveCard(card: IProjectCard, featured: boolean): Promise<void> {
    const path = featured ? featuredProjectDocPath(card.id) : projectDataDocPath(card.id);
    await this.replace(path, card);
  }

  /**
   * Replace the heading on the standard project card for a tile.
   * Other card fields stay as they are.
   * @param id card id
   * @param heading new heading
   */
  public async patchCardHeading(id: number, heading: string): Promise<void> {
    this.assertSignedIn();
    try {
      await this.setData.commit([{
        kind: 'merge',
        path: projectDataDocPath(id),
        value: { heading },
      }]);
    } catch (error) {
      throw new PortfolioWriteError('commit-failed', error);
    }
  }

  /**
   * Remove a standard tile, its card, and any stored images.
   * A missing file still counts as removed.
   * @param id tile id
   */
  public async removeStandardProject(id: number): Promise<void> {
    await this.optionalFile(projectIconFilePath(id));
    await this.optionalFile(projectScreenshotFilePath(id, false));
    await this.removeDocuments([
      projectIconDocPath(id),
      projectDataDocPath(id),
    ]);
  }

  /**
   * Remove a featured project card and its stored images.
   * A missing file still counts as removed.
   * @param id card id
   */
  public async removeFeaturedProject(id: number): Promise<void> {
    const padded = String(id).padStart(2, '0');
    await this.optionalFile(projectScreenshotFilePath(id, true));
    await this.optionalFile(`portfolio/featured-projects/ID-${padded}-Image.webp`);
    await this.removeDocuments([featuredProjectDocPath(id)]);
  }

  /**
   * Replace one document.
   * @param path document path
   * @param value document body
   */
  private async replace(path: string, value: IProjectView | IProjectCard): Promise<void> {
    this.assertSignedIn();
    try {
      await this.setData.commit([{ kind: 'set', path, value }]);
    } catch (error) {
      throw new PortfolioWriteError('commit-failed', error);
    }
  }

  /**
   * Delete documents. A missing document still counts as removed.
   * @param paths document paths
   */
  private async removeDocuments(paths: readonly string[]): Promise<void> {
    this.assertSignedIn();
    try {
      await this.setData.commit(paths.map((path) => ({ kind: 'delete' as const, path })));
    } catch (error) {
      throw new PortfolioWriteError('commit-failed', error);
    }
  }

  /**
   * Remove a storage object. A missing file is not a failure.
   * @param path storage path
   */
  private async optionalFile(path: string): Promise<void> {
    await firstValueFrom(
      this.setData.deleteFileFromStorage(path).pipe(catchError(() => of(''))),
    );
  }

  /**
   * Refuse the write when nobody is signed in.
   */
  private assertSignedIn(): void {
    if (!this.auth.isUserLoggedIn()) {
      throw new PortfolioWriteError('unauthenticated');
    }
  }
}

/**
 * Text for a failed save or delete.
 * @param error failure from the writer, or anything else thrown around it
 * @returns text for the dialog
 */
export function portfolioWriteMessage(error: unknown): string {
  if (error instanceof PortfolioWriteError && error.reason === 'unauthenticated') {
    return 'Sign in before changing the portfolio.';
  }

  return 'The portfolio record could not be saved.';
}
