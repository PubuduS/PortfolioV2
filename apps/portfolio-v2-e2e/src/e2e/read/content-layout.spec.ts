import { type Page } from '@playwright/test';

import {
  expect,
  test,
} from '../../support/network';

/**
 * @param page Playwright page
 * @returns the page frame against the fixed header
 */
async function pageFrame(page: Page): Promise<{
  scrollWidth: number;
  clientWidth: number;
  headerBottom: number;
  headingTop: number;
}> {
  return page.evaluate(() => {
    const header = document.querySelector('.pw-header-wrap')?.getBoundingClientRect();
    const heading = document.querySelector('h2')?.getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      headerBottom: header?.bottom ?? 0,
      headingTop: heading?.top ?? 0,
    };
  });
}

/**
 * Open a public page and check that it fits the viewport and clears the header.
 * @param page Playwright page
 * @param width viewport width
 * @param url path to open
 * @param heading visible heading
 */
async function expectPageFits(
  page: Page,
  width: number,
  url: string,
  heading: string,
): Promise<void> {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(url);
  await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  const frame = await pageFrame(page);

  expect(frame.scrollWidth).toBe(frame.clientWidth);
  expect(frame.headingTop).toBeGreaterThanOrEqual(frame.headerBottom - 1);
}

test.describe('education, about, and contact layout', () => {
  [390, 1280].forEach((width) => {
    const device = width === 390 ? 'phone' : 'laptop';

    test(`should keep degrees inside a ${device}`, async ({ page }) => {
      await expectPageFits(page, width, '/content/education/degrees', 'EDUCATION AND CREDENTIALS');
    });

    test(`should keep certificates inside a ${device}`, async ({ page }) => {
      await expectPageFits(page, width, '/content/education/certificates', 'Certifications');
    });

    test(`should keep publications inside a ${device}`, async ({ page }) => {
      await expectPageFits(page, width, '/content/education/publications', 'Publications');
    });

    test(`should keep the cover letter inside a ${device}`, async ({ page }) => {
      await expectPageFits(page, width, '/content/coverletter', 'Cover Letter Generator');
    });

    test(`should keep contact inside a ${device}`, async ({ page }) => {
      await expectPageFits(page, width, '/content/contact', "LET'S GET IN TOUCH");
    });
  });

  test('should stack the about photo above the text on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/content/aboutme');
    await expect(page.getByRole('heading', { name: 'ABOUT ME' })).toBeVisible();
    const box = await page.evaluate(() => {
      const photo = document.querySelector('.about-img')?.getBoundingClientRect();
      const heading = document.querySelector('h2')?.getBoundingClientRect();
      const header = document.querySelector('.pw-header-wrap')?.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        headerBottom: header?.bottom ?? 0,
        photoBottom: photo?.bottom ?? 0,
        headingTop: heading?.top ?? 0,
      };
    });

    expect(box.scrollWidth).toBe(box.clientWidth);
    expect(box.headingTop).toBeGreaterThanOrEqual(box.headerBottom - 1);
    expect(box.headingTop).toBeGreaterThanOrEqual(box.photoBottom - 1);
  });

  test('should place the about photo beside the text on a laptop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/content/aboutme');
    await expect(page.getByRole('heading', { name: 'ABOUT ME' })).toBeVisible();
    const box = await page.evaluate(() => {
      const photo = document.querySelector('.about-img img')?.getBoundingClientRect();
      const heading = document.querySelector('h2')?.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        photoRight: photo?.right ?? 0,
        headingLeft: heading?.left ?? 0,
        headingTop: heading?.top ?? 0,
        photoBottom: photo?.bottom ?? 0,
      };
    });

    expect(box.scrollWidth).toBe(box.clientWidth);
    expect(box.headingLeft).toBeGreaterThanOrEqual(box.photoRight - 1);
    expect(box.headingTop).toBeLessThan(box.photoBottom);
  });
});
