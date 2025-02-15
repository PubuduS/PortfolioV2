import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { WeatherService } from '@portfolio-v2/services';
import { IWeather } from '@portfolio-v2/interfaces';

/**
 * Display weather component
 */
@Component({
  selector: 'portfolio-v2-weather-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather_display.component.html',
  styleUrl: './weather_display.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherDisplayComponent {
  public weatherService = inject(WeatherService);

  public weatherData: Signal<IWeather | undefined> = this.weatherService.weatherData;
  public weatherErr: Signal<string | undefined> = this.weatherService.weatherError;
  public weatherIcon: Signal<string> = this.weatherService.weatherAnimationPath;
}
