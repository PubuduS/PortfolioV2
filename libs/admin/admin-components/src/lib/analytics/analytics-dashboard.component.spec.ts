import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { createSpyObj } from 'jest-createspyobj';

import { AnalyticsDashboardComponent } from './analytics-dashboard.component';
import { SiteAnalyticsService } from './site-analytics.service';
import { SiteAnalyticsReport } from './site-analytics.types';

function sampleReport(): SiteAnalyticsReport {
  return {
    generatedAt: '2026-11-07T18:00:00.000Z',
    realtimeLabel: 'Last 30 minutes',
    rangeLabel: 'Last 28 days',
    comparisonLabel: 'Previous 28 days',
    activeUsersNow: 3,
    usersToday: 4,
    usersLast7Days: 11,
    usersLast28Days: 28,
    engagementRate: 0.625,
    trend: [
      { date: '20261011', users: 1, pageViews: 2 },
      { date: '20261107', users: 4, pageViews: 9 },
    ],
    sections: [
      {
        label: 'About Me',
        path: '/content/aboutme',
        pageViews: 10,
        previousPageViews: 5,
      },
      {
        label: 'Contact',
        path: '/content/contact',
        pageViews: 2,
        previousPageViews: 0,
      },
    ],
    landingPages: [{ label: '/home', count: 8 }],
    sources: [{ label: 'google / organic', count: 6 }],
    countries: [{ label: 'United States', count: 9 }],
    devices: [{ label: 'Desktop', count: 7 }],
    browsers: [{ label: 'Chrome', count: 12 }],
    browserVersions: [{ label: 'Chrome 146.0.7680.178', count: 4 }],
    operatingSystems: [{ label: 'Windows 11', count: 5 }],
    mobileDevices: [{ label: 'iPhone 15', count: 2 }],
    screenResolutions: [{ label: '1920x1080', count: 3 }],
    languages: [{ label: 'English', count: 14 }],
    misses: [{ label: '/missing-page', count: 2 }],
  };
}

describe('AnalyticsDashboardComponent', () => {
  let fixture: ComponentFixture<AnalyticsDashboardComponent>;
  let analytics: jest.Mocked<SiteAnalyticsService>;

  beforeEach(async () => {
    analytics = createSpyObj(SiteAnalyticsService);
    analytics.load.mockResolvedValue(sampleReport());
    await TestBed.configureTestingModule({
      imports: [AnalyticsDashboardComponent],
      providers: [
        { provide: SiteAnalyticsService, useValue: analytics },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AnalyticsDashboardComponent);
  });

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  describe('when the report loads', () => {
    it('should show visitors, devices, browsers, and unknown pages', async () => {
      await settle();
      const page = fixture.nativeElement as HTMLElement;
      const text = page.textContent ?? '';

      expect(text).toContain('On the site');
      expect(text).toContain('3');
      expect(text).toContain('62.5%');
      expect(text).toContain('About Me');
      expect(text).toContain('+100%');
      expect(text).toContain('New');
      expect(text).toContain('United States');
      expect(text).toContain('Desktop');
      expect(text).toContain('Chrome');
      expect(text).toContain('Chrome 146.0.7680.178');
      expect(text).toContain('Windows 11');
      expect(text).toContain('iPhone 15');
      expect(text).toContain('1920x1080');
      expect(text).toContain('English');
      expect(text).toContain('/missing-page');
      expect(text).not.toContain('/admin/home');
      expect(page.querySelector('svg')?.getAttribute('aria-label')).toContain('own scale');
    });
  });

  describe('when the report cannot be loaded', () => {
    it('should show the error', async () => {
      analytics.load.mockRejectedValue(
        new Error('Set GA4_PROPERTY_ID to the numeric Analytics property id.'),
      );

      await settle();

      expect(fixture.nativeElement.textContent).toContain(
        'Set GA4_PROPERTY_ID to the numeric Analytics property id.',
      );
      expect(fixture.nativeElement.querySelector('svg')).toBeNull();
    });
  });

  describe('when refresh is clicked', () => {
    it('should load the report again', async () => {
      await settle();
      const button = fixture.nativeElement.querySelector('button');
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error('missing refresh button');
      }

      button.click();
      await settle();

      expect(analytics.load).toHaveBeenCalledTimes(2);
    });
  });
});
