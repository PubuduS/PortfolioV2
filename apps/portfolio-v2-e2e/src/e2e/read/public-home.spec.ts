import {
  test,
  expect,
} from '../../support/network';

const SKILLS_INTRO = 'I\'ve worked with a wide variety of programming languages. Here are a few technologies I have been working on recently';
const ABOUT_INTRO = 'My name is Pubudu. Currently, I live in Omaha, Nebraska.';

test.describe('public pages', () => {
  test('should render baseline skills text from the emulator', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveTitle('Pubudu Wijesooriya');
    await page.getByRole('link', { name: 'Skills' }).click();
    await expect(page.getByText(SKILLS_INTRO)).toBeVisible();
  });

  test('should render skills when that page is opened directly', async ({ page }) => {
    await page.goto('/content/skills');

    await expect(page.getByText(SKILLS_INTRO)).toBeVisible();
  });

  test('should render about text when that page is opened directly', async ({ page }) => {
    await page.goto('/content/aboutme');

    await expect(page.getByText(ABOUT_INTRO)).toBeVisible();
  });

  test('should paint the home still without the education scripts', async ({ page }) => {
    await page.goto('/home');

    await expect(page.locator('script[src*="TweenMax"]')).toHaveCount(0);
    await expect(page.locator('script[src*="flower.js"]')).toHaveCount(0);
    await expect(page.locator('video')).toHaveAttribute('preload', 'none');
    await expect(page.locator('video')).not.toHaveAttribute('autoplay');
    const iconFont = await page.locator('link[href*="Material+Symbols"]').getAttribute('href');
    expect(iconFont).toContain('icon_names=');
    expect(iconFont).toContain('celebration');
    const styles = await page.evaluate(() => [...document.styleSheets].map((sheet) => {
      try {
        return [...sheet.cssRules].map((rule) => rule.cssText).join('\n');
      } catch {
        return '';
      }
    }).join('\n'));
    expect(styles).toContain('Montserrat:wght@500;600;700;800');
    expect(styles).not.toContain('wght@100');
  });

  test('should load the flower scripts on the education page', async ({ page }) => {
    await page.goto('/content/education');

    await expect(page.locator('script[src*="TweenMax"]')).toHaveCount(1);
    await expect(page.locator('script[src*="flower.js"]')).toHaveCount(1);
  });
});
