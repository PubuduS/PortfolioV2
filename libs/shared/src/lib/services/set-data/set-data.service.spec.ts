import { TestBed } from '@angular/core/testing';
import {
  getDownloadURL,
  ref,
  Storage,
  uploadBytes,
  uploadBytesResumable,
} from '@angular/fire/storage';
import { createSpyObj } from 'jest-createspyobj';
import {
  doc,
  Firestore,
  runTransaction,
  writeBatch,
} from '@angular/fire/firestore';

import { IPublication } from '@portfolio-v2/state/dataModels';
import { SetDataService } from './set-data.service';

jest.mock('@angular/fire/firestore', () => {
  const actual = jest.requireActual('@angular/fire/firestore');
  return {
    ...actual,
    doc: jest.fn((_firestore: unknown, path: string) => ({ path })),
    writeBatch: jest.fn(),
    runTransaction: jest.fn(),
  };
});

jest.mock('@angular/fire/storage', () => {
  const actual = jest.requireActual('@angular/fire/storage');
  return {
    ...actual,
    ref: jest.fn((_storage: unknown, path: string) => ({ path })),
    uploadBytes: jest.fn(),
    uploadBytesResumable: jest.fn(),
    getDownloadURL: jest.fn(),
  };
});

const card: IPublication = {
  id: 1,
  title: 'ARWalker',
  subTitle: 'keywords',
  imageUrl: 'storage://portfolio/publications/publication-card-images/ID-01-Image.webp',
  shortDesc: 'summary',
  btnMoreDisable: false,
  btnDownloadDisable: false,
  downloadFileName: 'ARWalker',
};

