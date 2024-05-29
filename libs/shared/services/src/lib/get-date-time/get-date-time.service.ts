import { Injectable } from '@angular/core';

/**
 * Get date time service
 */
@Injectable({
  providedIn: 'root'
})
export class GetDateTimeService {

  /** Today's date */
  private today: Date;

  /** Day */
  private day: number;

  /** Month */
  private month: number;

  /** Year */
  private year: number;

  /**
   * @inheritdoc
   */
  constructor() {
    this.today = new Date();
    this.day = this.today.getDate();
    const monthOffset = 1;
    // January is 0
    this.month = this.today.getMonth() + monthOffset;
    this.year= this.today.getFullYear();
  }

  /**
   * Format Date in US or UK format
   * @param format US or UK format selection
   * @returns formatted date
   */
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

  /**
   * Geter for date
   * @param format date format US or UK. Default is US date format.
   * @returns formatted date string
   */
  public getDate(format: 'US' | 'UK' = 'US'): string {
    return this.formatDate(format);
  }

  /**
   * Getter for month
   * @returns month
   */
  public getMonth(): number {
    return this.month;
  }

  /**
   * Helper to calculate years of experience
   * @param startDate start date
   * @param endDate end date
   * @returns Number of years of experience
   */
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

  /**
   * Get years of experience
   * @param startDate start date
   * @param endDate end date
   * @returns Number of years of experience
   */
  public getYearsOfExperience(startDate: Date, endDate: Date): number {
    return this.calculateYearsOfExperience(startDate, endDate);
  }
}
