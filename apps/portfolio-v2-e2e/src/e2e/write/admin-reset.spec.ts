import { type Page } from '@playwright/test';

import {
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_PASSWORD,
} from '../../../../../tools/db/constants';
import { resetBaseline } from '../../../../../tools/db/reset';
import {
  expect,
  test,
} from '../../support/network';

async function openPublicAboutMe(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
  await page.goto('/home');
  await page.getByRole('link', { name: 'About Me' }).click();
}

const BASELINE_SUB_INTRO = 'When I\'m not coding my next project, I enjoy spending my time doing any on the following:';
const EDITED_SUB_INTRO = 'E2E reset marker';

test.describe('admin write and reset', () => {
  test.beforeEach(async () => {
    await resetBaseline();
  });

  test('should persist an about-me edit and restore it after reset', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: 'About Me' }).click();
    await expect(page.getByText(BASELINE_SUB_INTRO)).toBeVisible();

    await page.goto('/content/admin');
    await page.getByPlaceholder('Email').fill(TEST_ADMIN_EMAIL);
    await page.getByPlaceholder('Password').fill(TEST_ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/admin\/home/);

    await page.goto('/admin/aboutme');
    const subIntro = page.locator('textarea[formcontrolname="subIntro"]');
    await expect(subIntro).toHaveValue(BASELINE_SUB_INTRO);
    await subIntro.fill(EDITED_SUB_INTRO);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('mat-icon.success')).toBeVisible();

    await openPublicAboutMe(page);
    await expect(page.getByText(EDITED_SUB_INTRO)).toBeVisible();

    await resetBaseline();
    await openPublicAboutMe(page);
    await expect(page.getByText(BASELINE_SUB_INTRO)).toBeVisible();
    await expect(page.getByText(EDITED_SUB_INTRO)).toHaveCount(0);
  });
});
