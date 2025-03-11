import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  Signal,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Observable,
  catchError,
  map,
  of,
  tap,
} from 'rxjs';

import {
  IWeather,
  IResult,
  OpenWeatherResponse,
} from '@portfolio-v2/state/dataModels';
import { environment } from '@portfolio-v2/environment';
import { ErrorService } from '../error-message/error.service';

/**
 * Get weather service
 */
@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  /** HTTP client */
  private http = inject(HttpClient);

  /** Error service */
  private errService = inject(ErrorService);

  /** Latitude */
  private readonly latitude: number = 41.257160;

  /** Longitude */
  private readonly longitude: number = -95.995102;

  /** API Key */
  private readonly apiKey: string = environment.openWeatherAPIKey;

  /** Open Weather URL */
  private readonly openweatherURL: string = `https://api.openweathermap.org/data/2.5/weather?lat=${this.latitude}&lon=${this.longitude}&appid=${this.apiKey}&units=imperial`;

  /** Weather icon base path */
  private readonly weatherIconBasePath: string = 'assets/images/weatherIcons/';

  /** Icon extention */
  private readonly iconExtention: string = '.svg';

  /** Weather data */
  public weatherData: Signal<IWeather | undefined> = computed(() => this.weatherForcast().data);

  /** Weather error */
  public weatherError: Signal<string | undefined> = computed(() => this.weatherForcast().error);

  /** Weather animation path */ public weatherAnimationPath = computed(() => `${this.weatherIconBasePath}${this.weatherData()?.iconCode ?? '01d'}${this.iconExtention}`);

  /** Weather data observable */
  private weatherData$: Observable<IResult<IWeather>>
    = this.http.get<OpenWeatherResponse>(this.openweatherURL)
      .pipe(
        tap((p) => console.log(p)),
        map((p) => ({
          data: {
            condition: p.weather[0].main,
            description: p.weather[0].description,
            temprature: p.main.temp,
            humidity: p.main.humidity,
            windSpeed: p.wind.speed,
            iconCode: p.weather[0].icon,
          },
        } as IResult<IWeather>)),
        tap((p) => console.log(p)),
        catchError((err) => of({
          data: {},
          error: this.errService.formatHttpError(err),
        } as IResult<IWeather>)),
      );

  /** Weather forcast */
  private weatherForcast = toSignal(this.weatherData$, {
    initialValue: ({ data: {} } as IResult<IWeather>),
  });
}
