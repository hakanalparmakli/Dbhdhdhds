const { test, expect } = require('@playwright/test');

test.describe('H-Sound Authentication', () => {
    const APP_URL = 'http://localhost:3000/index.html';
    const LOGIN_URL = 'http://localhost:3000/login.html';

    test('should redirect unauthenticated users from main app to login page', async ({ page }) => {
        // Attempt to go to the main application page
        await page.goto(APP_URL);

        // Check if the page URL is the login page
        await expect(page).toHaveURL(LOGIN_URL);

        // Verify that a key element from the login page is visible
        await expect(page.locator('h2:has-text("Giriş Yap")')).toBeVisible();
    });
});
