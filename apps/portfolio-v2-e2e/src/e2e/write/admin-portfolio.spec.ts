import {
  type Locator,
  type Page,
} from '@playwright/test';

import { resetBaseline } from '@portfolio-v2/tools/db/reset';
import { signInAsAdmin } from '../../support/admin';
import {
  expect,
  test,
} from '../../support/network';

const TILE_TITLE = 'E2E Portfolio Tile';
const TILE_DESCRIPTION = 'Added without an icon so delete must still finish.';
const SEEDED_TILE = 'Auditor Tool';

function dialog(page: Page): Locator {
  return page.getByRole('dialog');
}

function projectTile(page: Page, title: string): Locator {
  return page.locator('.my-projects li').filter({
    has: page.locator('h3', { hasText: new RegExp(`^${title}$`) }),
  });
}

async function openAdminPortfolio(page: Page): Promise<void> {
  await page.goto('/admin/portfolio');
  await expect(projectTile(page, SEEDED_TILE)).toBeVisible();
}

async function addTile(page: Page): Promise<void> {
  await projectTile(page, 'Add').getByRole('button').click();
  const editor = dialog(page);
  await expect(editor.getByRole('heading', { name: 'Tile Editor' })).toBeVisible();
  await editor.getByLabel('Title').fill(TILE_TITLE);
  await editor.getByLabel('Description').fill(TILE_DESCRIPTION);
  await editor.getByRole('button', { name: 'Add' }).click();
  await expect(editor.getByRole('button', { name: 'Next' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toHaveCount(0);
  await expect(projectTile(page, TILE_TITLE)).toBeVisible();
}

test.describe('admin portfolio tiles', () => {
  test.beforeEach(async ({ page }) => {
    await resetBaseline();
    await signInAsAdmin(page);
  });

  test('should open the card editor when Next is clicked', async ({ page }) => {
    await openAdminPortfolio(page);
    await projectTile(page, 'Add').getByRole('button').click();
    const editor = dialog(page);
    await expect(editor.getByRole('heading', { name: 'Tile Editor' })).toBeVisible();
    await editor.getByLabel('Title').fill(TILE_TITLE);
    await editor.getByLabel('Description').fill(TILE_DESCRIPTION);
    await editor.getByRole('button', { name: 'Add' }).click();
    await editor.getByRole('button', { name: 'Next' }).click();

    const card = dialog(page);
    await expect(card.getByRole('heading', { name: 'Add a New Record' })).toBeVisible();
    await expect(card.getByRole('heading', { name: 'Tile Editor' })).toHaveCount(0);
    await expect(card.getByLabel('Description')).toBeVisible();
    await expect(card.getByText('Technologies:')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Add' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
  });

  test('should remove a new tile only after delete is confirmed', async ({ page }) => {
    await openAdminPortfolio(page);
    await addTile(page);

    await projectTile(page, TILE_TITLE).locator('button').first().click();
    const confirmation = dialog(page);
    await expect(confirmation).toContainText('This action cannot be undone');
    await expect(confirmation).toContainText(TILE_TITLE);
    await expect(confirmation).toContainText(TILE_DESCRIPTION);
    await expect(confirmation).not.toContainText('No record to delete');
    await expect(projectTile(page, TILE_TITLE)).toBeVisible();

    await confirmation.getByRole('button', { name: 'Delete' }).click();

    await expect(confirmation).toHaveCount(0);
    await expect(projectTile(page, TILE_TITLE)).toHaveCount(0);
    await expect(projectTile(page, SEEDED_TILE)).toBeVisible();

    await page.reload();
    await expect(projectTile(page, TILE_TITLE)).toHaveCount(0);
    await expect(projectTile(page, SEEDED_TILE)).toBeVisible();
  });
});
