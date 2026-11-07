/** One labeled count from a report, such as a browser or a country. */
export interface AnalyticsRankRow {
  /** Display name. */
  label: string;
  /** Users, sessions, or page views, depending on the list. */
  count: number;
}

/** Users and page views for one day. */
export interface AnalyticsTrendPoint {
  /** Day as `YYYYMMDD` in the Analytics property timezone. */
  date: string;
  /** Active users that day. */
  users: number;
  /** Page views that day. */
  pageViews: number;
}

/** Page views for one public section, against the previous window. */
export interface AnalyticsSectionRow {
  /** Section name shown in the dashboard. */
  label: string;
  /** Canonical path for the section. */
  path: string;
  /** Page views in the current window. */
  pageViews: number;
  /** Page views in the previous window. */
  previousPageViews: number;
}

/** Body returned by the `getSiteAnalytics` callable. */
export interface SiteAnalyticsReport {
  /** When the report was assembled. */
  generatedAt: string;
  /** Label for the live count. */
  realtimeLabel: string;
  /** Label for the current window. */
  rangeLabel: string;
  /** Label for the comparison window. */
  comparisonLabel: string;
  /** Active users in the last 30 minutes, excluding admin screens. */
  activeUsersNow: number;
  /** Active users today. */
  usersToday: number;
  /** Active users over the last 7 days, including today. */
  usersLast7Days: number;
  /** Active users over the last 28 days, including today. */
  usersLast28Days: number;
  /** Engaged sessions divided by sessions, from 0 to 1, over the last 28 days. */
  engagementRate: number;
  /** Daily users and page views. */
  trend: AnalyticsTrendPoint[];
  /** Public sections, including those with no views. */
  sections: AnalyticsSectionRow[];
  /** First page of a session. */
  landingPages: AnalyticsRankRow[];
  /** Session source and medium. */
  sources: AnalyticsRankRow[];
  /** Country of the visitor. */
  countries: AnalyticsRankRow[];
  /** Desktop, mobile, or tablet. */
  devices: AnalyticsRankRow[];
  /** Browser name, with versions rolled up. */
  browsers: AnalyticsRankRow[];
  /** Browser name plus version. */
  browserVersions: AnalyticsRankRow[];
  /** Operating system and version. */
  operatingSystems: AnalyticsRankRow[];
  /** Marketed phone or tablet name. */
  mobileDevices: AnalyticsRankRow[];
  /** Monitor resolution. */
  screenResolutions: AnalyticsRankRow[];
  /** Browser or device language. */
  languages: AnalyticsRankRow[];
  /** Requested paths that are not a public section. */
  misses: AnalyticsRankRow[];
}

/** One row of a Data API report. */
export interface MetricRow {
  /** Dimension name to value. */
  dimensions: Record<string, string>;
  /** Metric name to value. */
  metrics: Record<string, number>;
}

/** Shape of a Data API report the parser reads. */
export interface GaRunReportResponse {
  /** Dimension columns, in order. */
  dimensionHeaders?: Array<{ name?: string | null }> | null;
  /** Metric columns, in order. */
  metricHeaders?: Array<{ name?: string | null }> | null;
  /** One entry per result row. */
  rows?: Array<{
    dimensionValues?: Array<{ value?: string | null }> | null;
    metricValues?: Array<{ value?: string | null }> | null;
  }> | null;
}

/** Client methods the collector uses. */
export interface AnalyticsDataClient {
  /**
   * Runs up to five standard reports.
   * @param request Batch request.
   * @returns The batch response.
   */
  batchRunReports(
    request: Record<string, unknown>,
  ): Promise<readonly [{ reports?: GaRunReportResponse[] }]>;
  /**
   * Runs the realtime report.
   * @param request Realtime request.
   * @returns The realtime response.
   */
  runRealtimeReport(
    request: Record<string, unknown>,
  ): Promise<readonly [GaRunReportResponse]>;
}

