import { createSpyObj } from 'jest-createspyobj';
import { of } from 'rxjs';

import {
  IPublication,
  IPublicationDetails,
  joinPublications,
  Publication,
  PublicationDraft,
  toPublicationDraft,
} from '@portfolio-v2/state/dataModels';
import {
  AuthService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import {
  PublicationWriteError,
  PublicationWriter,
} from './publication-writer.service';

/** Card document of a stored publication. */
const card: IPublication = {
  id: 1,
  title: 'ARWalker',
  subTitle: 'keywords',
  imageUrl: 'storage://portfolio/publications/publication-card-images/ID-01-Image.webp',
  shortDesc: 'summary',
  btnMoreDisable: true,
  btnDownloadDisable: true,
  downloadUrl: 'storage://portfolio/publications/papers/ID-01-Paper.pdf',
  downloadFileName: 'ARWalker',
};

/** Details document of a stored publication. */
const detail: IPublicationDetails = {
  id: 1,
  title: 'ARWalker: A Virtual Walking Companion Application',
  authors: 'Pubudu Wijesooriya',
  abstarct: ['First paragraph.', 'Second paragraph.'],
  citation: 'citation',
};

/**
 * @param overrides fields that differ from a new record with a cover file
 * @returns a draft the writer can save
 */
function draft(overrides: Parameters<typeof toPublicationDraft>[0] = {}): PublicationDraft {
  const cover = new File(['img'], 'cover.png', { type: 'image/png' });

  const result = toPublicationDraft({
    id: 4,
    mode: 'new',
    title: 'Card title',
    detailTitle: 'Full title',
    keywords: 'keywords',
    summary: 'summary',
    authors: 'Authors',
    abstractText: 'First paragraph.\n\nSecond paragraph.',
    citation: 'citation',
    cover,
    paper: null,
    fileName: '',
    ...overrides,
  });

  if (!result.ok) {
    throw new Error(result.reason);
  }

  return result.draft;
}

/**
 * @returns the storage-backed publication used for delete
 */
function storedPublication(): Publication {
  const [publication] = joinPublications([card], [detail]);
  return publication;
}

describe('PublicationWriter', () => {
  let setData: jest.Mocked<SetDataService>;
  let auth: jest.Mocked<AuthService>;
  let writer: PublicationWriter;

  beforeEach(() => {
    setData = createSpyObj(SetDataService);
    auth = createSpyObj(AuthService);

    setData.commit.mockResolvedValue(undefined);
    setData.uploadFile.mockResolvedValue('https://files.example/object');
    setData.deleteFileFromStorage.mockReturnValue(of('successfull'));
    auth.isUserLoggedIn.mockReturnValue(true);

    writer = new PublicationWriter(setData, auth);
  });

  describe('when nobody is signed in', () => {
    beforeEach(() => {
      auth.isUserLoggedIn.mockReturnValue(false);
    });

    it('does not upload or commit a save', async () => {
      await expect(writer.save(draft())).rejects.toBeInstanceOf(PublicationWriteError);
      await expect(writer.save(draft())).rejects.toMatchObject({ reason: 'unauthenticated' });
      expect(setData.uploadFile).not.toHaveBeenCalled();
      expect(setData.commit).not.toHaveBeenCalled();
    });

    it('does not delete documents or files', async () => {
      await expect(writer.remove(storedPublication())).rejects.toMatchObject({
        reason: 'unauthenticated',
      });
      expect(setData.commit).not.toHaveBeenCalled();
      expect(setData.deleteFileFromStorage).not.toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('uploads only files, at the fixed paths, then commits both documents', async () => {
      const paper = new File(['%PDF'], 'paper.pdf', { type: 'application/pdf' });
      setData.uploadFile
        .mockResolvedValueOnce('https://files.example/cover')
        .mockResolvedValueOnce('https://files.example/paper');

      const saved = await writer.save(draft({ paper, fileName: 'ARWalker' }));

      expect(setData.uploadFile).toHaveBeenNthCalledWith(
        1,
        'portfolio/publications/publication-card-images/ID-04-Image.webp',
        expect.any(File),
      );
      expect(setData.uploadFile).toHaveBeenNthCalledWith(
        2,
        'portfolio/publications/papers/ID-04-Paper.pdf',
        paper,
      );
      expect(setData.commit).toHaveBeenCalledTimes(1);
      expect(setData.commit).toHaveBeenCalledWith([
        {
          kind: 'set',
          path: 'publication-section/publication-04',
          value: expect.objectContaining({
            id: 4,
            title: 'Card title',
            imageUrl: 'https://files.example/cover',
            btnMoreDisable: false,
            btnDownloadDisable: false,
            downloadUrl: 'https://files.example/paper',
            downloadFileName: 'ARWalker',
          }),
        },
        {
          kind: 'set',
          path: 'publication-details-section/publication-04',
          value: expect.objectContaining({
            id: 4,
            title: 'Full title',
            abstarct: ['First paragraph.', 'Second paragraph.'],
          }),
        },
      ]);
      expect(saved.cover).toEqual({ source: 'storage', url: 'https://files.example/cover' });
    });

    it('does not upload an asset that is already stored', async () => {
      await writer.save(draft({
        mode: 'edit',
        cover: {
          source: 'storage',
          url: 'storage://portfolio/publications/publication-card-images/ID-04-Image.webp',
        },
      }));

      expect(setData.uploadFile).not.toHaveBeenCalled();
      expect(setData.commit).toHaveBeenCalledTimes(1);
    });

    it('does not commit when the upload fails', async () => {
      setData.uploadFile.mockRejectedValue(new Error('network'));

      await expect(writer.save(draft())).rejects.toMatchObject({ reason: 'upload-failed' });
      expect(setData.commit).not.toHaveBeenCalled();
    });

    it('reports a failed batch as commit-failed', async () => {
      setData.commit.mockRejectedValue(new Error('unavailable'));

      await expect(writer.save(draft({
        mode: 'edit',
        cover: { source: 'storage', url: 'https://files.example/cover' },
      }))).rejects.toMatchObject({ reason: 'commit-failed' });
    });
  });

  describe('remove', () => {
    it('deletes both documents before storage, and ignores a missing object', async () => {
      const order: string[] = [];
      setData.commit.mockImplementation(async () => {
        order.push('commit');
      });
      setData.deleteFileFromStorage.mockImplementation(() => {
        order.push('storage');
        return of('error FirebaseError: storage/object-not-found');
      });

      await writer.remove(storedPublication());

      expect(order[0]).toBe('commit');
      expect(order.filter((step) => step === 'storage')).toHaveLength(2);
      expect(setData.commit).toHaveBeenCalledWith([
        { kind: 'delete', path: 'publication-section/publication-01' },
        { kind: 'delete', path: 'publication-details-section/publication-01' },
      ]);
      expect(setData.deleteFileFromStorage).toHaveBeenCalledWith(
        'portfolio/publications/publication-card-images/ID-01-Image.webp',
      );
      expect(setData.deleteFileFromStorage).toHaveBeenCalledWith(
        'portfolio/publications/papers/ID-01-Paper.pdf',
      );
    });

    it('does not delete bundled files', async () => {
      const [publication] = joinPublications([{
        ...card,
        imageUrl: 'assets/images/publications/Researcher.jpeg',
        downloadUrl: 'assets/PDFs/Publications/ARWalker.pdf',
      }], [detail]);

      await writer.remove(publication);

      expect(setData.deleteFileFromStorage).not.toHaveBeenCalled();
      expect(setData.commit).toHaveBeenCalledTimes(1);
    });

    it('does not delete storage when the document batch fails', async () => {
      setData.commit.mockRejectedValue(new Error('unavailable'));

      await expect(writer.remove(storedPublication())).rejects.toMatchObject({
        reason: 'commit-failed',
      });
      expect(setData.deleteFileFromStorage).not.toHaveBeenCalled();
    });
  });
});
