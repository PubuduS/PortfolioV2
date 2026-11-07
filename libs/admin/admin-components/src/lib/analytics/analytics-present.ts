import {
  AnalyticsRankRow,
  AnalyticsSectionRow,
  AnalyticsTrendPoint,
  SiteAnalyticsReport,
} from './site-analytics.types';

/** One bar in a ranked list. */
export interface RankView {
  /** Display name. */
  label: string;
  /** Formatted count. */
  count: string;
  /** Bar width as a percent of the largest count in the list. */
  share: number;
}

/** One section row, with the comparison already formatted. */
export interface SectionView {
  /** Section name. */
  label: string;
  /** Page views in the current window. */
  pageViews: string;
  /** Page views in the previous window. */
  previousPageViews: string;
  /** Change versus the previous window. */
  change: string;
  /** Whether the change rose, fell, or held. */
  tone: 'up' | 'down' | 'flat';
}

/** Lines and captions for the daily chart. */
export interface TrendChartView {
  /** Text alternative for the chart. */
  label: string;
  /** SVG polyline for daily users. */
  usersPoints: string;
  /** SVG polyline for daily page views. */
  pageViewPoints: string;
  /** Date captions under the chart. */
  ticks: string[];
}

/** Strings and chart geometry the dashboard template renders. */
export interface AnalyticsDashboardView {
  /** Label for the live count. */
  realtimeLabel: string;
  /** Label for the current window. */
  rangeLabel: string;
  /** Label for the comparison window. */
  comparisonLabel: string;
  /** People on the site now. */
  activeUsersNow: string;
  /** Users today. */
  usersToday: string;
  /** Users over 7 days. */
  usersLast7Days: string;
  /** Users over 28 days. */
  usersLast28Days: string;
  /** Engagement rate over 28 days. */
  engagementRate: string;
  /** Daily chart. */
  trend: TrendChartView;
  /** Section table. */
  sections: SectionView[];
  /** Landing pages. */
  landingPages: RankView[];
  /** Traffic sources. */
  sources: RankView[];
  /** Countries. */
  countries: RankView[];
  /** Device categories. */
  devices: RankView[];
  /** Browsers. */
  browsers: RankView[];
  /** Browser versions. */
  browserVersions: RankView[];
  /** Operating systems. */
  operatingSystems: RankView[];
  /** Phones and tablets. */
  mobileDevices: RankView[];
  /** Monitor resolutions. */
  screenResolutions: RankView[];
  /** Languages. */
  languages: RankView[];
  /** Unknown paths. */
  misses: RankView[];
}

/** Months of the year. */
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Width of the daily chart. */
const CHART_WIDTH = 100;

/** Height of the daily chart. */
const CHART_HEIGHT = 36;

/**
 * Creates a count label.
 * @param value Value from the report.
 * @returns Count label.
 */