/** A standard report the collector asks for. */
export interface AnalyticsQuery {
  /** Key used to store the parsed rows. */
  name: string;
  /** Dimension api names. */
  dimensions: string[];
  /** Metric api names. */
  metrics: string[];
  /** Named date ranges. */
  dateRanges: Array<{ name: string; startDate: string; endDate: string }>;
  /** Maximum rows. */
  limit: number;
  /** Field used for sorting. */
  orderField: string;
  /** Whether the sort field is a dimension or a metric. */
  orderKind: 'dimension' | 'metric';
  /** True for a descending sort. */
  orderDesc: boolean;
  /** Drop hits whose page path starts with `/admin`. */
  excludeAdmin: boolean;
  /** Keep days that have no hits. */
  keepEmptyRows: boolean;
}

/** Cached report for one property. */
export interface AnalyticsCache {
  /** Numeric property id this report belongs to. */
  propertyId: string;
  /** `Date.now()` when the report was stored. */
  at: number;
  /** Stored report. */
  report: SiteAnalyticsReport;
}

/** Auth fragment needed to recognize an admin callable. */
export interface AnalyticsAuth {
  /** Decoded id token. */
  token?: {
    /** Firebase sign-in facts. */
    firebase?: {
      /** Provider id, `password` for the admin session. */
      sign_in_provider?: string;
    };
  };
}

interface DateRange {
  name: string;
  startDate: string;
  endDate: string;
}

interface SectionDefinition {
  label: string;
  paths: string[];
}

const RANK_LIMIT = 8;

const VERSION_LIMIT = 8;

const MISS_LIMIT = 10;

const PAGE_LIMIT = 100;

const BROWSER_LIMIT = 100;

const CURRENT_RANGE: DateRange = {
  name: 'current',
  startDate: '28daysAgo',
  endDate: 'today',
};

const PREVIOUS_RANGE: DateRange = {
  name: 'previous',
  startDate: '56daysAgo',
  endDate: '29daysAgo',
};

const SUMMARY_RANGES: DateRange[] = [
  { name: 'today', startDate: 'today', endDate: 'today' },
  { name: 'last7', startDate: '7daysAgo', endDate: 'today' },
  { name: 'last28', startDate: '28daysAgo', endDate: 'today' },
];

const SECTIONS: SectionDefinition[] = [
  { label: 'Home', paths: ['/', '/home'] },
  { label: 'About Me', paths: ['/content/aboutme'] },
  { label: 'Skills', paths: ['/content/skills'] },
  { label: 'Experience', paths: ['/content/experience'] },
  { label: 'Portfolio', paths: ['/content/portfolio'] },
  { label: 'Featured projects', paths: ['/content/portfolio/featured-projects', '/content/featured-projects'] },
  { label: 'Education', paths: ['/content/education', '/content/education/education'] },
  { label: 'Publications', paths: ['/content/education/publications'] },
  { label: 'Degrees', paths: ['/content/education/degrees'] },
  { label: 'Certificates', paths: ['/content/education/certificates'] },
  { label: 'Cover letter', paths: ['/content/coverletter'] },
  { label: 'Contact', paths: ['/content/contact'] },
  { label: 'Party mode', paths: ['/content/party-mode'] },
];

const KNOWN_PATHS = new Set(SECTIONS.flatMap((section) => section.paths));

const IGNORED_PATHS = new Set(['/content/admin']);

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
  'smart tv': 'Smart TV',
};

/**
 * True when the callable was made by an email-and-password admin session.
 * @param auth Callable auth, when the caller sent a token.
 * @returns True for the password provider.
 */
export function isAnalyticsAdmin(auth: AnalyticsAuth | undefined): boolean {
  return auth?.token?.firebase?.sign_in_provider === 'password';
}

/**
 * Accepts a numeric GA4 property id.
 * @param value Raw parameter value.
 * @returns The id, or null when it is missing or not numeric.
 */
export function analyticsPropertyId(value: string): string | null {
  const trimmed = value.trim();
  return /^\d{6,12}$/.test(trimmed) ? trimmed : null;
}

