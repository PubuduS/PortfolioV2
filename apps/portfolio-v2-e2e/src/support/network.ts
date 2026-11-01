import {
  test as base,
  type Page,
  type TestInfo,
} from '@playwright/test';

import { saveBrowserCoverage } from './browser-coverage';

const BLOCKED_HOST_SUFFIXES = [
  'googleapis.com',
  'firebaseio.com',
  'openweathermap.org',
];

/**
 * Drops requests to live Google and weather hosts so the browser can only talk to localhost.
 * @param page Playwright page.
 */
export async function applyNetworkGuard(page: Page): Promise<void> {
  await page.route('**/*', (route) => {
    const { hostname } = new URL(route.request().url());
    const isBlocked = BLOCKED_HOST_SUFFIXES.some((suffix) => (
      hostname === suffix || hostname.endsWith(`.${suffix}`)
    ));
    if (isBlocked) {
      return route.abort();
    }
    return route.continue();
  });
}

function isChromium(testInfo: TestInfo): boolean {
  const browser = testInfo.project.use.browserName ?? testInfo.project.use.defaultBrowserType;
  return browser === undefined || browser === 'chromium';
}

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await applyNetworkGuard(page);
    let collectCoverage = false;
    if (process.env['COVERAGE'] === '1' && isChromium(testInfo)) {
      try {
        await page.coverage.startJSCoverage({ resetOnNavigation: false });
        collectCoverage = true;
      } catch (error) {
        process.stderr.write(`Browser coverage did not start: ${String(error)}\n`);
      }
    }
    try {
      await use(page);
    } finally {
      if (collectCoverage) {
        try {
          const entries = await page.coverage.stopJSCoverage();
          await saveBrowserCoverage(entries, `${testInfo.testId}-${testInfo.retry}`);
        } catch (error) {
          process.stderr.write(`Browser coverage was not saved: ${String(error)}\n`);
        }
      }
    }
  },
});

export { expect } from '@playwright/test';
