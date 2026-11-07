import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Signal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import {
  presentAnalytics,
  type AnalyticsDashboardView,
} from './analytics-present';
import { SiteAnalyticsService } from './site-analytics.service';
import { SiteAnalyticsReport } from './site-analytics.types';

/**
 * Admin dashboard for site traffic, devices, and browsers.
 * The report comes from the analytics callable, which requires an admin session.
 */
@Component({
  selector: 'admin-analytics-dashboard',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDashboardComponent implements OnInit {
  /** True while a report is being loaded. */
  protected readonly isLoading = signal(true);

  /** Shown when the report cannot be loaded. */
  protected readonly loadError = signal<string | null>(null);

  /** Formatted report, once a load has succeeded. */
  protected readonly view: Signal<AnalyticsDashboardView | null>;

  /** Callable client. */
  private readonly analytics = inject(SiteAnalyticsService);

  /** Latest report. A failed refresh keeps the previous one. */
  private readonly report = signal<SiteAnalyticsReport | null>(null);

  /**
   * Build the view from the latest report.
   */
  constructor() {
    this.view = computed(() => {
      const current = this.report();
      return current === null ? null : presentAnalytics(current);
    });
  }

  /**
   * Load the first report.
   * @inheritdoc
   */
  public ngOnInit(): void {
    this.loadReport().catch(() => {
      this.loadError.set('Analytics could not be loaded.');
    });
  }

  /**
   * Load the report again.
   */
  protected refresh(): void {
    this.loadReport().catch(() => {
      this.loadError.set('Analytics could not be loaded.');
    });
  }

  /**
   * Replace the report, keeping the previous one when the refresh fails.
   */
  private async loadReport(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);
    try {
      this.report.set(await this.analytics.load());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Analytics could not be loaded.';
      this.loadError.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }
}
