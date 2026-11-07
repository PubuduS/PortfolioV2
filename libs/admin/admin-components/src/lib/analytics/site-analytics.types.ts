/** One labeled count from the analytics callable. */
export interface AnalyticsRankRow {
  /** Display name. */
  label: string;
  /** Users, sessions, or page views, depending on the list. */
  count: number;
}

/** Users and page views for one day. */
export interface AnalyticsTrendPoint {
  /** Day as `YYYYMMDD`. */
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

/**
 * Body returned by the `getSiteAnalytics` callable.
 * Field names match the function response.
 */
export interface SiteAnalyticsReport {
  /** When the report was assembled. */
  generatedAt: string;
  /** Label for the live count. */
  realtimeLabel: string;
  /** Label for the current window. */
  rangeLabel: string;
  /** Label for the comparison window. */
  comparisonLabel: string;
  /** Active users in the last 30 minutes. */
  activeUsersNow: number;
  /** Active users today. */
  usersToday: number;
  /** Active users over the last 7 days. */
  usersLast7Days: number;
  /** Active users over the last 28 days. */
  usersLast28Days: number;
  /** Engaged sessions divided by sessions, from 0 to 1. */
  engagementRate: number;
  /** Daily users and page views. */
  trend: AnalyticsTrendPoint[];
  /** Public sections. */
  sections: AnalyticsSectionRow[];
  /** First page of a session. */
  landingPages: AnalyticsRankRow[];
  /** Session source and medium. */
  sources: AnalyticsRankRow[];
  /** Country of the visitor. */
  countries: AnalyticsRankRow[];
  /** Desktop, mobile, or tablet. */
  devices: AnalyticsRankRow[];
  /** Browser name. */
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
