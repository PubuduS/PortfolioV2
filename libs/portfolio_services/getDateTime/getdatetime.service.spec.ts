import { TestBed } from '@angular/core/testing';

import { GetdatetimeService } from './getdatetime.service';

describe('GetdatetimeService', () => {
  let service: GetdatetimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetdatetimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
