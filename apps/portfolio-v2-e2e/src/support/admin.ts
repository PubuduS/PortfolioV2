import { type Page } from '@playwright/test';

import {
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_PASSWORD,
} from '@portfolio-v2/tools/db/constants';
import { expect } from './network';

/**
 * Signs in as the emulator admin through the login page and waits for the admin home.
 * @param page Playwright page.
 */
export async function signInAsAdmin(page: Page): Promise<void> {
  await page.goto('/content/admin');
  await page.getByPlaceholder('Email').fill(TEST_ADMIN_EMAIL);
  await page.getByPlaceholder('Password').fill(TEST_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/admin\/home/);
}