/**
 * Returns a stored report when it is still inside the max age.
 * @param cache Previous report, if one was stored.
 * @param propertyId Property the caller asked for.
 * @param now Current time in milliseconds.
 * @param maxAgeMs How long a stored report may be reused.
 * @returns The stored report, or null when the caller should query again.
 */
export function cachedAnalytics(
  cache: AnalyticsCache | null,
  propertyId: string,
  now: number,
  maxAgeMs: number,
): SiteAnalyticsReport | null {
  if (cache === null || cache.propertyId !== propertyId || now - cache.at >= maxAgeMs) {
    return null;
  }
  return cache.report;
}

/**
 * Standard reports the dashboard needs.
 * Admin page paths are filtered on the reports that count pages and users.
 * @returns Queries in the order they are sent.
 */
export function analyticsQueries(): AnalyticsQuery[] {
  return [
    query('summary', [], ['activeUsers', 'engagementRate'], SUMMARY_RANGES, {
      limit: 10,
      orderField: 'activeUsers',
      orderKind: 'metric',
      orderDesc: true,
      excludeAdmin: true,
      keepEmptyRows: false,
    }),
    query('trend', ['date'], ['activeUsers', 'screenPageViews'], [CURRENT_RANGE], {
      limit: 31,
      orderField: 'date',
      orderKind: 'dimension',
      orderDesc: false,
      excludeAdmin: true,
      keepEmptyRows: true,
    }),
    query('pages', ['pagePath'], ['screenPageViews'], [CURRENT_RANGE, PREVIOUS_RANGE], {
      limit: PAGE_LIMIT,
      orderField: 'screenPageViews',
      orderKind: 'metric',
      orderDesc: true,
      excludeAdmin: true,
      keepEmptyRows: false,
    }),
    query('landing', ['landingPage'], ['sessions'], [CURRENT_RANGE], {
      limit: RANK_LIMIT,
      orderField: 'sessions',
      orderKind: 'metric',
      orderDesc: true,
      excludeAdmin: false,
      keepEmptyRows: false,
    }),
    query('sources', ['sessionSourceMedium'], ['sessions'], [CURRENT_RANGE], {
      limit: RANK_LIMIT,
      orderField: 'sessions',
      orderKind: 'metric',
      orderDesc: true,
      excludeAdmin: false,
      keepEmptyRows: false,
    }),
    query('countries', ['country'], ['activeUsers'], [CURRENT_RANGE], {
      limit: RANK_LIMIT,
      orderField: 'activeUsers',
      orderKind: 'metric',
      orderDesc: true,
      excludeAdmin: true,
      keepEmptyRows: false,
    }),
    query('devices', ['deviceCategory'], ['activeUsers'], [CURRENT_RANGE], {
      limit: RANK_LIMIT,
      orderField: 'activeUsers',
      orderKind: 'metric',
      orderDesc: true,
      excludeAdmin: true,
      keepEmptyRows: false,
    }),
    query('browsers', ['browser', 'browserVersion'], ['activeUsers'], [CURRENT_RANGE], {
      limit: BROWSER_LIMIT,
      orderField: 'activeUsers',
      orderKind: 'metric',
      orderDesc: true,
      excludeAdmin: true,
      keepEmptyRows: false,
    }),
    query('operatingSystems', ['operatingSystemWithVersion'], ['activeUsers'], [CURRENT_RANGE], {
      limit: RANK_LIMIT,
      orderField: 'activeUsers',
      orderKind: 'metric',
      orderDesc: true,
      excludeAdmin: true,
      keepEmptyRows: false,
    }),
    query('mobileDevices', ['mobileDeviceMarketingName'], ['activeUsers'], [CURRENT_RANGE], {
      limit: RANK_LIMIT,
      orderField: 'activeUsers',
      orderKind: 'metric',
      orderDesc: true,
      excludeAdmin: true,
      keepEmptyRows: false,
    }),
    query('screenResolutions', ['screenResolution'], ['activeUsers'], [CURRENT_RANGE], {
      limit: RANK_LIMIT,
      orderField: 'activeUsers',
      orderKind: 'metric',
      orderDesc: true,
      excludeAdmin: true,
      keepEmptyRows: false,
    }),
    query('languages', ['language'], ['activeUsers'], [CURRENT_RANGE], {
      limit: RANK_LIMIT,
      orderField: 'activeUsers',
      orderKind: 'metric',
      orderDesc: true,
      excludeAdmin: true,
      keepEmptyRows: false,
    }),
  ];
}

