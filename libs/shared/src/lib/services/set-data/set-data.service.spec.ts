import { TestBed } from '@angular/core/testing';
import { Storage } from '@angular/fire/storage';
import { createSpyObj } from 'jest-createspyobj';
import { Firestore } from '@angular/fire/firestore';

import { SetDataService } from './set-data.service';

describe('SetDataService', () => {
  let service: SetDataService;
  let mockStorage: jest.Mocked<Storage>;
  let mockFireStore: jest.Mocked<Firestore>;

  beforeEach(() => {
    mockStorage = createSpyObj(Storage);
    mockFireStore = createSpyObj(Firestore);
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
});
