import {
  analyticsPropertyId,
  analyticsQueries,
  cachedAnalytics,
  collectSiteAnalytics,
  isAnalyticsAdmin,
  toRealtimeRequest,
  toRunReportRequest,
  type AnalyticsDataClient,
  type GaRunReportResponse,
  type SiteAnalyticsReport,
} from './site-analytics';

const NOW = new Date('2026-11-07T18:00:00.000Z');

describe('isAnalyticsAdmin', () => {
  it('should accept a password session', () => {
    expect(isAnalyticsAdmin({
      token: { firebase: { sign_in_provider: 'password' } },
    })).toBe(true);
  });

  it.each([
    undefined,
    {},
    { token: { firebase: { sign_in_provider: 'google.com' } } },
  ])('should reject %p', (auth) => {
    expect(isAnalyticsAdmin(auth)).toBe(false);
  });
});

describe('analyticsPropertyId', () => {
  it('should accept a numeric property id', () => {
    expect(analyticsPropertyId(' 123456789 ')).toBe('123456789');
  });

  it.each(['', 'G-GBHQT08WND', '12', '1234567890123'])('should reject %p', (value) => {
    expect(analyticsPropertyId(value)).toBeNull();
  });
});

describe('cachedAnalytics', () => {
  const report = { generatedAt: NOW.toISOString() } as SiteAnalyticsReport;

  it('should reuse a report inside the max age', () => {
    expect(cachedAnalytics({
      propertyId: '123456789',
      at: 1_000,
      report,
    }, '123456789', 1_500, 1_000)).toBe(report);
  });

  it('should query again when the report is stale or for another property', () => {
    const cache = { propertyId: '123456789', at: 1_000, report };
    expect(cachedAnalytics(cache, '123456789', 2_000, 1_000)).toBeNull();
    expect(cachedAnalytics(cache, '987654321', 1_100, 1_000)).toBeNull();
    expect(cachedAnalytics(null, '123456789', 1_100, 1_000)).toBeNull();
  });
});

describe('analyticsQueries', () => {
  it('should ask for device, browser, and the public-page reports', () => {
    const browsers = analyticsQueries().find((item) => item.name === 'browsers');
    const devices = analyticsQueries().find((item) => item.name === 'devices');
    const pages = analyticsQueries().find((item) => item.name === 'pages');

    expect(toRunReportRequest(browsers!)).toMatchObject({
      dimensions: [{ name: 'browser' }, { name: 'browserVersion' }],
      dimensionFilter: {
        notExpression: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: { matchType: 'BEGINS_WITH', value: '/admin' },
          },
        },
      },
    });
    expect(toRunReportRequest(devices!)).toMatchObject({
      dimensions: [{ name: 'deviceCategory' }],
    });
    expect(toRunReportRequest(pages!).dateRanges).toEqual([
      { name: 'current', startDate: '28daysAgo', endDate: 'today' },
      { name: 'previous', startDate: '56daysAgo', endDate: '29daysAgo' },
    ]);
    expect(toRealtimeRequest()).toMatchObject({
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: {
        notExpression: {
          filter: {
            fieldName: 'unifiedScreenName',
            stringFilter: { value: 'admin' },
          },
        },
      },
    });
  });

  it('should leave landing pages unfiltered so the assembler can drop admin landings', () => {
    const landing = analyticsQueries().find((item) => item.name === 'landing');
    expect(toRunReportRequest(landing!)).not.toHaveProperty('dimensionFilter');
  });
});

describe('collectSiteAnalytics', () => {
  it('should assemble the dashboard and leave admin traffic out', async () => {
    const client = fakeClient();

    const report = await collectSiteAnalytics(client, '123456789', NOW);

    expect(client.properties).toEqual([
      'properties/123456789',
      'properties/123456789',
      'properties/123456789',
      'properties/123456789',
    ]);
    expect(report).toMatchObject({
      generatedAt: '2026-11-07T18:00:00.000Z',
      activeUsersNow: 3,
      usersToday: 4,
      usersLast7Days: 10,
      usersLast28Days: 20,
      engagementRate: 0.5,
      landingPages: [{ label: '/home', count: 8 }],
      sources: [{ label: 'google / organic', count: 6 }],
      countries: [{ label: 'United States', count: 9 }],
      devices: [
        { label: 'Desktop', count: 7 },
        { label: 'Mobile', count: 2 },
      ],
      browsers: [
        { label: 'Chrome', count: 6 },
        { label: 'Safari', count: 3 },
      ],
      browserVersions: [
        { label: 'Chrome 146.0.1', count: 4 },
        { label: 'Safari 18.6', count: 3 },
        { label: 'Chrome 145.0.1', count: 2 },
      ],
      operatingSystems: [{ label: 'Windows 11', count: 5 }],
      mobileDevices: [{ label: 'iPhone 15', count: 2 }],
      screenResolutions: [{ label: '1920x1080', count: 3 }],
      languages: [{ label: 'English', count: 14 }],
      misses: [{ label: '/missing', count: 2 }],
    });
    expect(report.trend).toEqual([
      { date: '20261011', users: 1, pageViews: 2 },
      { date: '20261107', users: 4, pageViews: 9 },
    ]);
    expect(report.sections.find((section) => section.label === 'Home')).toEqual({
      label: 'Home',
      path: '/',
      pageViews: 5,
      previousPageViews: 2,
    });
    expect(report.sections.find((section) => section.label === 'About Me')).toMatchObject({
      pageViews: 6,
      previousPageViews: 3,
    });
    expect(report.sections.find((section) => section.label === 'Portfolio')).toMatchObject({
      pageViews: 0,
      previousPageViews: 0,
    });
    expect(report.misses.map((row) => row.label)).not.toContain('/admin/home');
    expect(report.misses.map((row) => row.label)).not.toContain('/content/admin');
  });
});