/**
 * Turns a query into a Data API runReport body.
 * The property id is added by the batch call.
 * @param item Query to send.
 * @returns The request body.
 */
export function toRunReportRequest(item: AnalyticsQuery): Record<string, unknown> {
  const request: Record<string, unknown> = {
    dateRanges: item.dateRanges,
    dimensions: item.dimensions.map((name) => ({ name })),
    metrics: item.metrics.map((name) => ({ name })),
    limit: item.limit,
    keepEmptyRows: item.keepEmptyRows,
    orderBys: [orderBy(item)],
  };
  if (item.excludeAdmin) {
    request['dimensionFilter'] = {
      notExpression: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'BEGINS_WITH',
            value: '/admin',
            caseSensitive: false,
          },
        },
      },
    };
  }
  return request;
}

/**
 * Realtime request for people on the site, excluding admin screens.
 * @returns The realtime request body without the property id.
 */
export function toRealtimeRequest(): Record<string, unknown> {
  return {
    metrics: [{ name: 'activeUsers' }],
    dimensionFilter: {
      notExpression: {
        filter: {
          fieldName: 'unifiedScreenName',
          stringFilter: {
            matchType: 'BEGINS_WITH',
            value: 'admin',
            caseSensitive: false,
          },
        },
      },
    },
  };
}

/**
 * Loads every report and assembles the dashboard body.
 * @param client Data API client.
 * @param propertyId Numeric GA4 property id.
 * @param now Clock used for `generatedAt`.
 * @returns The dashboard report.
 */
export async function collectSiteAnalytics(
  client: AnalyticsDataClient,
  propertyId: string,
  now: Date,
): Promise<SiteAnalyticsReport> {
  const queries = analyticsQueries();
  const tables = new Map<string, MetricRow[]>();
  const batchSize = 5;
  for (let index = 0; index < queries.length; index += batchSize) {
    const group = queries.slice(index, index + batchSize);
    const [response] = await client.batchRunReports({
      property: `properties/${propertyId}`,
      requests: group.map((item) => toRunReportRequest(item)),
    });
    const reports = response.reports ?? [];
    if (reports.length !== group.length) {
      throw new Error('Analytics returned an incomplete report.');
    }
    group.forEach((item, groupIndex) => {
      tables.set(item.name, readReport(reports[groupIndex] ?? {}));
    });
  }
  const [realtime] = await client.runRealtimeReport({
    property: `properties/${propertyId}`,
    ...toRealtimeRequest(),
  });
  tables.set('realtime', readReport(realtime));
  return assembleSiteAnalytics(tables, now);
}

/**
 * Reads dimension and metric columns into plain rows.
 * @param response Report from the Data API.
 * @returns One record per result row.
 */
export function readReport(response: GaRunReportResponse): MetricRow[] {
  const dimensions = (response.dimensionHeaders ?? []).map((header) => header.name ?? '');
  const metrics = (response.metricHeaders ?? []).map((header) => header.name ?? '');
  return (response.rows ?? []).map((row) => {
    const dimensionValues: Record<string, string> = {};
    dimensions.forEach((name, index) => {
      if (name.length > 0) {
        dimensionValues[name] = row.dimensionValues?.[index]?.value ?? '';
      }
    });
    const metricValues: Record<string, number> = {};
    metrics.forEach((name, index) => {
      if (name.length > 0) {
        metricValues[name] = metricNumber(row.metricValues?.[index]?.value);
      }
    });
    return { dimensions: dimensionValues, metrics: metricValues };
  });
}

