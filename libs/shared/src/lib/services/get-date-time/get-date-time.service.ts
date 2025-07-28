import { Injectable } from '@angular/core';

/**
 * Get date time service
 */
@Injectable({
  providedIn: 'root',
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
    this.year = this.today.getFullYear();
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
    const { year } = this;

    const dateUSFormat = `${month}/${day}/${year}`;
    const dateUKFormat = `${day}/${month}/${year}`;

    if (format === 'UK') {
      formattedDate = dateUKFormat;
    } else {
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
    let value = 1;
    if (startDate && endDate) {
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
  public getYearsOfExperience(startDate: string, endDate: string): number {
    return this.calculateYearsOfExperience(new Date(startDate), new Date(endDate));
  }

  /**
   * Convert date to ISO string
   * @param date date
   * @returns ISO string
   */
  public convertDateToISOString(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  /**
   * Convert date to ISO format "YYYY-MM-DD"
   * @param dateInput date string in format "M/D/YYYY" (e.g., "9/3/2023") or Date object
   * @returns ISO formatted date string "YYYY-MM-DD" (e.g., "2023-09-03")
   */
  public convertToISOFormat(dateInput: string | Date): string {
    if (!dateInput) {
      return '';
    }

    let date: Date;

    if (dateInput instanceof Date) {
      // If it's already a Date object, extract the local date components
      // to avoid timezone issues
      const year = dateInput.getFullYear();
      const month = dateInput.getMonth() + 1; // getMonth() returns 0-11
      const day = dateInput.getDate();

      // Create a new date object using local components to ensure no timezone shift
      date = new Date(year, month - 1, day);
    } else if (typeof dateInput === 'string') {
      // If it's a string, check if it's already in ISO format
      if (this.isISOFormat(dateInput)) {
        // Already in ISO format, return as-is
        return dateInput;
      }

      // If it's a string in M/D/YYYY format, parse it
      const parts = dateInput.split('/');
      if (parts.length !== 3) {
        throw new Error(`Invalid date format: ${dateInput}. Expected format: M/D/YYYY or YYYY-MM-DD`);
      }

      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      // Validate the date
      date = new Date(year, month - 1, day); // month is 0-indexed
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        throw new Error(`Invalid date: ${dateInput}`);
      }
    } else {
      throw new Error(`Invalid date input type: ${typeof dateInput}`);
    }

    // Format as YYYY-MM-DD using the date object
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() returns 0-11
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Convert ISO format date string to Date object for date picker
   * @param isoDateString date string in ISO format "YYYY-MM-DD" (e.g., "2023-09-05")
   * @returns Date object that will display correctly in date picker
   */
  public convertISOToDate(isoDateString: string): Date | null {
    if (!isoDateString) {
      return null;
    }

    if (isoDateString === 'present') {
      return new Date();
    }

    // Check if it's already in ISO format
    if (!this.isISOFormat(isoDateString)) {
      throw new Error(`Invalid ISO date format: ${isoDateString}. Expected format: YYYY-MM-DD`);
    }

    // Parse the ISO date string
    const parts = isoDateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Create a date object using local timezone to avoid timezone conversion issues
    const date = new Date(year, month - 1, day); // month is 0-indexed

    // Validate the date
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      throw new Error(`Invalid date: ${isoDateString}`);
    }

    return date;
  }

  /**
   * Check if the date string is in ISO format
   * @param dateString date string
   * @returns true if the date string is in ISO format, false otherwise
   */
  private isISOFormat(dateString: string): boolean {
    return !!dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  }
}
