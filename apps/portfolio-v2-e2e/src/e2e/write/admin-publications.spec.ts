import path from 'path';
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

const ADMIN_PATH = '/admin/education/publications';
const BASELINE_COUNT = 3;
const BASELINE_FIRST_TITLE = 'ARWalker';
const BASELINE_MIDDLE_TITLE = 'A Study of the Hololens Application Store';
const COVER = path.join(
  process.cwd(),
  'db/baseline/storage/portfolio/publications/publication-card-images/ID-01-Image.webp',
);

interface PublicationFields {
  title: string;
  detailTitle: string;
  keywords: string;
  summary: string;
  authors: string;
  abstractText: string;
  citation: string;
}

const NEW_PUBLICATION: PublicationFields = {
  title: 'E2E Playwright Paper',
  detailTitle: 'E2E Playwright Paper: A Longer Title',
  keywords: 'Testing, Playwright',
  summary: 'A paper written by the publication admin spec.',
  authors: 'Test Author',
  abstractText: 'The first paragraph of the abstract.',
  citation: 'Test Author. (2026). E2E Playwright Paper.',
};

function publicationCards(page: Page): Locator {
  return page.locator('.publication-card');
}

function cardFor(page: Page, title: string): Locator {
  return publicationCards(page).filter({ hasText: title });
}

function dialog(page: Page): Locator {
  return page.getByRole('dialog');
}

async function openAdminPublications(page: Page): Promise<void> {
  await page.goto(ADMIN_PATH);
  await expect(publicationCards(page)).toHaveCount(BASELINE_COUNT);
}

async function openNewPublicationDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Add a publication' }).click();
  await expect(dialog(page)).toContainText('New publication');
  await expect(dialog(page).getByLabel('Card title', { exact: true })).toBeFocused();
}

async function fillPublicationForm(page: Page, fields: PublicationFields): Promise<void> {
  const form = dialog(page);
  await form.getByLabel('Card title', { exact: true }).fill(fields.title);
  await form.getByLabel('Detail title', { exact: true }).fill(fields.detailTitle);
  await form.getByLabel('Keywords', { exact: true }).fill(fields.keywords);
  await form.getByLabel('Summary', { exact: true }).fill(fields.summary);
  await form.getByLabel('Authors', { exact: true }).fill(fields.authors);
  await form.getByLabel('Abstract', { exact: true }).fill(fields.abstractText);
  await form.getByLabel('Citation', { exact: true }).fill(fields.citation);
  await form.locator('#publication-cover').setInputFiles(COVER);
}

async function saveDialog(page: Page): Promise<void> {
  await dialog(page).getByRole('button', { name: 'Save' }).click();
  await expect(dialog(page)).toHaveCount(0);
}

async function openPublicPublications(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
  await page.goto('/home');
  await page.getByRole('link', { name: 'Education' }).click();
  await page.locator('portfolio-v2-flower-animation').filter({ hasText: 'Publications' })
    .getByText('Publications', { exact: true }).click();
  await expect(page).toHaveURL(/\/content\/education\/publications/);
}

