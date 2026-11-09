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
