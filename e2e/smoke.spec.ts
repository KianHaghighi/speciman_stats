import { test, expect } from '@playwright/test';

test('homepage redirects to login and has correct title', async ({ page }) => {
  await page.goto('/');
  // Unauthenticated users get redirected to the login page
  await page.waitForURL('**/auth/login');
  await expect(page).toHaveTitle(/specimenstats/i);
});
