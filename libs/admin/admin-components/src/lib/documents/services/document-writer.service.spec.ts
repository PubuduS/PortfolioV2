import { createSpyObj } from 'jest-createspyobj';
import { of } from 'rxjs';

import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import {
  applyCatalogCommand,
  createVersionId,
  DocumentWriteError,
  parseCatalog,
  storageObjectPath,
  type DocumentVersion,
} from '@portfolio-v2/state/dataModels';
import { DocumentWriter } from './document-writer.service';

const ATTEMPT = createVersionId(1730000000000, 9);

/**
 * @param count how many resume rows to prepend
 * @returns the Firestore body after those inserts
 */
function resumeBody(count: number): unknown {
  let current: unknown;
  for (let entropy = 1; entropy <= count; entropy += 1) {
    const result = applyCatalogCommand('resume', current, {
      type: 'upload',
      attempt: {
        id: createVersionId(1730000000000, entropy),
        uploadedAt: '2026-01-01T00:00:00.000Z',
        downloadUrl: `https://files.example/${entropy}`,
      },
    });
    if (!result.ok || result.wire === null) {
      throw new Error(`seed upload ${entropy} did not insert`);
    }
    current = result.wire;
  }
  return current;
}

/**
 * @param body catalog document
 * @param index row index
 * @returns the stored version
 */
function versionAt(body: unknown, index: number): DocumentVersion {
  const parsed = parseCatalog('resume', body);
  if (!parsed.ok) {
    throw new Error('seed catalog is unreadable');
  }
  const version = parsed.catalog.versions[index];
  if (version === undefined) {
    throw new Error(`missing version ${index}`);
  }
  return version;
}

/**
 * @param name file name
 * @param type mime type
 * @returns a non-empty file
 */
function file(name: string, type: string): File {
  return new File(['%PDF'], name, { type });
}

describe('DocumentWriter', () => {
  let setData: jest.Mocked<SetDataService>;
  let auth: jest.Mocked<AuthService>;
  let writer: DocumentWriter;
  let stored: unknown;

  beforeEach(() => {
    setData = createSpyObj(SetDataService);
    auth = createSpyObj(AuthService);
    stored = undefined;
    setData.uploadFile.mockResolvedValue('https://files.example/new');
    setData.deleteFileFromStorage.mockReturnValue(of('successfull'));
    setData.transact.mockImplementation(async (_path, recipe) => {
      const recipeResult = recipe(stored);
      if (recipeResult.next !== null) {
        stored = recipeResult.next;
      }
      return recipeResult.result;
    });
    auth.isUserLoggedIn.mockReturnValue(true);
    writer = new DocumentWriter(setData, auth);
  });

  describe('when nobody is signed in', () => {
    beforeEach(() => {
      auth.isUserLoggedIn.mockReturnValue(false);
    });

    it('should not upload or transact', async () => {
      await expect(writer.upload('resume', file('resume.pdf', 'application/pdf'), ATTEMPT)).rejects.toMatchObject({
        reason: 'unauthenticated',
      });
      expect(setData.uploadFile).not.toHaveBeenCalled();
      expect(setData.transact).not.toHaveBeenCalled();
    });
  });

  describe('upload', () => {
    it('should reject a bad type before upload', async () => {
      await expect(writer.upload('resume', file('notes.txt', 'text/plain'), ATTEMPT)).rejects.toBeInstanceOf(
        DocumentWriteError,
      );
      await expect(writer.upload('resume', file('notes.txt', 'text/plain'), ATTEMPT)).rejects.toMatchObject({
        reason: 'rejected-type',
        kind: 'resume',
      });
      expect(setData.uploadFile).not.toHaveBeenCalled();
    });

    it('should not transact when the upload fails', async () => {
      setData.uploadFile.mockRejectedValue(new Error('network'));

      await expect(writer.upload('resume', file('resume.pdf', 'application/pdf'), ATTEMPT)).rejects.toMatchObject({
        reason: 'upload-failed',
      });
      expect(setData.transact).not.toHaveBeenCalled();
    });

    it('should insert once and no-op the same attempt id', async () => {
      stored = resumeBody(5);
      const oldest = storageObjectPath('resume', createVersionId(1730000000000, 1));
      const pdf = file('resume.pdf', 'application/pdf');

      await writer.upload('resume', pdf, ATTEMPT);
      await writer.upload('resume', pdf, ATTEMPT);

      expect(setData.uploadFile).toHaveBeenCalledTimes(2);
      expect(setData.uploadFile).toHaveBeenCalledWith(storageObjectPath('resume', ATTEMPT), pdf);
      expect(setData.transact).toHaveBeenCalledTimes(2);
      const parsed = parseCatalog('resume', stored);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) {
        return;
      }
      expect(parsed.catalog.versions).toHaveLength(5);
      expect(parsed.catalog.versions[0].id).toBe(ATTEMPT);
      expect(parsed.catalog.versions.map((version) => version.id)).not.toContain(
        createVersionId(1730000000000, 1),
      );
      expect(setData.deleteFileFromStorage).toHaveBeenCalledTimes(2);
      expect(setData.deleteFileFromStorage).toHaveBeenNthCalledWith(1, oldest);
      expect(setData.deleteFileFromStorage).toHaveBeenNthCalledWith(2, oldest);
    });

    it('should treat a missing object as success and another error as cleanup-failed', async () => {
      const pdf = file('resume.pdf', 'application/pdf');
      stored = resumeBody(5);
      setData.deleteFileFromStorage.mockReturnValue(of('error FirebaseError: storage/object-not-found'));

      await writer.upload('resume', pdf, ATTEMPT);

      setData.deleteFileFromStorage.mockReturnValue(of('error network'));
      const retry = createVersionId(1730000000000, 8);
      await expect(writer.upload('resume', pdf, retry)).rejects.toMatchObject({ reason: 'cleanup-failed' });
    });

    it('should not delete storage when the catalog is unreadable', async () => {
      stored = { versions: 'bad' };

      await expect(writer.upload('resume', file('resume.pdf', 'application/pdf'), ATTEMPT)).rejects.toMatchObject({
        reason: 'commit-failed',
      });
      expect(stored).toEqual({ versions: 'bad' });
      expect(setData.deleteFileFromStorage).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should not delete storage for the only version', async () => {
      stored = resumeBody(1);
      const current = versionAt(stored, 0);

      await expect(writer.remove('resume', current)).rejects.toMatchObject({ reason: 'protected' });
      expect(setData.deleteFileFromStorage).not.toHaveBeenCalled();
      expect(parseCatalog('resume', stored).ok).toBe(true);
    });

    it('should promote the previous version when the current one is removed', async () => {
      stored = resumeBody(2);
      const current = versionAt(stored, 0);
      const previous = versionAt(stored, 1);

      await writer.remove('resume', current);

      const parsed = parseCatalog('resume', stored);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) {
        return;
      }
      expect(parsed.catalog.versions).toHaveLength(1);
      expect(parsed.catalog.versions[0].id).toBe(previous.id);
      expect(setData.deleteFileFromStorage).toHaveBeenCalledWith(current.storagePath);
    });

    it('should delete an older version after the catalog write', async () => {
      stored = resumeBody(2);
      const older = versionAt(stored, 1);

      await writer.remove('resume', older);

      const parsed = parseCatalog('resume', stored);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) {
        return;
      }
      expect(parsed.catalog.versions).toHaveLength(1);
      expect(parsed.catalog.versions[0].id).not.toBe(older.id);
      expect(setData.deleteFileFromStorage).toHaveBeenCalledWith(older.storagePath);
    });
  });
});
