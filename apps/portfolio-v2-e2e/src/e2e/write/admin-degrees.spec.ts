import {
  type Locator,
  type Page,
} from '@playwright/test';

import { resetBaseline } from '../../../../../tools/db/reset';
import { signInAsAdmin } from '../../support/admin';
import {
  expect,
  test,
} from '../../support/network';

const ADMIN_PATH = '/admin/education/degrees';
const BASELINE_COUNT = 3;
const BASELINE_FIRST_TITLE = 'University of Nebraska at Omaha';
const BASELINE_MIDDLE_TITLE = 'South Dakota State University';

interface DegreeFields {
  title: string;
  degree: string;
  period: string;
  gpa: string;
  awards: string;
  extra: string;
  credits: string;
  graduated: string;
}

const NEW_DEGREE: DegreeFields = {
  title: 'E2E Playwright University',
  degree: 'DOCTOR OF PHILOSOPHY (PhD) IN TESTING',
  period: '2025 - 2027',
  gpa: '4.000',
  awards: 'Fall 2026',
  extra: 'Summa cum laude',
  credits: '60/60',
  graduated: '01st of May 2027',
};

function degreeCards(page: Page): Locator {
  return page.locator('.degree-card');
}

function cardFor(page: Page, title: string): Locator {
  // Match the heading: another record's text can mention an institute by name.
  return degreeCards(page).filter({ has: page.getByRole('heading', { name: title }) });
}

function dialog(page: Page): Locator {
  return page.getByRole('dialog');
}

async function openAdminDegrees(page: Page): Promise<void> {
  await page.goto(ADMIN_PATH);
  await expect(degreeCards(page)).toHaveCount(BASELINE_COUNT);
}

async function openNewDegreeDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Add a degree' }).click();
  await expect(dialog(page)).toContainText('New degree');
  // The dialog focuses the first field after it opens. Typing earlier can land in the wrong field.
  await expect(dialog(page).getByLabel('Institute', { exact: true })).toBeFocused();
}

async function fillDegreeForm(page: Page, fields: DegreeFields): Promise<void> {
  const form = dialog(page);
  await form.getByLabel('Institute', { exact: true }).fill(fields.title);
  await form.getByLabel('Degree', { exact: true }).fill(fields.degree);
  await form.getByLabel('Period', { exact: true }).fill(fields.period);
  await form.getByLabel('GPA', { exact: true }).fill(fields.gpa);
  await form.getByLabel('Awarded', { exact: true }).fill(fields.awards);
  await form.getByLabel('Honors', { exact: true }).fill(fields.extra);
  await form.getByLabel('Credits', { exact: true }).fill(fields.credits);
  await form.getByLabel('Graduated', { exact: true }).fill(fields.graduated);
}

async function saveDialog(page: Page): Promise<void> {
  await dialog(page).getByRole('button', { name: 'Save' }).click();
  await expect(dialog(page)).toHaveCount(0);
}

async function openPublicDegrees(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
  await page.goto('/home');
  await page.getByRole('link', { name: 'Education' }).click();
  await page.locator('portfolio-v2-flower-animation').filter({ hasText: 'Education' })
    .getByText('Education', { exact: true }).click();
  await expect(page).toHaveURL(/\/content\/education\/degrees/);
}

