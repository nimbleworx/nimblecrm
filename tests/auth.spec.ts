import { test, expect } from '@playwright/test';

const TEST_EMAIL = `test+${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';

test('unauthenticated user is redirected to login', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveURL(/\/login/);
});

test('login page renders sign in form', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await expect(page.getByText('Sign in to your account')).toBeVisible();
  await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('login page toggles to sign up mode', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByText('Create your account')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
});

test('login shows error for invalid credentials', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByPlaceholder('you@company.com').fill('invalid@example.com');
  await page.getByPlaceholder('••••••••').fill('wrongpassword');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('text=Invalid').or(page.locator('text=invalid')).or(page.locator('text=credentials')).or(page.locator('text=Email not confirmed'))).toBeVisible({ timeout: 5000 });
});
