// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('NutriTracker E2E', () => {
  test('Login page loads and submits email', async ({ page }) => {
    await page.goto('https://nutritracker.exautomata.ai/login.html');
    await expect(page.locator('.title')).toHaveText(/NutriTracker Login/);
    await page.fill('#login-email', 'e2e@example.com');
    await page.click('#login-btn');
    // Wait for either redirect or error message
    await page.waitForTimeout(2000);
    const url = page.url();
    const errorVisible = await page.locator('#auth-link-container').isVisible();
    if (url.endsWith('index.html')) {
      expect(url).toContain('index.html');
    } else if (errorVisible) {
      expect(errorVisible).toBe(true);
    } else {
      // Print debug info and fail
      console.log('DEBUG: url after submit:', url);
      const errorHtml = await page.locator('#auth-link-container').innerHTML();
      console.log('DEBUG: #auth-link-container HTML:', errorHtml);
      throw new Error('Neither redirected nor error message shown. See debug output above.');
    }
  });
});
