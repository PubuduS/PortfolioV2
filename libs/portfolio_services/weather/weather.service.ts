import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { IWeather } from '../../interfaces';
import { IResult } from '../../interfaces';
import { ErrorService } from '../../portfolio_services/errorMsg/error.service';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private http = inject(HttpClient);
  private errService = inject(ErrorService);
  private readonly latitude: number = 41.257160;
  private readonly longitude: number = -95.995102;
  private readonly apiKey: string = 'd686291342bdd228fd2e1801a7800ff1';
  private readonly openweatherURL: string = `https://api.openweathermap.org/data/2.5/weather?lat=${this.latitude}&lon=${this.longitude}&appid=${this.apiKey}&units=imperial`;

  private readonly weatherIconBasePath: string = 'assets/images/weatherIcons/';
  private readonly iconExtention: string = '.svg';

  public weatherData: Signal<IWeather | undefined> = computed(() => this.weatherForcast().data);
  public weatherError: Signal<string | undefined> = computed(() => this.weatherForcast().error);

  public weatherAnimationPath = computed(() => {
    return `${this.weatherIconBasePath}` + ( this.weatherData()?.iconCode ?? '01d' ) + `${this.iconExtention}`;
  });

  private weatherData$: Observable<IResult<IWeather>> = this.http.get<any>(this.openweatherURL)
  .pipe(
    tap( p => console.log(p)),
    map( p => ({data: {
      condition: p.weather[0].main,
      description: p.weather[0].description,
      temprature: p.main.temp,
      humidity: p.main.humidity,
      windSpeed: p.wind.speed,
      iconCode: p.weather[0].icon
    }} as IResult<IWeather>) ),
    tap( p => console.log(p)),
    catchError(err => of({
      data: {},
      error: this.errService.formatHttpError(err)
    } as IResult<IWeather>))  
  );

  private weatherForcast = toSignal(this.weatherData$, {
    initialValue: (  { data: {} } as IResult<IWeather> )
  });


}
