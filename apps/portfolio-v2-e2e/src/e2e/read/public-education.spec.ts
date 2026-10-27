import {
  expect,
  test,
} from '../../support/network';

const BASELINE_INSTITUTES = [
  'University of Nebraska at Omaha',
  'South Dakota State University',
  'American College of Higher Education associated with Broward College',
];

test.describe('public education pages', () => {
  test('should open the degrees page from the education hub', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: 'Education' }).click();
    await page.locator('portfolio-v2-flower-animation').filter({ hasText: 'Education' })
      .getByText('Education', { exact: true }).click();

    await expect(page).toHaveURL(/\/content\/education\/degrees$/);
    await expect(page.locator('portfolio-v2-education .uni-wrap h4')).toHaveText(BASELINE_INSTITUTES);
  });

  test('should send the old education url to the degrees page', async ({ page }) => {
    await page.goto('/content/education/education');

    await expect(page).toHaveURL(/\/content\/education\/degrees$/);
  });
});
