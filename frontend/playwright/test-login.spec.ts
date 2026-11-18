import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('user can login and access dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify dashboard loaded
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('user can view asset list', async ({ page }) => {
    // Navigate to assets
    await page.goto('/assets');
    
    // Verify assets table loaded
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tr')).toHaveCountGreaterThan(0);
  });
});