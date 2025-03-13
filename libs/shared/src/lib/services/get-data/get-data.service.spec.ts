import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { createSpyObj } from 'jest-createspyobj';
import { Storage } from '@angular/fire/storage';

import { GetDataService } from './get-data.service';

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
});
