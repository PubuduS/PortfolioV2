export interface IWeather {
    condition: string,
    description: string,
    temprature: number,
    humidity: number,
    windSpeed: number,
    iconCode?: string
}