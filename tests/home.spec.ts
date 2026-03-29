import { test, expect } from '@playwright/test';

test('home page loads successfully', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).not.toHaveTitle(/error/i);
  await expect(page.locator('body')).toBeVisible();
});