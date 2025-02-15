import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { WeatherService } from './weather.service';

describe('WeatherInfoService', () => {
  let service: WeatherService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
    });
    service = TestBed.inject(WeatherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
