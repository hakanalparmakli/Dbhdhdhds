const { test, expect } = require('@playwright/test');

test.describe('H-Sound Settings Page', () => {
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

    test('should allow a user to navigate to and view the settings page', async ({ page }) => {
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

        // Go directly to the app since we are mocking the logged in state
        await page.goto(APP_URL, { waitUntil: 'networkidle' });

        // Verify that the popular music is loaded
        const popularMusicHeader = page.locator('h2:has-text("Popüler Müzikler"), h2:has-text("Popular Music")');
        await expect(popularMusicHeader).toBeVisible({ timeout: 10000 });

        // Step 3: Navigate to the Settings page
        await page.click('#settings-link');

        // Step 4: Verify the Settings page content
        const settingsHeader = page.locator('h2:has-text("Ayarlar"), h2:has-text("Settings")');
        await expect(settingsHeader).toBeVisible();

        const playbackSpeedLabel = page.locator('label:has-text("Oynatma Hızı"), label:has-text("Playback Speed")');
        await expect(playbackSpeedLabel).toBeVisible();

        await expect(page.locator('#playback-speed')).toBeVisible();
        await page.screenshot({ path: 'video_modal_screenshot.png' });
    });
});
