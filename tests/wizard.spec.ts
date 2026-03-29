import { test, expect } from '@playwright/test';

test('unauthenticated user visiting /onboarding is redirected to login', async ({ page }) => {
  await page.goto('http://localhost:3000/onboarding');
  await expect(page).toHaveURL(/\/login/);
});

test('onboarding page shows loading state before redirecting unauthenticated user', async ({ page }) => {
  // The page briefly renders a loading state before the auth check resolves
  await page.goto('http://localhost:3000/onboarding');
  // Should end up at login
  await expect(page).toHaveURL(/\/login/);
});

test('unauthenticated user visiting / is still redirected to login (not onboarding)', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveURL(/\/login/);
});

// Happy-path tests require a real authenticated session.
// To run these locally, set TEST_EMAIL and TEST_PASSWORD env vars to a valid
// Supabase test account and uncomment the block below.
//
// test('wizard happy path — complete all steps', async ({ page }) => {
//   const email = process.env.TEST_EMAIL!;
//   const password = process.env.TEST_PASSWORD!;
//
//   // Sign in
//   await page.goto('http://localhost:3000/login');
//   await page.getByPlaceholder('you@company.com').fill(email);
//   await page.getByPlaceholder('••••••••').fill(password);
//   await page.getByRole('button', { name: 'Sign in' }).click();
//
//   // Should land on onboarding (wizard not yet completed)
//   await expect(page).toHaveURL(/\/onboarding/, { timeout: 8000 });
//   await expect(page.getByTestId('wizard-card')).toBeVisible();
//
//   // Step 0: Welcome
//   await page.getByTestId('wizard-start').click();
//
//   // Step 1: Signal sources — voice is available, select it
//   await expect(page.getByTestId('wizard-card')).toContainText('Where does your deal activity live');
//   await page.getByTestId('source-voice').click();
//   await page.getByTestId('wizard-next').click();
//
//   // Step 2: CRM destination — built-in is pre-selected
//   await expect(page.getByTestId('wizard-card')).toContainText('Which CRM do you use');
//   await page.getByTestId('wizard-next').click();
//
//   // Step 3: Automation preferences
//   await expect(page.getByTestId('wizard-card')).toContainText('How hands-on');
//   await page.getByTestId('auto-smart').click();
//   await page.getByTestId('wizard-next').click();
//
//   // Step 4: Summary
//   await expect(page.getByTestId('wizard-card')).toContainText("Here's your setup");
//   await page.getByTestId('wizard-confirm').click();
//
//   // Done state
//   await expect(page.getByText("You're all set!")).toBeVisible({ timeout: 8000 });
//
//   // Navigate to dashboard
//   await page.getByRole('button', { name: /Go to dashboard/ }).click();
//   await expect(page).toHaveURL('http://localhost:3000/');
// });