/**
 * Builds the dashboard body from parsed reports.
 * @param tables Report name to rows.
 * @param now Clock used for `generatedAt`.
 * @returns The dashboard report.
 */
export function assembleSiteAnalytics(
  tables: ReadonlyMap<string, MetricRow[]>,
  now: Date,
): SiteAnalyticsReport {
  const summary = tables.get('summary') ?? [];
  const currentPages = pageCounts(tables.get('pages') ?? [], 'current');
  const previousPages = pageCounts(tables.get('pages') ?? [], 'previous');
  return {
    generatedAt: now.toISOString(),
    realtimeLabel: 'Last 30 minutes',
    rangeLabel: 'Last 28 days',
    comparisonLabel: 'Previous 28 days',
    activeUsersNow: sumMetric(tables.get('realtime') ?? [], 'activeUsers'),
    usersToday: rangeMetric(summary, 'today', 'activeUsers'),
    usersLast7Days: rangeMetric(summary, 'last7', 'activeUsers'),
    usersLast28Days: rangeMetric(summary, 'last28', 'activeUsers'),
    engagementRate: rangeMetric(summary, 'last28', 'engagementRate'),
    trend: trendPoints(tables.get('trend') ?? []),
    sections: sectionRows(currentPages, previousPages),
    landingPages: ranked(tables.get('landing') ?? [], landingLabel, 'sessions', RANK_LIMIT),
    sources: ranked(tables.get('sources') ?? [], (row) => cleanLabel(row.dimensions['sessionSourceMedium']), 'sessions', RANK_LIMIT),
    countries: ranked(tables.get('countries') ?? [], (row) => cleanLabel(row.dimensions['country']), 'activeUsers', RANK_LIMIT),
    devices: ranked(tables.get('devices') ?? [], deviceLabel, 'activeUsers', RANK_LIMIT),
    browsers: ranked(tables.get('browsers') ?? [], (row) => cleanLabel(row.dimensions['browser']), 'activeUsers', RANK_LIMIT),
    browserVersions: ranked(tables.get('browsers') ?? [], browserVersionLabel, 'activeUsers', VERSION_LIMIT),
    operatingSystems: ranked(
      tables.get('operatingSystems') ?? [],
      (row) => cleanLabel(row.dimensions['operatingSystemWithVersion']),
      'activeUsers',
      RANK_LIMIT,
    ),
    mobileDevices: ranked(
      tables.get('mobileDevices') ?? [],
      (row) => cleanLabel(row.dimensions['mobileDeviceMarketingName']),
      'activeUsers',
      RANK_LIMIT,
    ),
    screenResolutions: ranked(
      tables.get('screenResolutions') ?? [],
      (row) => cleanLabel(row.dimensions['screenResolution']),
      'activeUsers',
      RANK_LIMIT,
    ),
    languages: ranked(tables.get('languages') ?? [], (row) => cleanLabel(row.dimensions['language']), 'activeUsers', RANK_LIMIT),
    misses: missRows(currentPages),
  };
}

function query(
  name: string,
  dimensions: string[],
  metrics: string[],
  dateRanges: DateRange[],
  options: Omit<AnalyticsQuery, 'name' | 'dimensions' | 'metrics' | 'dateRanges'>,
): AnalyticsQuery {
  return {
    name,
    dimensions,
    metrics,
    dateRanges,
    ...options,
  };
}

function orderBy(item: AnalyticsQuery): Record<string, unknown> {
  if (item.orderKind === 'dimension') {
    return {
      desc: item.orderDesc,
      dimension: { dimensionName: item.orderField },
    };
  }
  return {
    desc: item.orderDesc,
    metric: { metricName: item.orderField },
  };
}

