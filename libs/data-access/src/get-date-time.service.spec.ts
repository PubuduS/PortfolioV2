import { GetDateTimeService } from './get-date-time.service';

describe('GetDateTimeService', () => {
  describe('getDate', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should format the current local date as US by default and UK when asked', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 0, 5, 15, 30, 0));
      const service = new GetDateTimeService();

      expect(service.getDate()).toBe('01/05/2026');
      expect(service.getDate('US')).toBe('01/05/2026');
      expect(service.getDate('UK')).toBe('05/01/2026');
      expect(service.getMonth()).toBe(1);
    });
  });

  describe('getYearsOfExperience', () => {
    const service = new GetDateTimeService();

    it('should return the span in years rounded to one decimal', () => {
      expect(service.getYearsOfExperience('2020-01-01', '2022-01-01')).toBe(2);
      expect(service.getYearsOfExperience('2023-06-01', '2023-12-01')).toBe(0.5);
    });

    it('should return the same span when the dates are reversed', () => {
      expect(service.getYearsOfExperience('2022-01-01', '2020-01-01')).toBe(2);
    });
  });

  describe('convertDateToISOString', () => {
    const service = new GetDateTimeService();

    it('should return the UTC calendar date', () => {
      expect(service.convertDateToISOString(new Date(Date.UTC(2023, 8, 3, 15)))).toBe('2023-09-03');
    });
  });

  describe('convertToISOFormat', () => {
    const service = new GetDateTimeService();

    it('should return an empty string when there is no date', () => {
      expect(service.convertToISOFormat('')).toBe('');
    });

    it('should keep a YYYY-MM-DD string, including one that is not a real calendar day', () => {
      expect(service.convertToISOFormat('2023-09-03')).toBe('2023-09-03');
      expect(service.convertToISOFormat('2023-02-31')).toBe('2023-02-31');
    });

    it('should convert M/D/YYYY into YYYY-MM-DD', () => {
      expect(service.convertToISOFormat('9/3/2023')).toBe('2023-09-03');
    });

    it('should use the local calendar date of a Date object', () => {
      expect(service.convertToISOFormat(new Date(2023, 8, 3))).toBe('2023-09-03');
    });

    it.each(['9/3', '2/31/2023', '13/1/2023'])('should reject %s', (value) => {
      expect(() => service.convertToISOFormat(value)).toThrow(Error);
    });
  });

  describe('convertISOToDate', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return null when there is no date', () => {
      const service = new GetDateTimeService();

      expect(service.convertISOToDate('')).toBeNull();
    });

    it('should return today when the value is present', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 0, 5, 15, 30, 0));
      const service = new GetDateTimeService();

      expect(service.convertISOToDate('present')).toEqual(new Date(2026, 0, 5, 15, 30, 0));
    });

    it('should return the local calendar date', () => {
      const service = new GetDateTimeService();

      expect(service.convertISOToDate('2023-09-05')).toEqual(new Date(2023, 8, 5));
    });

    it.each(['09/05/2023', '2023-9-5', '2023-02-31'])('should reject %s', (value) => {
      const service = new GetDateTimeService();

      expect(() => service.convertISOToDate(value)).toThrow(Error);
    });
  });
});
