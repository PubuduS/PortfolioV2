import { TestBed } from '@angular/core/testing';
import {
  collection,
  collectionData,
  Firestore,
  orderBy,
  query,
} from '@angular/fire/firestore';
import { createSpyObj } from 'jest-createspyobj';
import {
firstValueFrom,
of
} from 'rxjs'
import {
  getBlob,
  getDownloadURL,
  ref,
  Storage,
} from '@angular/fire/storage';

import { IExperience } from '@portfolio-v2/state/dataModels';
import { GetDateTimeService } from './get-date-time.service';
import { GetDataService } from './get-data.service';

jest.mock('@angular/fire/firestore', () => {
  const actual = jest.requireActual('@angular/fire/firestore');
  return {
    ...actual,
    collection: jest.fn((_firestore: unknown, path: string) => ({ path })),
    query: jest.fn((source: unknown, constraint: unknown) => ({ source, constraint })),
    orderBy: jest.fn((field: string, direction?: string) => ({ field, direction })),
    collectionData: jest.fn(),
  };
});

jest.mock('@angular/fire/storage', () => {
  const actual = jest.requireActual('@angular/fire/storage');
  return {
    ...actual,
    ref: jest.fn((_storage: unknown, path: string) => ({ path })),
    getBlob: jest.fn(),
    getDownloadURL: jest.fn(),
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

  describe('when a collection is read', () => {
    const aboutMe = {
      id: 1,
      imageSrc: 'photo.webp',
      intro: ['Hello'],
      subHeadingIntro: 'Hi',
      leftPoints: ['One'],
      rightPoints: ['Two'],
    };

    it('should return the first row in ascending id order', async () => {
      jest.mocked(collectionData).mockReturnValue(of([aboutMe, { ...aboutMe, id: 2 }]));

      const row = await firstValueFrom(service.getData('about-me'));

      expect(row).toEqual(aboutMe);
      expect(collection).toHaveBeenCalledWith(mockFirestore, 'about-me');
      expect(query).toHaveBeenCalled();
      expect(orderBy).toHaveBeenCalledWith('id');
    });

    it('should return the first row in descending id order', async () => {
      jest.mocked(collectionData).mockReturnValue(of([{ ...aboutMe, id: 2 }]));

      const row = await firstValueFrom(service.getData('about-me', false));

      expect(row).toEqual({ ...aboutMe, id: 2 });
      expect(orderBy).toHaveBeenCalledWith('id', 'desc');
    });

    it('should return every row in either order', async () => {
      const rows = [aboutMe, { ...aboutMe, id: 2 }];
      jest.mocked(collectionData).mockReturnValue(of(rows));

      await expect(firstValueFrom(service.getDataArray('skills'))).resolves.toBe(rows);
      expect(orderBy).toHaveBeenCalledWith('id');

      await expect(firstValueFrom(service.getDataArray('skills', false))).resolves.toBe(rows);
      expect(orderBy).toHaveBeenCalledWith('id', 'desc');
    });
  });

  describe('when experience rows are read', () => {
    it('should replace a present end date and keep a stored date', async () => {
      const present: IExperience = {
        id: 2,
        position: 'Engineer',
        employer: 'Acme',
        timePeriod: '2024 - present',
        shortDescription: 'Current',
        points: ['Shipped'],
        startDate: '2024-01-01',
        endDate: 'present',
      };
      const previous: IExperience = {
        ...present,
        id: 1,
        endDate: '2020-01-01',
      };
      jest.mocked(collectionData).mockReturnValue(of([present, previous]));
      const today = TestBed.inject(GetDateTimeService).convertDateToISOString(new Date());

      const rows = await firstValueFrom(service.getExperienceSectionData('experience-section'));

      expect(rows[0].endDate).toBe(today);
      expect(rows[0].timePeriod).toBe(`2024 - ${today.slice(0, 4)}`);
      expect(rows[1].endDate).toBe('2020-01-01');
      expect(rows[1].timePeriod).toBe('2024 - present');
      expect(orderBy).toHaveBeenCalledWith('id', 'desc');
    });
  });

  describe('when a photo url is requested', () => {
    it('should return the storage download url', async () => {
      jest.mocked(getDownloadURL).mockResolvedValue('https://cdn.example/photo.webp');

      const url = await firstValueFrom(service.getPhotoURL('photos/me.webp'));

      expect(url).toBe('https://cdn.example/photo.webp');
      expect(ref).toHaveBeenCalledWith(mockStorage, 'photos/me.webp');
      expect(getDownloadURL).toHaveBeenCalledWith({ path: 'photos/me.webp' });
    });
  });
});
