const { test, expect } = require('@playwright/test');

test.describe('H-Sound Application', () => {
    const APP_URL = 'http://localhost:3000/index.html';

    const translations = {
        tr: {
            "home": "Ana Sayfa", "search": "Ara", "library": "Kitaplığım", "settings": "Ayarlar",
            "logout": "Çıkış Yap", "search_placeholder": "Ne dinlemek istersin?", "search_button": "Ara",
            "popular_music": "Popüler Müzikler", "search_results": "Arama Sonuçları", "my_library": "Kitaplığım",
            "saved_songs_not_found": "Kaydedilmiş şarkı bulunamadı.", "no_results_found": "Sonuç bulunamadı.",
            "song_title_placeholder": "Şarkı Başlığı", "artist_placeholder": "Sanatçı", "playback_speed": "Oynatma Hızı",
            "normal_speed": "Normal", "language": "Dil"
        },
        en: {
            "home": "Home", "search": "Search", "library": "My Library", "settings": "Settings",
            "logout": "Logout", "search_placeholder": "What do you want to listen to?", "search_button": "Search",
            "popular_music": "Popular Music", "search_results": "Search Results", "my_library": "My Library",
            "saved_songs_not_found": "No saved songs found.", "no_results_found": "No results found.",
            "song_title_placeholder": "Song Title", "artist_placeholder": "Artist", "playback_speed": "Playback Speed",
            "normal_speed": "Normal", "language": "Language"
        }
    };

    test('should load popular music on the Home page and allow navigation', async ({ page }) => {
        // Mock API calls to remove network dependencies
        await page.route('**/locales/*.json', (route, request) => {
            const lang = request.url().split('/').pop().split('.')[0];
            if (translations[lang]) {
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(translations[lang]) });
            } else {
                route.fulfill({ status: 404 });
            }
        });

        await page.route('**/popular', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { videoId: 'video1', title: 'Popular Song 1', thumbnail: 'thumb1.jpg' },
                    { videoId: 'video2', title: 'Popular Song 2', thumbnail: 'thumb2.jpg' }
                ])
            });
        });

        // Listen for all console events and log them to the test output
        page.on('console', msg => {
            console.log(`Browser Console [${msg.type()}]: ${msg.text()}`);
        });

        await page.goto(APP_URL, { waitUntil: 'networkidle' });

        // 1. Verify Home Page loads with popular music
        console.log('Verifying home page and popular music...');

        // Handle i18n for the title - check for either Turkish or English
        const popularMusicHeader = page.locator('h2:has-text("Popüler Müzikler"), h2:has-text("Popular Music")');
        await expect(popularMusicHeader).toBeVisible({ timeout: 10000 });

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

        // Handle i18n for the title - check for either Turkish or English
        const searchResultsHeader = page.locator('h2:has-text("Arama Sonuçları"), h2:has-text("Search Results")');
        await expect(searchResultsHeader).toBeVisible({ timeout: 10000 });

        const searchResultsGrid = page.locator('.results-grid');
        await expect(searchResultsGrid).toBeVisible({ timeout: 10000 });
        const searchItemsCount = await searchResultsGrid.locator('.result-item').count();
        expect(searchItemsCount).toBeGreaterThan(0);
        console.log(`Found ${searchItemsCount} search results.`);

        // 4. Navigate back to Home page
        console.log('Navigating back to home page...');
        await page.click('#home-link');

        // Handle i18n for the title
        const popularMusicHeaderAgain = page.locator('h2:has-text("Popüler Müzikler"), h2:has-text("Popular Music")');
        await expect(popularMusicHeaderAgain).toBeVisible({ timeout: 10000 });

        await expect(popularMusicGrid).toBeVisible({ timeout: 10000 });
        console.log('Home page with popular music is visible again.');

        // 5. Click a popular song and check if player appears
        console.log('Clicking on the first popular song...');
        const firstPopularSong = popularMusicGrid.locator('.result-item').first();
        await firstPopularSong.click();

        // The player footer should become visible
        await expect(page.locator('#player-footer')).toBeVisible({ timeout: 5000 });
        console.log('Player footer is visible after clicking a song.');
    });
});
