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
}