function countLabel(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

/**
 * Creates a percent label.
 * @param rate Rate from the report.
 * @returns Percent label.
 */
function percentLabel(rate: number): string {
  const safe = Number.isFinite(rate) ? rate : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(safe);
}

/**
 * Formats a `YYYYMMDD` day as `Nov 7`.
 * @param value Day from the report.
 * @returns The short date, or the original value when it is not a day.
 */
export function formatAnalyticsDay(value: string): string {
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const monthName = MONTHS[month - 1];
  if (monthName === undefined || day < 1 || day > 31) {
    return value;
  }
  return `${monthName} ${day}`;
}

/**
 * Creates a change view.
 * @param current Current value.
 * @param previous Previous value.
 * @returns Change view.
 */
function changeOf(
  current: number,
  previous: number,
): { text: string; tone: 'up' | 'down' | 'flat' } {
  if (current === previous) {
    return { text: '0%', tone: 'flat' };
  }
  if (previous === 0) {
    return { text: 'New', tone: current > 0 ? 'up' : 'down' };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) {
    return { text: '0%', tone: 'flat' };
  }
  return {
    text: `${pct > 0 ? '+' : ''}${pct}%`,
    tone: pct > 0 ? 'up' : 'down',
  };
}

/**
 * Creates a section view.
 * @param section Section row from the report.
 * @returns Section view.
 */
function sectionView(section: AnalyticsSectionRow): SectionView {
  const change = changeOf(section.pageViews, section.previousPageViews);
  return {
    label: section.label,
    pageViews: countLabel(section.pageViews),
    previousPageViews: countLabel(section.previousPageViews),
    change: change.text,
    tone: change.tone,
  };
}

/**
 * Creates rank views with share percentages.
 * @param rows Rank rows from the report.
 * @returns Rank views with share percentages.
 */
function withShare(rows: AnalyticsRankRow[]): RankView[] {
  const peak = Math.max(1, ...rows.map((row) => row.count));
  return rows.map((row) => ({
    label: row.label,
    count: countLabel(row.count),
    share: Math.round((row.count / peak) * 100),
  }));
}

/**
 * Creates lines for the daily chart.
 * @param values Daily values from the report.
 * @returns Lines for the daily chart.
 */
function linePoints(values: number[]): string {
  if (values.length === 0) {
    return '';
  }
  const peak = Math.max(1, ...values);
  const step = values.length === 1 ? 0 : CHART_WIDTH / (values.length - 1);
  return values.map((value, index) => {
    const x = values.length === 1 ? CHART_WIDTH / 2 : index * step;
    const y = 2 + (CHART_HEIGHT - 4) * (1 - value / peak);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

/**
 * Creates captions for the daily chart.
 * @param points Daily points from the report.
 * @returns Captions for the daily chart.
 */
function trendTicks(points: AnalyticsTrendPoint[]): string[] {
  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined) {
    return [];
  }
  if (points.length <= 3) {
    return points.map((point) => formatAnalyticsDay(point.date));
  }
  const middle = points[Math.floor((points.length - 1) / 2)];
  if (middle === undefined) {
    return [];
  }
  return [
    formatAnalyticsDay(first.date),
    formatAnalyticsDay(middle.date),
    formatAnalyticsDay(last.date),
  ];
}

/**
 * Creates lines and captions for the daily chart.
 * @param points Daily points from the report.
 * @returns Lines and captions for the daily chart.
 */
function trendChart(points: AnalyticsTrendPoint[]): TrendChartView {
  return {
    label: points.length === 0
      ? 'No visits in this range.'
      : 'Daily users and page views. Each line uses its own scale.',
    usersPoints: linePoints(points.map((point) => point.users)),
    pageViewPoints: linePoints(points.map((point) => point.pageViews)),
    ticks: trendTicks(points),
  };
}

/**
 * Formats a report for the dashboard template.
 * @param report Report from the callable.
 * @returns Display strings and chart geometry.
 */
export function presentAnalytics(report: SiteAnalyticsReport): AnalyticsDashboardView {
  return {
    realtimeLabel: report.realtimeLabel,
    rangeLabel: report.rangeLabel,
    comparisonLabel: report.comparisonLabel,
    activeUsersNow: countLabel(report.activeUsersNow),
    usersToday: countLabel(report.usersToday),
    usersLast7Days: countLabel(report.usersLast7Days),
    usersLast28Days: countLabel(report.usersLast28Days),
    engagementRate: percentLabel(report.engagementRate),
    trend: trendChart(report.trend),
    sections: report.sections.map((section) => sectionView(section)),
    landingPages: withShare(report.landingPages),
    sources: withShare(report.sources),
    countries: withShare(report.countries),
    devices: withShare(report.devices),
    browsers: withShare(report.browsers),
    browserVersions: withShare(report.browserVersions),
    operatingSystems: withShare(report.operatingSystems),
    mobileDevices: withShare(report.mobileDevices),
    screenResolutions: withShare(report.screenResolutions),
    languages: withShare(report.languages),
    misses: withShare(report.misses),
  };
}
