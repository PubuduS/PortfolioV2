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

const SEEDED_AT = '2026-10-31 00:00:00';
const PDF = Buffer.from('%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

function rows(page: Page): Locator {
  return page.locator('admin-documents tbody tr');
}

function deleteButtons(page: Page, disabled: boolean): Locator {
  return page.locator('admin-documents').getByRole('button', { name: 'Delete', disabled });
}

async function openResume(page: Page): Promise<void> {
  const resume = page.locator('nav').getByRole('link', { name: 'Resume' });
  await expect(resume).toHaveAttribute('href', '/admin/resume');
  await resume.click();
  await expect(page).toHaveURL(/\/admin\/resume$/);
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText(SEEDED_AT);
  await expect(rows(page).first()).toContainText('resume_current');
}

async function upload(page: Page, name: string, mimeType: string, buffer: Buffer): Promise<void> {
  const input = page.locator('admin-documents input[type="file"]');
  await expect(input).toBeEnabled();
  await input.setInputFiles({ name, mimeType, buffer });
  await expect(input).toBeEnabled();
}

test.describe('admin documents', () => {
  test.beforeEach(async ({ page }) => {
    await resetBaseline();
    await signInAsAdmin(page);
  });

  test('should open the seeded resume and the cover letter page', async ({ page }) => {
    await openResume(page);
    await expect(deleteButtons(page, false)).toHaveCount(0);
    await expect(deleteButtons(page, true)).toHaveCount(1);

    const coverLetter = page.locator('nav').getByRole('link', { name: 'Cover Letter' });
    await expect(coverLetter).toHaveAttribute('href', '/admin/coverletter');
    await coverLetter.click();
    await expect(page).toHaveURL(/\/admin\/coverletter$/);
    await expect(page.locator('admin-documents h2')).toHaveText('Cover Letter');
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText(SEEDED_AT);
    await expect(rows(page).first()).toContainText('cover_letter_current');
    await expect(deleteButtons(page, true)).toHaveCount(1);
  });

  test('should promote the previous resume when the current one is deleted', async ({ page }) => {
    await openResume(page);
    await upload(page, 'extra.pdf', 'application/pdf', PDF);
    await expect(rows(page)).toHaveCount(2);
    await expect(rows(page).filter({ hasText: SEEDED_AT })).toHaveCount(1);

    await rows(page).filter({ hasText: 'resume_current' }).getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText('resume_current');
    await expect(rows(page).first()).toContainText(SEEDED_AT);
    await expect(deleteButtons(page, false)).toHaveCount(0);
    await expect(deleteButtons(page, true)).toHaveCount(1);
  });

  test('should drop the oldest resume, delete older rows, and reject a text file', async ({ page }) => {
    await openResume(page);

    await [1, 2, 3, 4].reduce(async (previous, index) => {
      await previous;
      await upload(page, `extra-${index}.pdf`, 'application/pdf', PDF);
      await expect(rows(page)).toHaveCount(index + 1);
    }, Promise.resolve());
    await expect(rows(page).filter({ hasText: SEEDED_AT })).toHaveCount(1);

    await upload(page, 'extra-5.pdf', 'application/pdf', PDF);
    await expect(rows(page)).toHaveCount(5);
    await expect(rows(page).filter({ hasText: SEEDED_AT })).toHaveCount(0);

    await [4, 3, 2, 1].reduce(async (previous, left) => {
      await previous;
      await deleteButtons(page, false).first().click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(rows(page)).toHaveCount(left);
    }, Promise.resolve());
    await expect(deleteButtons(page, false)).toHaveCount(0);
    await expect(deleteButtons(page, true)).toHaveCount(1);
    await expect(rows(page).first()).toContainText('resume_current');

    await upload(page, 'notes.txt', 'text/plain', Buffer.from('notes'));
    await expect(page.locator('admin-documents').getByRole('alert')).toHaveText('Choose a PDF file.');
    await expect(rows(page)).toHaveCount(1);
  });
});
