const { test, expect } = require('@playwright/test');

test.describe('H-Sound Settings Page', () => {
    const REGISTER_URL = 'http://localhost:3000/register.html';
    const LOGIN_URL = 'http://localhost:3000/login.html';
    const APP_URL = 'http://localhost:3000/index.html';

    // Use a unique user for each test run to avoid conflicts
    const testUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'password123'
    };

    test('should allow a logged-in user to navigate to and view the settings page', async ({ page }) => {
        // Listen for all console events and log them to the test output
        page.on('console', msg => {
            console.log(`Browser Console [${msg.type()}]: ${msg.text()}`);
        });

        // Step 1: Register a new user
        await page.goto(REGISTER_URL);
        await page.fill('#username', testUser.username);
        await page.fill('#email', testUser.email);
        await page.fill('#password', testUser.password);
        await page.click('.auth-btn');

        // Explicitly wait for the navigation to the login page to complete
        await page.waitForURL(LOGIN_URL, { timeout: 10000 });

        // After registration, we should be on the login page
        await expect(page).toHaveURL(LOGIN_URL);

        // Step 2: Log in with the new user
        await page.fill('#email', testUser.email);
        await page.fill('#password', testUser.password);
        await page.click('.auth-btn');

        // After login, we should be redirected to the main app
        await page.waitForURL(APP_URL);
        await expect(page.locator('h2:has-text("Popüler Müzikler")')).toBeVisible({ timeout: 10000 });

        // Step 3: Navigate to the Settings page
        await page.click('#settings-link');

        // Step 4: Verify the Settings page content
        await expect(page.locator('h2:has-text("Ayarlar")')).toBeVisible();
        await expect(page.locator('label:has-text("Oynatma Hızı")')).toBeVisible();
        await expect(page.locator('#playback-speed')).toBeVisible();

        // Step 5: Take a screenshot to visually verify the new design
        await page.screenshot({ path: 'redesigned_homepage.png' });
    });
});