test.describe('admin degrees', () => {
  test.beforeEach(async ({ page }) => {
    await resetBaseline();
    await signInAsAdmin(page);
  });

  test('should list the seeded degrees with an add tile', async ({ page }) => {
    await openAdminDegrees(page);

    await expect(degreeCards(page).first()).toContainText(BASELINE_FIRST_TITLE);
    await expect(cardFor(page, BASELINE_MIDDLE_TITLE)).toContainText('2016 - 2019');
    await expect(cardFor(page, BASELINE_MIDDLE_TITLE)).toContainText('GPA: 3.537');
    await expect(page.getByRole('button', { name: 'Add a degree' })).toBeVisible();
  });

  test('should add a degree, persist it, and show it on the public page', async ({ page }) => {
    await openAdminDegrees(page);

    await openNewDegreeDialog(page);
    await fillDegreeForm(page, NEW_DEGREE);
    await saveDialog(page);

    await expect(degreeCards(page)).toHaveCount(BASELINE_COUNT + 1);
    await expect(degreeCards(page).first()).toContainText(NEW_DEGREE.title);

    await page.reload();
    await expect(degreeCards(page)).toHaveCount(BASELINE_COUNT + 1);
    const added = cardFor(page, NEW_DEGREE.title);
    await expect(added).toContainText(NEW_DEGREE.degree);
    await expect(added).toContainText(`Honors: ${NEW_DEGREE.extra}`);

    await openPublicDegrees(page);
    const publicTile = page.locator('portfolio-v2-education .uni-wrap').filter({
      has: page.getByRole('heading', { name: NEW_DEGREE.title }),
    });
    await expect(publicTile).toContainText(NEW_DEGREE.period);
    await expect(publicTile).toContainText(`GPA: ${NEW_DEGREE.gpa}`);
    await expect(publicTile).toContainText(`Honors: ${NEW_DEGREE.extra}`);
  });

  test('should save a degree without honors and leave the row out', async ({ page }) => {
    await openAdminDegrees(page);

    await openNewDegreeDialog(page);
    await fillDegreeForm(page, { ...NEW_DEGREE, extra: '' });
    await saveDialog(page);

    await expect(cardFor(page, NEW_DEGREE.title)).not.toContainText('Honors:');
  });

  test('should edit a degree and keep its id', async ({ page }) => {
    await openAdminDegrees(page);
    const edited = `${BASELINE_MIDDLE_TITLE} (edited)`;

    await cardFor(page, BASELINE_MIDDLE_TITLE).locator('button', { hasText: 'edit' }).click();
    await expect(dialog(page)).toContainText('Edit degree');
    await expect(dialog(page).getByLabel('Institute', { exact: true })).toHaveValue(BASELINE_MIDDLE_TITLE);
    await expect(dialog(page).getByLabel('Honors', { exact: true })).toHaveValue('');
    await dialog(page).getByLabel('Institute', { exact: true }).fill(edited);
    await saveDialog(page);

    await expect(degreeCards(page)).toHaveCount(BASELINE_COUNT);
    await page.reload();
    await expect(degreeCards(page)).toHaveCount(BASELINE_COUNT);
    await expect(cardFor(page, edited)).toContainText('GPA: 3.537');
  });

  test('should keep the degree when the delete is cancelled and remove it when confirmed', async ({ page }) => {
    await openAdminDegrees(page);

    await cardFor(page, BASELINE_MIDDLE_TITLE).locator('button', { hasText: 'delete' }).click();
    await expect(dialog(page)).toContainText('Delete degree');
    await expect(dialog(page)).toContainText(BASELINE_MIDDLE_TITLE);
    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(degreeCards(page)).toHaveCount(BASELINE_COUNT);

    await cardFor(page, BASELINE_MIDDLE_TITLE).locator('button', { hasText: 'delete' }).click();
    await dialog(page).getByRole('button', { name: 'Delete' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(degreeCards(page)).toHaveCount(BASELINE_COUNT - 1);

    await page.reload();
    await expect(degreeCards(page)).toHaveCount(BASELINE_COUNT - 1);
    await expect(cardFor(page, BASELINE_MIDDLE_TITLE)).toHaveCount(0);
  });

  test('should not close the dialog or save while the form is invalid', async ({ page }) => {
    await openAdminDegrees(page);

    await page.getByRole('button', { name: 'Add a degree' }).click();
    await dialog(page).getByRole('button', { name: 'Save' }).click();

    await expect(dialog(page)).toContainText('An institute name is required');
    await expect(dialog(page)).toContainText('A degree name is required');
    await expect(dialog(page)).toContainText('A graduation date is required');

    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(degreeCards(page)).toHaveCount(BASELINE_COUNT);
  });

  test('should give a new degree a fresh id after a gap, so none is overwritten', async ({ page }) => {
    await openAdminDegrees(page);

    await cardFor(page, BASELINE_MIDDLE_TITLE).locator('button', { hasText: 'delete' }).click();
    await dialog(page).getByRole('button', { name: 'Delete' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(degreeCards(page)).toHaveCount(BASELINE_COUNT - 1);

    await openNewDegreeDialog(page);
    await fillDegreeForm(page, NEW_DEGREE);
    await saveDialog(page);

    await expect(degreeCards(page)).toHaveCount(BASELINE_COUNT);
    await expect(degreeCards(page).first()).toContainText(NEW_DEGREE.title);
    await expect(cardFor(page, BASELINE_FIRST_TITLE)).toHaveCount(1);
    await expect(cardFor(page, BASELINE_MIDDLE_TITLE)).toHaveCount(0);
  });
});
