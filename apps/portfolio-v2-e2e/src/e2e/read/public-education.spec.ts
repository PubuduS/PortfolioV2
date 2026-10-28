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

  test('should open a publication and its details from the education hub', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: 'Education' }).click();
    await page.locator('portfolio-v2-flower-animation').filter({ hasText: 'Publications' })
      .getByText('Publications', { exact: true }).click();

    await expect(page).toHaveURL(/\/content\/education\/publications$/);
    const card = page.locator('portfolio-v2-publications .publication-card').filter({
      hasText: 'ARWalker',
    });
    await expect(card).toContainText('Gait Rehabilitation, Mixed Reality, HoloLens 2');
    await expect(card.getByRole('img', { name: 'Publication Photo' })).toBeVisible();
    await expect(card.getByRole('link', { name: 'Download' })).toHaveAttribute('download', 'ARWalker');

    await card.locator('a', { hasText: 'More' }).click();
    const details = page.getByRole('dialog');
    await expect(details).toContainText('ARWalker: A Virtual Walking Companion Application');
    await expect(details).toContainText('Authors:');
    await expect(details).toContainText('Abstract:');
    await expect(details).toContainText('Cite:');
    await expect(details.getByRole('button', { name: 'Copy' })).toBeVisible();
  });
});
