import {
  test,
  expect,
} from '../../support/network';

const SKILLS_INTRO = 'I\'ve worked with a wide variety of programming languages. Here are a few technologies I have been working on recently';

test.describe('public pages', () => {
  test('should render baseline skills text from the emulator', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveTitle('Pubudu Wijesooriya');
    await page.getByRole('link', { name: 'Skills' }).click();
    await expect(page.getByText(SKILLS_INTRO)).toBeVisible();
  });
});
