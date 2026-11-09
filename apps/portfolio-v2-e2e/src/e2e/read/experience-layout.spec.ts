import {
  expect,
  test,
  type Page,
} from '../../support/network';

/**
 * Open experience the way a visitor does, including the compact menu.
 * @param page Playwright page
 * @param width viewport width
 */
async function openExperience(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 800 });
  await page.goto('/home');
  if (width < 1200) {
    await page.getByRole('button', { name: 'Open menu' }).click();
  }
  await page.getByRole('link', { name: 'Experience', exact: true }).click();
  await expect(page).toHaveURL(/\/content\/experience$/);
  await expect(page.getByRole('heading', { name: 'WORK EXPERIENCE' })).toBeVisible();
}

/**
 * @param page Playwright page
 * @returns geometry of the experience section
 */
async function experienceBox(page: Page): Promise<{
  scrollWidth: number;
  clientWidth: number;
  headerBottom: number;
  headingTop: number;
  listTop: number;
  detailTop: number;
  listWidth: number;
  sectionWidth: number;
}> {
  return page.evaluate(() => {
    const header = document.querySelector('.pw-header-wrap')?.getBoundingClientRect();
    const heading = document.querySelector('h2')?.getBoundingClientRect();
    const list = document.querySelector('.tabs-wrapper > .nav')?.getBoundingClientRect();
    const detail = document.querySelector('.tab-content')?.getBoundingClientRect();
    const section = document.querySelector('.experience-section')?.getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      headerBottom: header?.bottom ?? 0,
      headingTop: heading?.top ?? 0,
      listTop: list?.top ?? 0,
      detailTop: detail?.top ?? 0,
      listWidth: list?.width ?? 0,
      sectionWidth: section?.width ?? 0,
    };
  });
}

test.describe('experience layout', () => {
  test('should stack the job list on a phone', async ({ page }) => {
    await openExperience(page, 390);
    const box = await experienceBox(page);

    expect(box.scrollWidth).toBe(box.clientWidth);
    expect(box.headingTop).toBeGreaterThanOrEqual(box.headerBottom - 1);
    expect(box.detailTop).toBeGreaterThan(box.listTop);
    expect(box.listWidth).toBeGreaterThan(box.sectionWidth * 0.8);
  });

  test('should place the job list beside the detail on a laptop', async ({ page }) => {
    await openExperience(page, 1280);
    const box = await experienceBox(page);

    expect(box.scrollWidth).toBe(box.clientWidth);
    expect(box.headingTop).toBeGreaterThanOrEqual(box.headerBottom - 1);
    expect(Math.abs(box.detailTop - box.listTop)).toBeLessThan(24);
    expect(box.listWidth).toBeGreaterThan(180);
    expect(box.listWidth).toBeLessThan(box.sectionWidth * 0.5);
  });
});
