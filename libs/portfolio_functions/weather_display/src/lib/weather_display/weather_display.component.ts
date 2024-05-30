import { ChangeDetectionStrategy, Component, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService } from '@portfolio-v2/services';
import { IWeather } from '@portfolio-v2/interfaces';

@Component({
  selector: 'portfolio-v2-weather-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather_display.component.html',
  styleUrl: './weather_display.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherDisplayComponent {
  weatherService = inject(WeatherService);

  weatherData: Signal<IWeather | undefined> = this.weatherService.weatherData;
  weatherErr: Signal<string | undefined> = this.weatherService.weatherError;
  weatherIcon: Signal<string> = this.weatherService.weatherAnimationPath;
}
