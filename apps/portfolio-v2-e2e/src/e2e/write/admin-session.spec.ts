import { signInAsAdmin } from '../../support/admin';
import {
  expect,
  test,
} from '../../support/network';

const AUTH_TARGET_STORAGE_KEY = 'portfolio-v2.auth-target';

test.describe('admin session', () => {
  test('should ignore an admin flag saved for the live backend', async ({ page }) => {
    await page.goto('/home');
    await page.evaluate((key) => {
      localStorage.setItem('stateBanks', JSON.stringify({
        isAdmin: true,
        isPreviewMode: true,
      }));
      localStorage.setItem(key, 'live');
    }, AUTH_TARGET_STORAGE_KEY);

    await page.goto('/admin/home');

    await expect(page).toHaveURL(/\/content\/admin/);
    await expect(page.locator('#logout')).toHaveCount(0);
  });

  test('should drop an emulator session when the saved backend is live', async ({ page }) => {
    await signInAsAdmin(page);
    await expect(page.locator('#logout')).toBeVisible();
    await page.evaluate((key) => {
      localStorage.setItem(key, 'live');
    }, AUTH_TARGET_STORAGE_KEY);

    await page.goto('/admin/home');

    await expect(page).toHaveURL(/\/content\/admin/);
    await expect(page.locator('#logout')).toHaveCount(0);
    await signInAsAdmin(page);
    await expect(page.locator('#logout')).toBeVisible();
  });

  test('should reject a password that does not belong to the emulator', async ({ page }) => {
    await page.goto('/content/admin');
    await page.getByPlaceholder('Email').fill('admin@example.test');
    await page.getByPlaceholder('Password').fill('live-password-not-for-emulator');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Your email or password is wrong')).toBeVisible();
    await expect(page).toHaveURL(/\/content\/admin/);
    await expect(page.locator('#logout')).toHaveCount(0);
  });

  test('should log out from the logout button and block admin routes', async ({ page }) => {
    await signInAsAdmin(page);
    await page.locator('#logout').click();

    await expect(page).toHaveURL(/\/home/);
    await page.goto('/admin/home');
    await expect(page).toHaveURL(/\/content\/admin/);
    await expect(page.locator('#logout')).toHaveCount(0);
  });

  test('should log out after five minutes without activity', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-01T12:00:00Z') });
    await signInAsAdmin(page);
    await expect(page.locator('#logout')).toBeVisible();

    await page.clock.fastForward(5 * 60 * 1000);

    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('#logout')).toHaveCount(0);
  });

  test('should keep the session when the admin is still active', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-01T12:00:00Z') });
    await signInAsAdmin(page);

    await page.clock.fastForward(3 * 60 * 1000);
    await page.keyboard.press('Shift');
    await page.clock.fastForward(3 * 60 * 1000);

    await expect(page).toHaveURL(/\/admin\/home/);
    await expect(page.locator('#logout')).toBeVisible();

    await page.clock.fastForward(3 * 60 * 1000);

    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('#logout')).toHaveCount(0);
  });
});
