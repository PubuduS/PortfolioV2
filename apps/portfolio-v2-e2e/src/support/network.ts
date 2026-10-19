import {
  test as base,
  type Page,
} from '@playwright/test';

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

export const test = base.extend({
  page: async ({ page }, use) => {
    await applyNetworkGuard(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
