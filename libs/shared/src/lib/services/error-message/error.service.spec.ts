import { HttpErrorResponse } from '@angular/common/http';

import { ErrorService } from './error.service';

describe('ErrorService', () => {
  const service = new ErrorService();

  describe('when the browser reports a client or network error', () => {
    it('should include the browser message', () => {
      const error = new HttpErrorResponse({
        error: new ErrorEvent('error', { message: 'offline' }),
        status: 0,
      });

      expect(service.formatHttpError(error)).toBe('An error occurred: offline');
    });
  });

  describe('when the server returns an error status', () => {
    it('should include the status code and the response message', () => {
      const error = new HttpErrorResponse({
        status: 503,
        statusText: 'Service Unavailable',
        url: '/weather',
      });

      expect(service.formatHttpError(error)).toBe(
        `Server returned code: 503, error message is: ${error.message}`,
      );
    });
  });
});
