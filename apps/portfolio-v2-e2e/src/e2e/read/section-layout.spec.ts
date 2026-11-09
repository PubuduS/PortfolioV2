import {
  expect,
  test,
  type Page,
} from '../../support/network';

/**
 * Open a nav section the way a visitor does, including the compact menu.
 * @param page Playwright page
 * @param width viewport width
 * @param name nav link name
 * @param url path the click should reach
 * @param heading visible heading
 */
async function openSection(
  page: Page,
  width: number,
  name: string,
  url: RegExp,
  heading: string,
): Promise<void> {
  await page.setViewportSize({ width, height: 800 });
  await page.goto('/home');
  if (width < 1200) {
    await page.getByRole('button', { name: 'Open menu' }).click();
  }
  await page.getByRole('link', { name, exact: true }).click();
  await expect(page).toHaveURL(url);
  await expect(page.getByRole('heading', { name: heading })).toBeVisible();
}

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

test.describe('skills, portfolio, and featured project layout', () => {
  test('should keep skills inside the phone', async ({ page }) => {
    await openSection(page, 390, 'Skills', /\/content\/skills$/, 'Tecnical Skills');
    const frame = await pageFrame(page);

    expect(frame.scrollWidth).toBe(frame.clientWidth);
    expect(frame.headingTop).toBeGreaterThanOrEqual(frame.headerBottom - 1);
    await expect(page.locator('.progress').first()).toBeVisible();
  });

  test('should keep skills below the header on a laptop', async ({ page }) => {
    await openSection(page, 1280, 'Skills', /\/content\/skills$/, 'Tecnical Skills');
    const frame = await pageFrame(page);

    expect(frame.scrollWidth).toBe(frame.clientWidth);
    expect(frame.headingTop).toBeGreaterThanOrEqual(frame.headerBottom - 1);
  });

  test('should stack portfolio tiles on a phone', async ({ page }) => {
    await openSection(page, 390, 'Portfolio', /\/content\/portfolio$/, 'SOME OF MY PROJECTS');
    const box = await page.evaluate(() => {
      const list = document.querySelector('.my-projects > ul')?.getBoundingClientRect();
      const tile = document.querySelector('.my-projects > ul > li')?.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        headerBottom: document.querySelector('.pw-header-wrap')?.getBoundingClientRect().bottom ?? 0,
        headingTop: document.querySelector('h2')?.getBoundingClientRect().top ?? 0,
        listWidth: list?.width ?? 0,
        tileWidth: tile?.width ?? 0,
      };
    });

    expect(box.scrollWidth).toBe(box.clientWidth);
    expect(box.headingTop).toBeGreaterThanOrEqual(box.headerBottom - 1);
    expect(box.tileWidth).toBeGreaterThan(box.listWidth * 0.8);
  });

  test('should place portfolio tiles in a row on a laptop', async ({ page }) => {
    await openSection(page, 1280, 'Portfolio', /\/content\/portfolio$/, 'SOME OF MY PROJECTS');
    const box = await page.evaluate(() => {
      const list = document.querySelector('.my-projects > ul')?.getBoundingClientRect();
      const tile = document.querySelector('.my-projects > ul > li')?.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        listWidth: list?.width ?? 0,
        tileWidth: tile?.width ?? 0,
      };
    });

    expect(box.scrollWidth).toBe(box.clientWidth);
    expect(box.tileWidth).toBeLessThan(box.listWidth * 0.5);
  });

  test('should stack a featured caption under its image on a phone', async ({ page }) => {
    await openSection(page, 390, 'Portfolio', /\/content\/portfolio$/, 'SOME OF MY PROJECTS');
    await page.locator('li').filter({ hasText: 'Featured Projects' }).getByRole('button').click();
    await expect(page).toHaveURL(/\/content\/portfolio\/featured-projects$/);
    await expect(page.getByRole('heading', { name: 'Gait Trainer' })).toBeVisible();

    const box = await page.evaluate(() => {
      const image = document.querySelector('.featured-project img')?.getBoundingClientRect();
      const caption = document.querySelector('.featured-project figcaption');
      const captionBox = caption?.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        headerBottom: document.querySelector('.pw-header-wrap')?.getBoundingClientRect().bottom ?? 0,
        headingTop: document.querySelector('h2')?.getBoundingClientRect().top ?? 0,
        imageBottom: image?.bottom ?? 0,
        captionTop: captionBox?.top ?? 0,
        captionPosition: caption ? getComputedStyle(caption).position : '',
      };
    });

    expect(box.scrollWidth).toBe(box.clientWidth);
    expect(box.headingTop).toBeGreaterThanOrEqual(box.headerBottom - 1);
    expect(box.captionPosition).toBe('static');
    expect(box.captionTop).toBeGreaterThanOrEqual(box.imageBottom - 1);
  });

  test('should overlay a featured caption on a laptop', async ({ page }) => {
    await openSection(page, 1280, 'Portfolio', /\/content\/portfolio$/, 'SOME OF MY PROJECTS');
    await page.locator('li').filter({ hasText: 'Featured Projects' }).getByRole('button').click();
    await expect(page).toHaveURL(/\/content\/portfolio\/featured-projects$/);

    const box = await page.evaluate(() => {
      const image = document.querySelector('.featured-project img')?.getBoundingClientRect();
      const caption = document.querySelector('.featured-project figcaption');
      const captionBox = caption?.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        imageTop: image?.top ?? 0,
        imageBottom: image?.bottom ?? 0,
        captionTop: captionBox?.top ?? 0,
        captionPosition: caption ? getComputedStyle(caption).position : '',
      };
    });

    expect(box.scrollWidth).toBe(box.clientWidth);
    expect(box.captionPosition).toBe('absolute');
    expect(box.captionTop).toBeLessThan(box.imageBottom);
  });
});
