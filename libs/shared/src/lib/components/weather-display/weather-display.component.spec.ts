import { signal } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { createSpyObj } from 'jest-createspyobj';

import { IWeather } from '@portfolio-v2/state/dataModels';
import { WeatherService } from '@portfolio-v2/shared/services';
import { WeatherDisplayComponent } from './weather-display.component';

/** Forecast the panel shows for Omaha. */
const forecast: IWeather = {
  condition: 'Clear',
  description: 'clear sky',
  temprature: 72,
  humidity: 48,
  windSpeed: 8,
  iconCode: '01d',
};

describe('WeatherDisplayComponent', () => {
  let fixture: ComponentFixture<WeatherDisplayComponent>;
  let weather: jest.Mocked<WeatherService>;

  /**
   * @param error message that hides the panel, when the request failed
   */
  async function open(error?: string): Promise<void> {
    weather = createSpyObj(WeatherService);
    weather.weatherData = signal(error ? undefined : forecast);
    weather.weatherError = signal(error);
    weather.weatherAnimationPath = signal('assets/images/weatherIcons/01d.svg');

    await TestBed.configureTestingModule({
      imports: [WeatherDisplayComponent],
      providers: [{ provide: WeatherService, useValue: weather }],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherDisplayComponent);
    fixture.detectChanges();
  }

  describe('when the forecast arrives', () => {
    beforeEach(async () => {
      await open();
    });

    it('should show the Omaha readings and the condition icon', () => {
      const text = fixture.nativeElement.textContent;
      const icon = fixture.nativeElement.querySelector('.weatherAnim');

      expect(text).toContain('In Omaha');
      expect(text).toContain('72');
      expect(text).toContain('8');
      expect(text).toContain('48');
      expect(text).toContain('clear sky');
      expect(icon.getAttribute('src')).toBe('assets/images/weatherIcons/01d.svg');
    });
  });

  describe('when the forecast request fails', () => {
    beforeEach(async () => {
      await open('Weather is unavailable');
    });

    it('should hide the panel', () => {
      expect(fixture.nativeElement.querySelector('.weather-panel')).toBeNull();
    });
  });
});
