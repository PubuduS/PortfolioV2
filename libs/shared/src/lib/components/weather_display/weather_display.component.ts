import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  inject,
} from '@angular/core';

import { IWeather } from '@portfolio-v2/state/dataModels';
import { WeatherService } from '@portfolio-v2/shared/services';

/**
 * Display weather component
 */
@Component({
  selector: 'portfolio-v2-weather-display',
  standalone: true,
  imports: [],
  templateUrl: './weather_display.component.html',
  styleUrl: './weather_display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherDisplayComponent {
  public weatherService = inject(WeatherService);

  public weatherData: Signal<IWeather | undefined> = this.weatherService.weatherData;
  public weatherErr: Signal<string | undefined> = this.weatherService.weatherError;
  public weatherIcon: Signal<string> = this.weatherService.weatherAnimationPath;
}
