document.addEventListener('DOMContentLoaded', () => {
    // Page elements
    const homeLink = document.getElementById('home-link');
    const searchLink = document.getElementById('search-link');
    const searchHeader = document.getElementById('search-header');
    const contentArea = document.getElementById('content-area');
    const searchBar = document.getElementById('search-bar');
    const searchBtn = document.getElementById('search-btn');
    const playerFooter = document.getElementById('player-footer');

    const API_BASE_URL = 'http://localhost:3000';
    let player;
    let isPlayerReady = false;

    // --- State for Auto-Skip Feature ---
    let currentTrackList = [];
    let currentTrackIndex = -1;


    // --- YouTube IFrame Player Setup ---
    window.onYouTubeIframeAPIReady = function() {
        console.log("YouTube IFrame API is ready.");
        player = new YT.Player('player', {
            height: '80',
            width: '100%',
            playerVars: { 'autoplay': 1, 'controls': 1 },
            events: {
                'onReady': onPlayerReady,
                'onError': onPlayerError // This will now handle auto-skipping
            }
        });
    };

    function onPlayerReady(event) {
        console.log("YouTube Player is ready.");
        isPlayerReady = true;
        // If a song was queued before player was ready, play it
        if (currentTrackIndex !== -1) {
            playSongByIndex(currentTrackIndex);
        }
    }

    // --- Graceful Error Handling: Auto-Skip to Next Song ---
    function onPlayerError(event) {
        console.error(`YouTube Player Error: ${event.data}. Video ID: ${currentTrackList[currentTrackIndex]}. Skipping to next track.`);

        // Try to play the next song in the list
        if (currentTrackIndex < currentTrackList.length - 1) {
            currentTrackIndex++;
            playSongByIndex(currentTrackIndex);
        } else {
            console.warn("End of track list reached. No more songs to skip to.");
            // Optionally hide the player or show a message
            playerFooter.classList.add('hidden');
        }
    }

    // --- Navigation Logic ---
    async function showHomePage() {
        searchHeader.classList.add('hidden');
        homeLink.classList.add('active');
        searchLink.classList.remove('active');
        contentArea.innerHTML = '<h2>Popüler Müzikler</h2>';

        try {
            const response = await fetch(`${API_BASE_URL}/popular`);
            if (!response.ok) throw new Error('Popüler müzikler alınamadı.');
            const results = await response.json();

            // Store the new tracklist and display it
            currentTrackList = results.map(song => song.videoId);
            displayResults(results);
        } catch (error) {
            contentArea.innerHTML += `<p style="color: red;">Hata: ${error.message}</p>`;
        }
    }

    function showSearchPage() {
        searchHeader.classList.remove('hidden');
        contentArea.innerHTML = '';
        homeLink.classList.remove('active');
        searchLink.classList.add('active');
    }

    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showHomePage();
    });

    searchLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSearchPage();
    });

    // --- Search Logic ---
    searchBtn.addEventListener('click', performSearch);
    searchBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    async function performSearch() {
        const query = searchBar.value;
        if (!query) return;

        showSearchPage();
        contentArea.innerHTML = '<h2>Arama Sonuçları</h2>';

        try {
            const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Arama sırasında bir hata oluştu.');
            const results = await response.json();

            // Store the new tracklist and display it
            currentTrackList = results.map(song => song.videoId);
            displayResults(results);
        } catch (error) {
            contentArea.innerHTML += `<p style="color: red;">Hata: ${error.message}</p>`;
        }
    }

    function displayResults(results) {
        let resultsGrid = contentArea.querySelector('.results-grid');
        if (resultsGrid) resultsGrid.remove();

        resultsGrid = document.createElement('div');
        resultsGrid.className = 'results-grid';

        if (results.length === 0) {
            resultsGrid.innerHTML = '<p>Sonuç bulunamadı.</p>';
            contentArea.appendChild(resultsGrid);
            return;
        }

        results.forEach((song, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `<img src="${song.thumbnail}" alt="${song.title}"> <p>${song.title}</p>`;
            // When an item is clicked, play it by its index in the current list
            resultItem.addEventListener('click', () => playSongByIndex(index));
            resultsGrid.appendChild(resultItem);
        });

        contentArea.appendChild(resultsGrid);
    }

    // --- Playback Logic ---
    function playSongByIndex(index) {
        // Set the current track index
        currentTrackIndex = index;
        const videoId = currentTrackList[index];

        if (isPlayerReady && player && typeof player.loadVideoById === 'function') {
            console.log(`Loading video by index ${index}: ${videoId}`);
            player.loadVideoById(videoId);
            playerFooter.classList.remove('hidden');
        } else {
            console.log("Player not ready, queuing track index:", index);
            // The onPlayerReady function will handle playing this
        }
    }

    // --- Initial Page Load ---
    showHomePage();
});
