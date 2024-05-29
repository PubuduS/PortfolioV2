import { TestBed } from '@angular/core/testing';

import { WeatherService } from './weather.service';
import { HttpClientModule } from '@angular/common/http';

describe('WeatherInfoService', () => {
  let service: WeatherService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule]
    });
    service = TestBed.inject(WeatherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
