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
  templateUrl: './weather-display.component.html',
  styleUrl: './weather-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherDisplayComponent {
  /** Service that loads the current forecast. */
  public weatherService = inject(WeatherService);

  /** Latest forecast, once the request succeeds. */
  public weatherData: Signal<IWeather | undefined> = this.weatherService.weatherData;
  /** Message shown when the forecast request fails. */
  public weatherErr: Signal<string | undefined> = this.weatherService.weatherError;
  /** Path of the animation for the current condition. */
  public weatherIcon: Signal<string> = this.weatherService.weatherAnimationPath;
}
