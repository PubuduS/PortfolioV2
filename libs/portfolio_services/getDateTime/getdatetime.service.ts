import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GetdatetimeService {

  private today: Date;
  private day: number;
  private month: number;
  private year: number;

  constructor() {
    this.today = new Date();
    this.day = this.today.getDate();
    // January is 0
    this.month = this.today.getMonth() + 1;
    this.year= this.today.getFullYear();
  }

  private formatDate(format: 'US' | 'UK'): string {

    let formattedDate: string;

    const day = this.day.toLocaleString().padStart(2, '0');
    
    const month = this.month.toLocaleString().padStart(2, '0');
    const year = this.year;

    const dateUSFormat = month + '/' + day + '/' + year;
    const dateUKFormat = day + '/' + month + '/' + year;

    if(format == 'UK') {
      formattedDate = dateUKFormat;
    }
    else {
      formattedDate = dateUSFormat;
    }

    return formattedDate;
  }

  public getDate(format: 'US' | 'UK' = 'US'): string {
    return this.formatDate(format);
  }

  public getMonth(): number {
    return this.month;
  }

  private calculateYearsOfExperience(startDate: Date, endDate: Date): number {

    let value: number = 1;
    if(startDate && endDate) {
      // considering leap years
      const millisecondsInYear = 1000 * 60 * 60 * 24 * 365.25;
      const differenceInMilliseconds = endDate.getTime() - startDate.getTime();
      const differenceInYears = differenceInMilliseconds / millisecondsInYear;
      
      const result = Math.abs((Math.round(differenceInYears * 10) / 10));
      value = result;
    }
    
    return value;
  }

  public getYearsOfExperience(startDate: Date, endDate: Date): number {
    return this.calculateYearsOfExperience(startDate, endDate);
  }
}
