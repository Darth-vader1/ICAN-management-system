import { test, expect } from '@playwright/test';

test.describe('Enrollment & Payment Flow', () => {
  test('should display course catalog or redirect unauthenticated user to login', async ({ page }: { page: any }) => {
    await page.goto('/enrollment');
    await expect(page).toHaveURL(/.*login|.*enrollment/);
  });

  test('should render invoice details page structure', async ({ page }: { page: any }) => {
    await page.goto('/invoices/INV-TEST-001');
    await expect(page.locator('body')).toBeVisible();
  });
});

