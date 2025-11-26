const { test, expect } = require('@playwright/test');

test.describe('H-Sound Application', () => {
    const APP_URL = 'http://localhost:3000/index.html';

    test('should load popular music on the Home page and allow navigation', async ({ page }) => {
        // Listen for all console events and log them to the test output
        page.on('console', msg => {
            console.log(`Browser Console [${msg.type()}]: ${msg.text()}`);
        });

        await page.goto(APP_URL, { waitUntil: 'networkidle' });

        // 1. Verify Home Page loads with popular music
        console.log('Verifying home page and popular music...');
        await expect(page.locator('h2:has-text("Popüler Müzikler")')).toBeVisible({ timeout: 10000 });
        const popularMusicGrid = page.locator('.results-grid');
        await expect(popularMusicGrid).toBeVisible({ timeout: 10000 });
        const popularItemsCount = await popularMusicGrid.locator('.result-item').count();
        expect(popularItemsCount).toBeGreaterThan(0);
        console.log(`Found ${popularItemsCount} popular music items.`);

        // 2. Navigate to Search page
        console.log('Navigating to search page...');
        await page.click('#search-link');
        await expect(page.locator('#search-container')).not.toHaveClass(/hidden/);
        await expect(page.locator('.results-grid')).not.toBeVisible(); // Results should be cleared
        console.log('Search page is visible.');

        // 3. Perform a search
        console.log('Performing a search for "dancin"...');
        await page.fill('#search-bar', 'dancin');
        await page.click('#search-btn');

        await expect(page.locator('h2:has-text("Arama Sonuçları")')).toBeVisible({ timeout: 10000 });
        const searchResultsGrid = page.locator('.results-grid');
        await expect(searchResultsGrid).toBeVisible({ timeout: 10000 });
        const searchItemsCount = await searchResultsGrid.locator('.result-item').count();
        expect(searchItemsCount).toBeGreaterThan(0);
        console.log(`Found ${searchItemsCount} search results.`);

        // 4. Navigate back to Home page
        console.log('Navigating back to home page...');
        await page.click('#home-link');
        await expect(page.locator('h2:has-text("Popüler Müzikler")')).toBeVisible({ timeout: 10000 });
        await expect(popularMusicGrid).toBeVisible({ timeout: 10000 });
        console.log('Home page with popular music is visible again.');

        // 5. Click a popular song and check if player appears
        console.log('Clicking on the first popular song...');
        const firstPopularSong = popularMusicGrid.locator('.result-item').first();
        await firstPopularSong.click();

        // The player footer should become visible
        await expect(page.locator('#player-footer')).toBeVisible({ timeout: 5000 });
        console.log('Player footer is visible after clicking a song.');

        // Verify that the song starts playing
        console.log('Verifying that the song starts playing...');
        await expect(page.locator('#play-pause-btn i')).toHaveClass(/fa-pause/, { timeout: 10000 });
        console.log('Song is playing.');
    });
});
