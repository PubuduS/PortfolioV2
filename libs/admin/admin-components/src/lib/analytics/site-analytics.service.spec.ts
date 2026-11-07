import { TestBed } from '@angular/core/testing';
import {
  Functions,
  httpsCallable,
} from '@angular/fire/functions';
import { FirebaseError } from 'firebase/app';

import { SiteAnalyticsService } from './site-analytics.service';
import { SiteAnalyticsReport } from './site-analytics.types';

jest.mock('@angular/fire/functions', () => {
  const actual = jest.requireActual('@angular/fire/functions');
  return {
    ...actual,
    httpsCallable: jest.fn(),
  };
});

const report = {
  generatedAt: '2026-11-07T18:00:00.000Z',
  activeUsersNow: 3,
} as SiteAnalyticsReport;

describe('SiteAnalyticsService', () => {
  let service: SiteAnalyticsService;
  let fetchReport: jest.Mock;

  beforeEach(() => {
    fetchReport = jest.fn();
    (httpsCallable as jest.Mock).mockReturnValue(fetchReport);
    TestBed.configureTestingModule({
      providers: [
        { provide: Functions, useValue: {} },
      ],
    });
    service = TestBed.inject(SiteAnalyticsService);
  });

  it('should call getSiteAnalytics', () => {
    expect(httpsCallable).toHaveBeenCalledWith({}, 'getSiteAnalytics');
  });

  describe('when the function returns a report', () => {
    it('should return that report', async () => {
      fetchReport.mockResolvedValue({ data: report });

      await expect(service.load()).resolves.toBe(report);
      expect(fetchReport).toHaveBeenCalledWith({});
    });
  });

  describe('when the property is not configured', () => {
    it('should surface the function message', async () => {
      fetchReport.mockRejectedValue(new FirebaseError(
        'functions/failed-precondition',
        'Set GA4_PROPERTY_ID to the numeric Analytics property id.',
      ));

      await expect(service.load()).rejects.toThrow(
        'Set GA4_PROPERTY_ID to the numeric Analytics property id.',
      );
    });
  });

  describe('when the function fails', () => {
    it('should hide the transport error', async () => {
      fetchReport.mockRejectedValue(new Error('socket hang up'));

      await expect(service.load()).rejects.toThrow('Analytics could not be loaded.');
    });
  });
});