test.describe('admin publications', () => {
  test.beforeEach(async ({ page }) => {
    await resetBaseline();
    await signInAsAdmin(page);
  });

  test('should list the seeded publications with an add tile', async ({ page }) => {
    await openAdminPublications(page);

    await expect(publicationCards(page).first()).toContainText(BASELINE_FIRST_TITLE);
    await expect(cardFor(page, BASELINE_MIDDLE_TITLE)).toContainText('System Analysis, Mixed Reality, HoloLens 2');
    await expect(page.getByRole('button', { name: 'Add a publication' })).toBeVisible();
  });

  test('should add a publication, persist it, and show it on the public page', async ({ page }) => {
    await openAdminPublications(page);

    await openNewPublicationDialog(page);
    await fillPublicationForm(page, NEW_PUBLICATION);
    await saveDialog(page);

    await expect(publicationCards(page)).toHaveCount(BASELINE_COUNT + 1);
    const added = cardFor(page, NEW_PUBLICATION.title);
    await expect(added).toContainText(NEW_PUBLICATION.keywords);
    await expect(added).toContainText(NEW_PUBLICATION.summary);

    await page.reload();
    await expect(publicationCards(page)).toHaveCount(BASELINE_COUNT + 1);
    await expect(cardFor(page, NEW_PUBLICATION.title)).toContainText(NEW_PUBLICATION.summary);

    await openPublicPublications(page);
    const publicCard = page.locator('portfolio-v2-publications .publication-card').filter({
      hasText: NEW_PUBLICATION.title,
    });
    await expect(publicCard).toContainText(NEW_PUBLICATION.keywords);
    await expect(publicCard).toContainText(NEW_PUBLICATION.summary);

    await publicCard.locator('a', { hasText: 'More' }).click();
    await expect(page.getByRole('dialog')).toContainText(NEW_PUBLICATION.detailTitle);
    await expect(page.getByRole('dialog')).toContainText(`Authors: ${NEW_PUBLICATION.authors}`);
    await expect(page.getByRole('dialog')).toContainText(NEW_PUBLICATION.citation);
  });

  test('should edit a publication and keep its id', async ({ page }) => {
    await openAdminPublications(page);
    const edited = `${BASELINE_MIDDLE_TITLE} (edited)`;

    await cardFor(page, BASELINE_MIDDLE_TITLE).locator('button', { hasText: 'edit' }).click();
    await expect(dialog(page)).toContainText('Edit publication');
    await expect(dialog(page).getByLabel('Card title', { exact: true })).toHaveValue(BASELINE_MIDDLE_TITLE);
    await dialog(page).getByLabel('Card title', { exact: true }).fill(edited);
    await saveDialog(page);

    await expect(publicationCards(page)).toHaveCount(BASELINE_COUNT);
    await page.reload();
    await expect(publicationCards(page)).toHaveCount(BASELINE_COUNT);
    await expect(cardFor(page, edited)).toContainText('System Analysis, Mixed Reality, HoloLens 2');
    await expect(cardFor(page, BASELINE_FIRST_TITLE)).toHaveCount(1);
  });

  test('should keep the publication when the delete is cancelled and remove it when confirmed', async ({ page }) => {
    await openAdminPublications(page);

    await cardFor(page, BASELINE_MIDDLE_TITLE).locator('button', { hasText: 'delete' }).click();
    await expect(dialog(page)).toContainText('Delete publication');
    await expect(dialog(page)).toContainText(BASELINE_MIDDLE_TITLE);
    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(publicationCards(page)).toHaveCount(BASELINE_COUNT);

    await cardFor(page, BASELINE_MIDDLE_TITLE).locator('button', { hasText: 'delete' }).click();
    await dialog(page).getByRole('button', { name: 'Delete' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(publicationCards(page)).toHaveCount(BASELINE_COUNT - 1);

    await page.reload();
    await expect(publicationCards(page)).toHaveCount(BASELINE_COUNT - 1);
    await expect(cardFor(page, BASELINE_MIDDLE_TITLE)).toHaveCount(0);
  });

  test('should not close the dialog or save while the form is invalid', async ({ page }) => {
    await openAdminPublications(page);

    await page.getByRole('button', { name: 'Add a publication' }).click();
    await dialog(page).getByRole('button', { name: 'Save' }).click();

    await expect(dialog(page)).toContainText('A card title is required');
    await expect(dialog(page)).toContainText('A detail title is required');
    await expect(dialog(page)).toContainText('A cover image is required');

    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(publicationCards(page)).toHaveCount(BASELINE_COUNT);
  });

  test('should give a new publication a fresh id after a gap, so none is overwritten', async ({ page }) => {
    await openAdminPublications(page);

    await cardFor(page, BASELINE_MIDDLE_TITLE).locator('button', { hasText: 'delete' }).click();
    await dialog(page).getByRole('button', { name: 'Delete' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(publicationCards(page)).toHaveCount(BASELINE_COUNT - 1);

    await openNewPublicationDialog(page);
    await fillPublicationForm(page, NEW_PUBLICATION);
    await saveDialog(page);

    await expect(publicationCards(page)).toHaveCount(BASELINE_COUNT);
    await expect(cardFor(page, NEW_PUBLICATION.title)).toHaveCount(1);
    await expect(cardFor(page, BASELINE_FIRST_TITLE)).toHaveCount(1);
    await expect(cardFor(page, 'Gait Rehabillitation with Mixed Reality')).toHaveCount(1);
    await expect(cardFor(page, BASELINE_MIDDLE_TITLE)).toHaveCount(0);
  });
});
