/** Weather shown on the public site. */
export interface IWeather {
  /** Short condition name, such as Clouds. */
  condition: string,
  /** Longer condition text from the forecast. */
  description: string,
  /** Temperature in the units the service requested. */
  temprature: number,
  /** Relative humidity as a percent. */
  humidity: number,
  /** Wind speed in the units the service requested. */
  windSpeed: number,
  /** OpenWeather icon code used to pick an animation. */
  iconCode?: string
}

/** One weather entry inside an OpenWeather response. */
export interface Weather {
  /** Short condition name. */
  main: string;
  /** Longer condition text. */
  description: string;
  /** OpenWeather icon code. */
  icon: string;
}

/** Temperature block inside an OpenWeather response. */
export interface Main {
  /** Temperature in the requested units. */
  temp: number;
  /** Relative humidity as a percent. */
  humidity: number;
}

/** Wind block inside an OpenWeather response. */
export interface Wind {
  /** Wind speed in the requested units. */
  speed: number;
}

/** Subset of an OpenWeather current-weather response this app reads. */
export interface OpenWeatherResponse {
  /** Condition entries. The first entry is the one shown. */
  weather: Weather[];
  /** Temperature and humidity. */
  main: Main;
  /** Wind reading. */
  wind: Wind;
}
