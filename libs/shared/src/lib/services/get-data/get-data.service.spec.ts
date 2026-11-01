import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { createSpyObj } from 'jest-createspyobj';
import {
  getBlob,
  ref,
  Storage,
} from '@angular/fire/storage';

import { GetDataService } from './get-data.service';

jest.mock('@angular/fire/storage', () => {
  const actual = jest.requireActual('@angular/fire/storage');
  return {
    ...actual,
    ref: jest.fn((_storage: unknown, path: string) => ({ path })),
    getBlob: jest.fn(),
  };
});

describe('GetdataService', () => {
  let service: GetDataService;
  let mockFirestore: jest.Mocked<Firestore>;
  let mockStorage: jest.Mocked<Storage>;

  beforeEach(() => {
    mockFirestore = createSpyObj(Firestore);
    mockStorage = createSpyObj(Storage);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Firestore,
          useValue: mockFirestore,
        },
        {
          provide: Storage,
          useValue: mockStorage,
        },
      ],
    });

    service = TestBed.inject(GetDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFileBytes', () => {
    it('should return the bytes from the stored blob', async () => {
      const bytes = new Uint8Array([1, 2, 3]).buffer;
      jest.mocked(getBlob).mockResolvedValue({
        arrayBuffer: () => Promise.resolve(bytes),
      } as Blob);

      const result = await service.getFileBytes('portfolio/documents/cover-letter/1730000000000-000001.docx');

      expect(result).toBe(bytes);
      expect(ref).toHaveBeenCalledWith(
        mockStorage,
        'portfolio/documents/cover-letter/1730000000000-000001.docx',
      );
      expect(getBlob).toHaveBeenCalledWith({
        path: 'portfolio/documents/cover-letter/1730000000000-000001.docx',
      });
    });

    it('should reject when storage cannot read the object', async () => {
      jest.mocked(getBlob).mockRejectedValue(new Error('object-not-found'));

      await expect(service.getFileBytes('portfolio/documents/resume/resume-1.pdf')).rejects.toThrow(
        'object-not-found',
      );
    });
  });
});
