const { test, expect } = require('@playwright/test');

test.describe('Isolate Registration', () => {
    const REGISTER_URL = 'http://localhost:3000/register.html';
    const LOGIN_URL = 'http://localhost:3000/login.html';

    const testUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'password123'
    };

    test('should register a user and redirect to login', async ({ page }) => {
        let requestFailed = false;
        page.on('requestfailed', request => {
            console.log(`Request failed: ${request.url()}`);
            requestFailed = true;
        });

        await page.goto(REGISTER_URL);

        await page.fill('#username', testUser.username);
        await page.fill('#email', testUser.email);
        await page.fill('#password', testUser.password);
        await page.fill('#confirm-password', testUser.password);

        await page.click('.auth-btn');

        await page.waitForURL(LOGIN_URL, { timeout: 5000 });

        expect(requestFailed).toBe(false);
        await expect(page).toHaveURL(LOGIN_URL);
    });
});
