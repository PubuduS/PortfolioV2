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

const ADMIN_PATH = '/admin/education/certificates';
const BASELINE_COUNT = 7;
const BASELINE_FIRST_TITLE = 'Angular Level 1 Certification';
const BASELINE_UNITY_TITLE = 'Game Development with Unity';

interface CertificateFields {
  title: string;
  organization: string;
  status: 'Here' | 'In Progress';
  completedDate: string;
  credentialId: string;
  url: string;
  description: string;
}

const NEW_CERTIFICATE: CertificateFields = {
  title: 'E2E Playwright Certificate',
  organization: 'Test Academy',
  status: 'Here',
  completedDate: '03/04/2026',
  credentialId: 'E2E-001',
  url: 'https://example.test/certificates/e2e-001',
  description: 'Written by the Playwright certificate admin spec.',
};

function certificateCards(page: Page): Locator {
  return page.locator('.certificate-card');
}

function cardFor(page: Page, title: string): Locator {
  return certificateCards(page).filter({ hasText: title });
}

function dialog(page: Page): Locator {
  return page.getByRole('dialog');
}

async function openAdminCertificates(page: Page): Promise<void> {
  await page.goto(ADMIN_PATH);
  await expect(certificateCards(page)).toHaveCount(BASELINE_COUNT);
}

async function fillCertificateForm(page: Page, fields: CertificateFields): Promise<void> {
  const form = dialog(page);
  await form.getByLabel('Title', { exact: true }).fill(fields.title);
  await form.getByLabel('Issuing organization').fill(fields.organization);
  await form.getByLabel('Status').selectOption(fields.status);
  await form.getByLabel('Completed').fill(fields.completedDate);
  await form.getByLabel('Credential ID').fill(fields.credentialId);
  await form.getByLabel('Certificate link').fill(fields.url);
  await form.getByLabel('Description').fill(fields.description);
}

async function saveDialog(page: Page): Promise<void> {
  await dialog(page).getByRole('button', { name: 'Save' }).click();
  await expect(dialog(page)).toHaveCount(0);
}

async function openPublicCertificates(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
  await page.goto('/home');
  await page.getByRole('link', { name: 'Education' }).click();
  await page.getByText('Certifications', { exact: true }).click();
  await expect(page).toHaveURL(/\/content\/education\/certificates/);
}

