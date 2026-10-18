import { TestBed } from '@angular/core/testing';
import {
  getDownloadURL,
  ref,
  Storage,
  uploadBytes,
} from '@angular/fire/storage';
import { createSpyObj } from 'jest-createspyobj';
import {
  doc,
  Firestore,
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
  };
});

jest.mock('@angular/fire/storage', () => {
  const actual = jest.requireActual('@angular/fire/storage');
  return {
    ...actual,
    ref: jest.fn((_storage: unknown, path: string) => ({ path })),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
  };
});

const card: IPublication = {
  id: 1,
  title: 'ARWalker',
  subTitle: 'keywords',
  imageUrl: 'assets/images/publications/Researcher.jpeg',
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

      const url = await service.uploadFile('education/publications/publication-01/cover', file);

      expect(url).toBe('https://files.example/cover');
      expect(order).toEqual(['upload', 'url']);
      expect(ref).toHaveBeenCalledWith(mockStorage, 'education/publications/publication-01/cover');
      expect(uploadBytes).toHaveBeenCalledWith(
        { path: 'education/publications/publication-01/cover' },
        file,
      );
    });

    it('does not ask for a download URL when the upload fails', async () => {
      jest.mocked(uploadBytes).mockRejectedValue(new Error('network'));

      await expect(service.uploadFile(
        'education/publications/publication-01/cover',
        new File(['img'], 'cover.png', { type: 'image/png' }),
      )).rejects.toThrow('network');
      expect(getDownloadURL).not.toHaveBeenCalled();
    });
  });
});
