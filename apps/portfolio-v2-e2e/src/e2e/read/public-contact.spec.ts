import {
  expect,
  test,
} from '../../support/network';

const LOCAL_ACCEPTANCE = 'This local session accepted the message without sending an email.';

test.describe('public contact form', () => {
  test('should keep send disabled until the form is valid', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: 'Contact' }).click();
    await expect(page.getByRole('heading', { name: /get in touch/i })).toBeVisible();

    const send = page.getByRole('button', { name: 'Send' });
    await expect(send).toBeDisabled();
    await page.getByPlaceholder('Your Email Address').fill('ada@example.com');
    await page.getByPlaceholder('Your Name').fill('A');
    await page.getByPlaceholder('Your Message').fill('Hello from the contact form.');
    await expect(send).toBeDisabled();

    await page.getByPlaceholder('Your Name').fill('Ada');
    await expect(send).toBeEnabled();
  });

  test('should accept a message through the local function', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: 'Contact' }).click();
    await page.getByPlaceholder('Your Email Address').fill('ada@example.com');
    await page.getByPlaceholder('Your Name').fill('Ada');
    await page.getByPlaceholder('Your Message').fill('Hello from the contact form.');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByRole('status')).toContainText(LOCAL_ACCEPTANCE, { timeout: 20_000 });
    await expect(page.getByPlaceholder('Your Email Address')).toHaveValue('');
  });
});
