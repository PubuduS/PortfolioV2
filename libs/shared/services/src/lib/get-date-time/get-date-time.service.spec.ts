import { TestBed } from '@angular/core/testing';

import { GetDateTimeService } from './get-date-time.service';

describe('GetdatetimeService', () => {
  let service: GetDateTimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetDateTimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
