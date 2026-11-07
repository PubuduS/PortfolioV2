import {
  Injectable,
  inject,
} from '@angular/core';
import {
  Functions,
  httpsCallable,
} from '@angular/fire/functions';
import { FirebaseError } from 'firebase/app';

import { SiteAnalyticsReport } from './site-analytics.types';

/**
 * Maps a callable failure to a sentence the dashboard can show.
 * @param error Failure from the callable.
 * @returns The message to show.
 */
export function analyticsErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError && (
    error.code === 'functions/failed-precondition'
    || error.code === 'functions/permission-denied'
  )) {
    const message = error.message.trim();
    return message.length > 0 ? message : 'Analytics could not be loaded.';
  }
  return 'Analytics could not be loaded.';
}

/**
 * Loads the admin analytics report from the `getSiteAnalytics` callable.
 * The function checks the admin session and reads Google Analytics.
 */
@Injectable({
  providedIn: 'root',
})
export class SiteAnalyticsService {
  /** Cloud Functions instance for this build. */
  private readonly functions = inject(Functions);

  /** Callable that returns the dashboard report. */
  private readonly fetchReport = httpsCallable<Record<string, never>, SiteAnalyticsReport>(
    this.functions,
    'getSiteAnalytics',
  );

  /**
   * Loads the current analytics report.
   * @returns The report the dashboard renders.
   */
  public async load(): Promise<SiteAnalyticsReport> {
    try {
      const result = await this.fetchReport({});
      return result.data;
    } catch (error: unknown) {
      throw new Error(analyticsErrorMessage(error));
    }
  }
}
