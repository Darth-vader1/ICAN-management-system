import { test, expect } from '@playwright/test';

test.describe('Authentication & User Navigation Flow', () => {
  test('should display login form and validate empty inputs', async ({ page }: { page: any }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();

    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();

    await expect(page.locator('form')).toContainText(/required|email/i);
  });

  test('should navigate to password reset page', async ({ page }: { page: any }) => {
    await page.goto('/login');
    const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await expect(page).toHaveURL(/.*password-reset/);
    }
  });
});

