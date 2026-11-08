import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { WeatherService } from './weather.service';

/** Environment the next service instance should read. */
const mockEnvironment: { current: { openWeatherAPIKey: string; emulators?: unknown } } = {
  current: { openWeatherAPIKey: 'test-key' },
};

jest.mock('@portfolio-v2/environment', () => ({
  get environment() {
    return mockEnvironment.current;
  },
}));

/** Forecast the emulator branch returns without calling OpenWeather. */
const emulatorForecast = {
  condition: 'Clear',
  description: 'clear sky',
  temprature: 72,
  humidity: 48,
  windSpeed: 8,
  iconCode: '01d',
};

/**
 * Build a service against the environment set for this test.
 * @returns the service and the HTTP test double
 */
function createService(): { service: WeatherService; http: HttpTestingController } {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  return {
    service: TestBed.inject(WeatherService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('WeatherService', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when the site talks to OpenWeather', () => {
    it('should map the forecast and its icon', () => {
      mockEnvironment.current = { openWeatherAPIKey: 'test-key' };
      const { service, http } = createService();

      const request = http.expectOne((candidate) => candidate.url.includes('openweathermap.org'));
      expect(request.request.url).toContain('lat=41.25716');
      expect(request.request.url).toContain('lon=-95.995102');
      expect(request.request.url).toContain('appid=test-key');
      expect(request.request.url).toContain('units=imperial');
      request.flush({
        weather: [{ main: 'Clouds', description: 'overcast clouds', icon: '04d' }],
        main: { temp: 61, humidity: 40 },
        wind: { speed: 9 },
      });

      expect(service.weatherData()).toEqual({
        condition: 'Clouds',
        description: 'overcast clouds',
        temprature: 61,
        humidity: 40,
        windSpeed: 9,
        iconCode: '04d',
      });
      expect(service.weatherError()).toBeUndefined();
      expect(service.weatherAnimationPath()).toBe('assets/images/weatherIcons/04d.svg');
      http.verify();
    });
  });

  describe('when the emulator key is present but empty', () => {
    it('should report the HTTP failure and use the default icon', () => {
      mockEnvironment.current = { openWeatherAPIKey: 'test-key', emulators: undefined };
      const { service, http } = createService();

      const request = http.expectOne((candidate) => candidate.url.includes('openweathermap.org'));
      request.flush('unavailable', { status: 503, statusText: 'Unavailable' });

      expect(service.weatherError()).toContain('503');
      expect(service.weatherAnimationPath()).toBe('assets/images/weatherIcons/01d.svg');
      http.verify();
    });
  });

  describe('when the local emulators are configured', () => {
    it('should show the canned forecast without an HTTP call', () => {
      mockEnvironment.current = {
        openWeatherAPIKey: 'test-key',
        emulators: { auth: { host: '127.0.0.1', port: 9099 } },
      };
      const { service, http } = createService();

      expect(service.weatherData()).toEqual(emulatorForecast);
      expect(service.weatherError()).toBeUndefined();
      expect(service.weatherAnimationPath()).toBe('assets/images/weatherIcons/01d.svg');
      http.verify();
    });
  });
});
