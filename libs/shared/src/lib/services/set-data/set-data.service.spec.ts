import { TestBed } from '@angular/core/testing';
import { Storage } from '@angular/fire/storage';
import { createSpyObj } from 'jest-createspyobj';

import { SetDataService } from './set-data.service';

describe('SetDataService', () => {
  let service: SetDataService;
  let mockStorage: jest.Mocked<Storage>;

  beforeEach(() => {
    mockStorage = createSpyObj(Storage);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Storage,
          useValue: mockStorage,
        },
      ],
    });
    service = TestBed.inject(SetDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