test.describe('admin certificates', () => {
  test.beforeEach(async ({ page }) => {
    await resetBaseline();
    await signInAsAdmin(page);
  });

  test('should list the seeded certificates with an add tile', async ({ page }) => {
    await openAdminCertificates(page);

    await expect(certificateCards(page).first()).toContainText(BASELINE_FIRST_TITLE);
    await expect(cardFor(page, BASELINE_UNITY_TITLE)).toContainText('Udemy');
    await expect(cardFor(page, BASELINE_UNITY_TITLE)).toContainText('Certificate: In Progress');
    await expect(page.getByRole('button', { name: 'Add a certificate' })).toBeVisible();
  });

  test('should add a certificate, persist it, and show it on the public page', async ({ page }) => {
    await openAdminCertificates(page);

    await page.getByRole('button', { name: 'Add a certificate' }).click();
    await expect(dialog(page)).toContainText('New certificate');
    await fillCertificateForm(page, NEW_CERTIFICATE);
    await saveDialog(page);

    await expect(certificateCards(page)).toHaveCount(BASELINE_COUNT + 1);
    await expect(certificateCards(page).first()).toContainText(NEW_CERTIFICATE.title);

    await page.reload();
    await expect(certificateCards(page)).toHaveCount(BASELINE_COUNT + 1);
    const added = cardFor(page, NEW_CERTIFICATE.title);
    await expect(added).toContainText(NEW_CERTIFICATE.organization);
    await expect(added).toContainText(`Credential ID: ${NEW_CERTIFICATE.credentialId}`);

    await openPublicCertificates(page);
    const publicTile = page.locator('portfolio-v2-certifications li').filter({
      hasText: NEW_CERTIFICATE.title,
    });
    await expect(publicTile).toContainText(`Issuing Organization: ${NEW_CERTIFICATE.organization}`);
    await expect(publicTile.getByRole('link')).toHaveAttribute('href', NEW_CERTIFICATE.url);
  });

  test('should store None for a blank credential id on an in-progress certificate', async ({ page }) => {
    await openAdminCertificates(page);

    await page.getByRole('button', { name: 'Add a certificate' }).click();
    await fillCertificateForm(page, {
      ...NEW_CERTIFICATE,
      status: 'In Progress',
      completedDate: 'In progress',
      credentialId: '',
      url: '',
    });
    await saveDialog(page);

    const added = cardFor(page, NEW_CERTIFICATE.title);
    await expect(added).toContainText('Credential ID: None');
    await expect(added).toContainText('Certificate: In Progress');
  });

  test('should edit a certificate and keep its id', async ({ page }) => {
    await openAdminCertificates(page);
    const edited = `${BASELINE_UNITY_TITLE} (edited)`;

    await cardFor(page, BASELINE_UNITY_TITLE).locator('button', { hasText: 'edit' }).click();
    await expect(dialog(page)).toContainText('Edit certificate');
    await expect(dialog(page).getByLabel('Title', { exact: true })).toHaveValue(BASELINE_UNITY_TITLE);
    await expect(dialog(page).getByLabel('Credential ID')).toHaveValue('');
    await dialog(page).getByLabel('Title', { exact: true }).fill(edited);
    await saveDialog(page);

    await expect(certificateCards(page)).toHaveCount(BASELINE_COUNT);
    await page.reload();
    await expect(certificateCards(page)).toHaveCount(BASELINE_COUNT);
    await expect(cardFor(page, edited)).toContainText('Credential ID: None');
  });

  test('should keep the certificate when the delete is cancelled and remove it when confirmed', async ({ page }) => {
    await openAdminCertificates(page);

    await cardFor(page, BASELINE_UNITY_TITLE).locator('button', { hasText: 'delete' }).click();
    await expect(dialog(page)).toContainText('Delete certificate');
    await expect(dialog(page)).toContainText(BASELINE_UNITY_TITLE);
    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(certificateCards(page)).toHaveCount(BASELINE_COUNT);

    await cardFor(page, BASELINE_UNITY_TITLE).locator('button', { hasText: 'delete' }).click();
    await dialog(page).getByRole('button', { name: 'Delete' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(certificateCards(page)).toHaveCount(BASELINE_COUNT - 1);

    await page.reload();
    await expect(certificateCards(page)).toHaveCount(BASELINE_COUNT - 1);
    await expect(cardFor(page, BASELINE_UNITY_TITLE)).toHaveCount(0);
  });

  test('should not close the dialog or save while the form is invalid', async ({ page }) => {
    await openAdminCertificates(page);

    await page.getByRole('button', { name: 'Add a certificate' }).click();
    await dialog(page).getByRole('button', { name: 'Save' }).click();

    await expect(dialog(page)).toContainText('A title is required');
    await expect(dialog(page)).toContainText('A link is required once the certificate is available');

    await dialog(page).getByLabel('Certificate link').fill('not a link');
    await expect(dialog(page)).toContainText('Enter a valid http or https link');

    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(certificateCards(page)).toHaveCount(BASELINE_COUNT);
  });

  test('should give a new certificate a fresh id after a gap, so none is overwritten', async ({ page }) => {
    await openAdminCertificates(page);

    await cardFor(page, 'Web Development Bootcamp').locator('button', { hasText: 'delete' }).click();
    await dialog(page).getByRole('button', { name: 'Delete' }).click();
    await expect(certificateCards(page)).toHaveCount(BASELINE_COUNT - 1);

    await page.getByRole('button', { name: 'Add a certificate' }).click();
    await fillCertificateForm(page, NEW_CERTIFICATE);
    await saveDialog(page);

    await expect(certificateCards(page)).toHaveCount(BASELINE_COUNT);
    await expect(certificateCards(page).first()).toContainText(NEW_CERTIFICATE.title);
    await expect(cardFor(page, BASELINE_FIRST_TITLE)).toHaveCount(1);
    await expect(cardFor(page, 'Web Development Bootcamp')).toHaveCount(0);
  });
});
