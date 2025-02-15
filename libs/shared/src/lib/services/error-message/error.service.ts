import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

/**
 * Error format service
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  /**
   * Format http error response
   * @param err error response
   * @returns formatted error response
   */
  public formatHttpError(err: HttpErrorResponse): string {
    return this.httpErrorFormatter(err);
  }

  /**
   * Helper to format http error response
   * @param err error response
   * @returns formatted error response
   */
  private httpErrorFormatter(err: HttpErrorResponse): string {
    let errorMessage = '';
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      errorMessage = `Server returned code: ${err.status}, error message is: ${err.message}`;
    }
    return errorMessage;
  }
}
