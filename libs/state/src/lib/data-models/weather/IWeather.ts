export interface IWeather {
  condition: string,
  description: string,
  temprature: number,
  humidity: number,
  windSpeed: number,
  iconCode?: string
}

export interface Weather {
  main: string;
  description: string;
  icon: string;
}

export interface Main {
  temp: number;
  humidity: number;
}

export interface Wind {
  speed: number;
}

export interface OpenWeatherResponse {
  weather: Weather[];
  main: Main;
  wind: Wind;
}