function fakeClient(): AnalyticsDataClient & { properties: string[] } {
  const properties: string[] = [];
  return {
    properties,
    batchRunReports: (request) => {
      properties.push(String(request['property']));
      const requests = request['requests'] as Array<Record<string, unknown>>;
      return Promise.resolve([{
        reports: requests.map((item) => canned(item)),
      }]);
    },
    runRealtimeReport: (request) => {
      properties.push(String(request['property']));
      return Promise.resolve([report(['activeUsers'], [['3']], 0)]);
    },
  };
}

function canned(request: Record<string, unknown>): GaRunReportResponse {
  const dimensions = ((request['dimensions'] as Array<{ name: string }> | undefined) ?? [])
    .map((item) => item.name);
  const key = dimensions.join('+');
  const tables: Record<string, GaRunReportResponse> = {
    '': report(
      ['dateRange', 'activeUsers', 'engagementRate'],
      [
        ['today', '4', '0.2'],
        ['last7', '10', '0.4'],
        ['last28', '20', '0.5'],
      ],
      1,
    ),
    date: report(
      ['date', 'activeUsers', 'screenPageViews'],
      [
        ['20261107', '4', '9'],
        ['20261011', '1', '2'],
      ],
      1,
    ),
    pagePath: report(
      ['dateRange', 'pagePath', 'screenPageViews'],
      [
        ['current', '/home', '4'],
        ['current', '/', '1'],
        ['current', '/content/aboutme', '6'],
        ['current', '/admin/home', '9'],
        ['current', '/missing', '2'],
        ['current', '/content/admin', '3'],
        ['previous', '/content/aboutme', '3'],
        ['previous', '/home', '2'],
      ],
      2,
    ),
    landingPage: report(
      ['landingPage', 'sessions'],
      [
        ['/home', '8'],
        ['/admin/home', '4'],
      ],
      1,
    ),
    sessionSourceMedium: report(['sessionSourceMedium', 'sessions'], [['google / organic', '6']], 1),
    country: report(['country', 'activeUsers'], [['United States', '9']], 1),
    deviceCategory: report(
      ['deviceCategory', 'activeUsers'],
      [['desktop', '7'], ['mobile', '2'], ['(not set)', '1']],
      1,
    ),
    'browser+browserVersion': report(
      ['browser', 'browserVersion', 'activeUsers'],
      [
        ['Chrome', '146.0.1', '4'],
        ['Chrome', '145.0.1', '2'],
        ['Safari', '18.6', '3'],
        ['(not set)', '(not set)', '1'],
      ],
      2,
    ),
    operatingSystemWithVersion: report(
      ['operatingSystemWithVersion', 'activeUsers'],
      [['Windows 11', '5']],
      1,
    ),
    mobileDeviceMarketingName: report(
      ['mobileDeviceMarketingName', 'activeUsers'],
      [['(not set)', '8'], ['iPhone 15', '2']],
      1,
    ),
    screenResolution: report(['screenResolution', 'activeUsers'], [['1920x1080', '3']], 1),
    language: report(['language', 'activeUsers'], [['English', '14']], 1),
  };
  return tables[key] ?? report([], [], 0);
}

function report(headers: string[], rows: string[][], dimensionCount: number): GaRunReportResponse {
  return {
    dimensionHeaders: headers.slice(0, dimensionCount).map((name) => ({ name })),
    metricHeaders: headers.slice(dimensionCount).map((name) => ({ name })),
    rows: rows.map((values) => ({
      dimensionValues: values.slice(0, dimensionCount).map((value) => ({ value })),
      metricValues: values.slice(dimensionCount).map((value) => ({ value })),
    })),
  };
}
