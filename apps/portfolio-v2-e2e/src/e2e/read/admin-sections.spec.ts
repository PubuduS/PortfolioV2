import { signInAsAdmin } from '../../support/admin';
import {
  expect,
  test,
} from '../../support/network';

const SKILLS_INTRO = 'I\'ve worked with a wide variety of programming languages. '
  + 'Here are a few technologies I have been working on recently';
const GAIT_DESCRIPTION = 'provides gait training to patients';

test.describe('admin section editors', () => {
  test('should show the landing editor after sign-in', async ({ page }) => {
    await signInAsAdmin(page);

    await expect(page.getByRole('heading', { name: 'Landing Page' })).toBeVisible();
    await expect(page.locator('select[formcontrolname="seasonsPicker"]')).toHaveValue('winter');
    await expect(page.getByRole('button', { name: 'Upload' })).toBeVisible();
  });

  test('should open the skills editor from the public page', async ({ page }) => {
    await signInAsAdmin(page);
    await page.locator('#previewMode').click();
    await page.getByRole('link', { name: 'Skills' }).click();
    await expect(page.getByText(SKILLS_INTRO)).toBeVisible();

    await page.locator('#previewMode').click();

    await expect(page).toHaveURL(/\/admin\/skills$/);
    await expect(page.locator('textarea[formcontrolname="skillsIntro"]')).toHaveValue(SKILLS_INTRO);
    await expect(page.getByRole('heading', { name: 'Angular: 80%' })).toBeVisible();
  });

  test('should open the experience editor on the selected job', async ({ page }) => {
    await signInAsAdmin(page);
    await page.locator('#previewMode').click();
    await page.getByRole('link', { name: 'Experience' }).click();
    await page.getByRole('tab', { name: 'Java Institute' }).click();
    await expect(page.getByRole('heading', {
      name: 'Software Engineer (JAVA) Java Institute',
    })).toBeVisible();

    await page.locator('#previewMode').click();

    await expect(page).toHaveURL(/\/admin\/experience$/);
    await page.getByRole('tab', { name: 'Java Institute' }).click();
    await expect(page.locator('input[formcontrolname="employer"]')).toHaveValue('Java Institute');
    await expect(page.locator('input[formcontrolname="position"]')).toHaveValue(
      'Software Engineer (JAVA) Java Institute',
    );
  });

  test('should open the portfolio editor from the public projects', async ({ page }) => {
    await signInAsAdmin(page);
    await page.locator('#previewMode').click();
    await page.getByRole('link', { name: 'Portfolio' }).click();
    await expect(page.getByRole('heading', { name: 'Auditor Tool' })).toBeVisible();

    await page.locator('#previewMode').click();

    await expect(page).toHaveURL(/\/admin\/portfolio$/);
    await expect(page.getByRole('heading', { name: 'SOME OF MY PROJECTS' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Auditor Tool' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Featured Projects' })).toBeVisible();
  });

  test('should open the featured-project editor from its public page', async ({ page }) => {
    await signInAsAdmin(page);
    await page.locator('#previewMode').click();
    await page.getByRole('link', { name: 'Portfolio' }).click();
    await page.locator('li').filter({ hasText: 'Featured Projects' }).getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Gait Trainer' })).toBeVisible();
    await expect(page.getByText(GAIT_DESCRIPTION)).toBeVisible();

    await page.locator('#previewMode').click();

    await expect(page).toHaveURL(/\/admin\/portfolio\/featured-projects$/);
    await expect(page.getByRole('heading', { name: 'Gait Trainer' })).toBeVisible();
    await expect(page.getByText(GAIT_DESCRIPTION)).toBeVisible();
  });
});