describe('SetDataService', () => {
  let service: SetDataService;
  let mockStorage: jest.Mocked<Storage>;
  let mockFireStore: jest.Mocked<Firestore>;
  let batch: {
    set: jest.Mock;
    delete: jest.Mock;
    commit: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = createSpyObj(Storage);
    mockFireStore = createSpyObj(Firestore);
    batch = {
      set: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };
    jest.mocked(writeBatch).mockReturnValue(batch as never);
    jest.mocked(uploadBytes).mockResolvedValue({} as never);
    jest.mocked(getDownloadURL).mockResolvedValue('https://files.example/cover');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Storage,
          useValue: mockStorage,
        },
        {
          provide: Firestore,
          useValue: mockFireStore,
        },
      ],
    });
    service = TestBed.inject(SetDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('commit', () => {
    it('sets and deletes documents in one batch', async () => {
      await service.commit([
        { kind: 'set', path: 'publication-section/publication-01', value: card },
        { kind: 'delete', path: 'publication-details-section/publication-09' },
      ]);

      expect(writeBatch).toHaveBeenCalledWith(mockFireStore);
      expect(doc).toHaveBeenCalledWith(mockFireStore, 'publication-section/publication-01');
      expect(batch.set).toHaveBeenCalledWith(
        { path: 'publication-section/publication-01' },
        card,
      );
      expect(batch.delete).toHaveBeenCalledWith({
        path: 'publication-details-section/publication-09',
      });
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it('rejects when the batch commit fails and does not hide the error', async () => {
      batch.commit.mockRejectedValue(new Error('unavailable'));

      await expect(service.commit([
        { kind: 'delete', path: 'publication-section/publication-01' },
      ])).rejects.toThrow('unavailable');
    });
  });

  describe('uploadFile', () => {
    it('returns the download URL only after the upload resolves', async () => {
      const order: string[] = [];
      const file = new File(['img'], 'cover.png', { type: 'image/png' });
      jest.mocked(uploadBytes).mockImplementation(async () => {
        order.push('upload');
        return {} as never;
      });
      jest.mocked(getDownloadURL).mockImplementation(async () => {
        order.push('url');
        return 'https://files.example/cover';
      });

      const url = await service.uploadFile(
        'portfolio/publications/publication-card-images/ID-01-Image.webp',
        file,
      );

      expect(url).toBe('https://files.example/cover');
      expect(order).toEqual(['upload', 'url']);
      expect(ref).toHaveBeenCalledWith(
        mockStorage,
        'portfolio/publications/publication-card-images/ID-01-Image.webp',
      );
      expect(uploadBytes).toHaveBeenCalledWith(
        { path: 'portfolio/publications/publication-card-images/ID-01-Image.webp' },
        file,
      );
    });

    it('does not ask for a download URL when the upload fails', async () => {
      jest.mocked(uploadBytes).mockRejectedValue(new Error('network'));

      await expect(service.uploadFile(
        'portfolio/publications/publication-card-images/ID-01-Image.webp',
        new File(['img'], 'cover.png', { type: 'image/png' }),
      )).rejects.toThrow('network');
      expect(getDownloadURL).not.toHaveBeenCalled();
    });
  });

  describe('transact', () => {
    /**
     * @param data snapshot body, or undefined when the document is missing
     * @returns the transaction double runTransaction will hand to the recipe
     */
    function transactionFor(data: unknown): { get: jest.Mock; set: jest.Mock } {
      return {
        get: jest.fn().mockResolvedValue({ data: () => data }),
        set: jest.fn(),
      };
    }

    it('should pass the snapshot data and write the recipe body', async () => {
      const transaction = transactionFor({ versions: [] });
      jest.mocked(runTransaction).mockImplementation(
        async (_firestore, update) => update(transaction as never),
      );

      const result = await service.transact('document-versions/resume', (current) => ({
        next: { versions: [{ id: '1730000000000-000001' }] },
        result: current,
      }));

      expect(result).toEqual({ versions: [] });
      expect(doc).toHaveBeenCalledWith(mockFireStore, 'document-versions/resume');
      expect(transaction.get).toHaveBeenCalledWith({ path: 'document-versions/resume' });
      expect(transaction.set).toHaveBeenCalledWith(
        { path: 'document-versions/resume' },
        { versions: [{ id: '1730000000000-000001' }] },
      );
    });

    it('should write nothing when the recipe next value is null', async () => {
      const transaction = transactionFor(undefined);
      jest.mocked(runTransaction).mockImplementation(
        async (_firestore, update) => update(transaction as never),
      );

      const result = await service.transact('document-versions/resume', () => ({
        next: null,
        result: 'kept',
      }));

      expect(result).toBe('kept');
      expect(transaction.set).not.toHaveBeenCalled();
    });

    it('should pass undefined when the document is missing', async () => {
      const transaction = transactionFor(undefined);
      jest.mocked(runTransaction).mockImplementation(
        async (_firestore, update) => update(transaction as never),
      );
      const seen: unknown[] = [];

      await service.transact('document-versions/cover-letter', (current) => {
        seen.push(current);
        return { next: null, result: 'empty' };
      });

      expect(seen).toEqual([undefined]);
    });
  });

  describe('pushFileToStorage', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    /**
     * Stub fetch and the resumable upload task.
     * @param notify Calls the upload callbacks.
     */
    function stubUpload(
      notify: (
        progress: (snapshot: { bytesTransferred: number; totalBytes: number }) => void,
        failed: (error: Error) => void,
        finished: () => void,
      ) => void,
    ): void {
      global.fetch = jest.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['bytes'])),
      }) as typeof fetch;
      jest.mocked(uploadBytesResumable).mockReturnValue({
        on: (
          _event: string,
          progress: (snapshot: { bytesTransferred: number; totalBytes: number }) => void,
          failed: (error: Error) => void,
          finished: () => void,
        ) => notify(progress, failed, finished),
      } as never);
    }

    it('should reset progress and resolve when the upload finishes', async () => {
      service['progressValue'] = 100;
      service['isUploadCompleted'] = true;
      stubUpload((progress, _failed, finished) => {
        progress({ bytesTransferred: 80, totalBytes: 80 });
        finished();
      });

      const pending = service.pushFileToStorage('portfolio/file.webp', 'blob:file');
      expect(service.getProgressValue()).toBe(0);
      expect(service.getUploadCompleteState()).toBe(false);

      await pending;

      expect(service.getProgressValue()).toBe(100);
      expect(service.getUploadCompleteState()).toBe(true);
      expect(ref).toHaveBeenCalledWith(mockStorage, 'portfolio/file.webp');
    });

    it('should reject when the upload fails', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      stubUpload((_progress, failed) => {
        failed(new Error('quota'));
      });

      await expect(
        service.pushFileToStorage('portfolio/file.webp', 'blob:file'),
      ).rejects.toThrow('quota');
    });
  });
});
