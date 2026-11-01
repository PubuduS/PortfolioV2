import {
  expect,
  test,
} from '../../support/network';

const JAVA_INSTITUTE = 'Java Institute';
const AUDITOR_DESCRIPTION = 'The QAM units use a bash script';
const GAIT_DESCRIPTION = 'provides gait training to patients';

test.describe('public sections', () => {
  test('should show a baseline job from the experience nav', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: 'Experience' }).click();

    await expect(page).toHaveURL(/\/content\/experience$/);
    await expect(page.getByRole('heading', { name: 'WORK EXPERIENCE' })).toBeVisible();
    await page.getByRole('tab', { name: JAVA_INSTITUTE }).click();
    await expect(page.getByRole('heading', {
      name: 'Software Engineer (JAVA) Java Institute',
    })).toBeVisible();
    await expect(page.getByText('inventory control software for Sapna')).toBeVisible();
  });

  test('should open a portfolio project from its tile', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: 'Portfolio' }).click();

    await expect(page).toHaveURL(/\/content\/portfolio$/);
    await expect(page.getByRole('heading', { name: 'SOME OF MY PROJECTS' })).toBeVisible();
    await page.locator('li').filter({ hasText: 'Auditor Tool' }).getByRole('button').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Auditor Tool' })).toBeVisible();
    await expect(dialog.getByText(AUDITOR_DESCRIPTION)).toBeVisible();
  });

  test('should open featured projects from the portfolio tile', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: 'Portfolio' }).click();
    await page.locator('li').filter({ hasText: 'Featured Projects' }).getByRole('button').click();

    await expect(page).toHaveURL(/\/content\/portfolio\/featured-projects$/);
    await expect(page.getByRole('heading', { name: 'Gait Trainer' })).toBeVisible();
    await expect(page.getByText(GAIT_DESCRIPTION)).toBeVisible();
  });

  test('should open certificates from the education hub', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: 'Education' }).click();
    await page.locator('portfolio-v2-flower-animation').filter({ hasText: 'Certifications' })
      .getByText('Certifications', { exact: true }).click();

    await expect(page).toHaveURL(/\/content\/education\/certificates$/);
    await expect(page.getByRole('heading', { name: 'Certifications' })).toBeVisible();
    await expect(page.getByText('Neural Network and Deep Learning')).toBeVisible();
  });

  test('should generate a cover letter once the company name is valid', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: 'Cover Letter' }).click();

    await expect(page).toHaveURL(/\/content\/coverletter$/);
    await expect(page.getByRole('heading', { name: 'Cover Letter Generator' })).toBeVisible();
    const generate = page.getByRole('button', { name: 'Generate' });
    await expect(generate).toBeDisabled();

    await page.getByPlaceholder('Company Name').fill('Acme');
    await expect(generate).toBeEnabled();
    const downloadPromise = page.waitForEvent('download');
    await generate.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('PWijesooriya_Cover_Letter.docx');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('should enter and leave party mode from the header button', async ({ page }) => {
    await page.goto('/home');
    await page.locator('#partyMode').click();

    await expect(page).toHaveURL(/\/content\/party-mode$/);
    await expect(page.getByRole('heading', { name: 'PUBUDU WIJESOORIYA' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'SOFTWARE ENGINEER' })).toBeVisible();

    await page.locator('#partyMode').click();

    await expect(page).toHaveURL(/\/content\/aboutme$/);
    await expect(page.getByRole('heading', { name: 'PUBUDU WIJESOORIYA' })).toHaveCount(0);
  });

  test('should show the missing page for an unknown address', async ({ page }) => {
    await page.goto('/no-such-page');

    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
  });
});