function metricNumber(value: string | null | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function rangeMetric(rows: MetricRow[], range: string, metric: string): number {
  const row = rows.find((item) => item.dimensions['dateRange'] === range);
  return row?.metrics[metric] ?? 0;
}

function sumMetric(rows: MetricRow[], metric: string): number {
  return rows.reduce((total, row) => total + (row.metrics[metric] ?? 0), 0);
}

function pageCounts(rows: MetricRow[], range: string): Map<string, number> {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    if (row.dimensions['dateRange'] !== range) {
      return;
    }
    const path = normalizePath(row.dimensions['pagePath'] ?? '');
    if (path.length === 0 || isAdminPath(path)) {
      return;
    }
    counts.set(path, (counts.get(path) ?? 0) + (row.metrics['screenPageViews'] ?? 0));
  });
  return counts;
}

function sectionRows(current: Map<string, number>, previous: Map<string, number>): AnalyticsSectionRow[] {
  return SECTIONS.map((section) => ({
    label: section.label,
    path: section.paths[0] ?? '',
    pageViews: sumPaths(current, section.paths),
    previousPageViews: sumPaths(previous, section.paths),
  }));
}

function sumPaths(counts: Map<string, number>, paths: string[]): number {
  return paths.reduce((total, path) => total + (counts.get(path) ?? 0), 0);
}

function missRows(current: Map<string, number>): AnalyticsRankRow[] {
  const rows: AnalyticsRankRow[] = [];
  current.forEach((count, path) => {
    if (count <= 0 || KNOWN_PATHS.has(path) || IGNORED_PATHS.has(path)) {
      return;
    }
    rows.push({
      label: path === '(other)' ? 'Other paths' : path,
      count,
    });
  });
  return rows.sort(byCount).slice(0, MISS_LIMIT);
}

function trendPoints(rows: MetricRow[]): AnalyticsTrendPoint[] {
  return rows
    .map((row) => ({
      date: row.dimensions['date'] ?? '',
      users: row.metrics['activeUsers'] ?? 0,
      pageViews: row.metrics['screenPageViews'] ?? 0,
    }))
    .filter((point) => /^\d{8}$/.test(point.date))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function ranked(
  rows: MetricRow[],
  labelOf: (row: MetricRow) => string | null,
  metric: string,
  limit: number,
): AnalyticsRankRow[] {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    const label = labelOf(row);
    if (label === null) {
      return;
    }
    totals.set(label, (totals.get(label) ?? 0) + (row.metrics[metric] ?? 0));
  });
  return [...totals.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort(byCount)
    .slice(0, limit);
}

function byCount(left: AnalyticsRankRow, right: AnalyticsRankRow): number {
  return right.count - left.count || left.label.localeCompare(right.label);
}

function landingLabel(row: MetricRow): string | null {
  const path = normalizePath(row.dimensions['landingPage'] ?? '');
  if (path.length === 0 || isAdminPath(path)) {
    return null;
  }
  return path === '(other)' ? 'Other' : path;
}

function deviceLabel(row: MetricRow): string | null {
  const value = cleanLabel(row.dimensions['deviceCategory']);
  if (value === null) {
    return null;
  }
  return DEVICE_LABELS[value.toLowerCase()] ?? value;
}

function browserVersionLabel(row: MetricRow): string | null {
  const browser = cleanLabel(row.dimensions['browser']);
  const version = cleanLabel(row.dimensions['browserVersion']);
  if (browser === null || version === null) {
    return null;
  }
  return `${browser} ${version}`;
}

function cleanLabel(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === '(not set)') {
    return null;
  }
  if (trimmed === '(other)') {
    return 'Other';
  }
  return trimmed;
}

function normalizePath(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === '(not set)' || trimmed === '**') {
    return '';
  }
  if (trimmed === '(other)') {
    return '(other)';
  }
  const withoutQuery = trimmed.split('?')[0]?.split('#')[0] ?? trimmed;
  const withSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  if (withSlash.length > 1 && withSlash.endsWith('/')) {
    return withSlash.slice(0, -1);
  }
  return withSlash;
}

function isAdminPath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/');
}
