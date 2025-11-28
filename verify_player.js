const { chromium } = require('playwright');
const { exec } = require('child_process');

// Function to kill processes on a given port
const killPort = (port) => {
    return new Promise((resolve, reject) => {
        exec(`npx kill-port ${port}`, (err, stdout, stderr) => {
            if (err && !stdout.includes('No process running')) {
                console.error(`Error killing port ${port}: ${stderr}`);
                return reject(err);
            }
            console.log(stdout || `No process found on port ${port}.`);
            resolve();
        });
    });
};

(async () => {
    let browser;

    try {
        // --- Launch Browser and Test ---
        console.log('Servers are assumed to be running. Launching browser...');
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        console.log('Navigating to the application...');
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });

        console.log('Page loaded. Testing popular music playback...');
        // Wait for popular songs to load and click the first one
        await page.waitForSelector('.result-item', { timeout: 10000 });
        const firstSong = await page.$('.result-item');
        if (!firstSong) throw new Error('First popular song not found!');

        await firstSong.click();
        console.log('Clicked on the first song.');

        // Verify the player is visible
        await page.waitForSelector('#player-footer:not(.hidden)', { timeout: 5000 });
        console.log('Player footer is visible.');

        // Wait a bit for the song to potentially load and play
        await page.waitForTimeout(5000);

        // Test Pause Button
        console.log('Testing pause...');
        const playPauseBtn = await page.$('#play-pause-btn');
        if (!playPauseBtn) throw new Error('Play/Pause button not found!');
        await playPauseBtn.click();
        console.log('Clicked pause. Waiting a moment...');
        await page.waitForTimeout(2000);

        // Test Play Button
        console.log('Testing play...');
        await playPauseBtn.click();
        console.log('Clicked play.');
        await page.waitForTimeout(3000);

        // Test Next Button
        console.log('Testing next...');
        const nextBtn = await page.$('#next-btn');
        if (!nextBtn) throw new Error('Next button not found!');
        await nextBtn.click();
        console.log('Clicked next.');
        await page.waitForTimeout(5000); // Wait for the next song to load

        // Test Previous Button
        console.log('Testing previous...');
        const prevBtn = await page.$('#prev-btn');
        if (!prevBtn) throw new Error('Previous button not found!');
        await prevBtn.click();
        console.log('Clicked previous.');
        await page.waitForTimeout(5000); // Wait for the prev song to load

        // Test Search
        console.log('Testing search functionality...');
        await page.click('#search-link');
        await page.waitForSelector('#search-bar');
        await page.fill('#search-bar', 'rick astley never gonna give you up');
        await page.click('#search-btn');
        console.log('Search performed.');

        await page.waitForSelector('.result-item', { timeout: 10000 });
        const firstSearchResult = await page.$('.result-item');
        if (!firstSearchResult) throw new Error('First search result not found!');

        await firstSearchResult.click();
        console.log('Clicked on the first search result.');
        await page.waitForTimeout(5000);

        console.log('Verification successful! Taking a screenshot...');
        await page.screenshot({ path: 'verification_screenshot.png' });
        console.log('Screenshot saved as verification_screenshot.png');

    } catch (error) {
        console.error('An error occurred during verification:', error);
        if (browser) {
            const page = (await browser.pages())[0];
            if(page) await page.screenshot({ path: 'error_screenshot.png' });
            console.log('Error screenshot saved as error_screenshot.png');
        }
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed.');
        }
        console.log('Test script finished.');
    }
})();
