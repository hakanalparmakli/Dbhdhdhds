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
    let videoQueue = null;

    // --- YouTube IFrame Player Setup ---
    window.onYouTubeIframeAPIReady = function() {
        console.log("YouTube IFrame API is ready.");
        player = new YT.Player('player', {
            height: '80', // Adjusted for footer
            width: '100%',
            playerVars: { 'autoplay': 1, 'controls': 1 },
            events: {
                'onReady': onPlayerReady,
                'onError': onPlayerError
            }
        });
    };

    function onPlayerReady(event) {
        console.log("YouTube Player is ready.");
        isPlayerReady = true;
        if (videoQueue) {
            playSong(videoQueue);
            videoQueue = null;
        }
    }

    function onPlayerError(event) {
        console.error("YouTube Player Error:", event.data);
        alert("An error occurred. Please try another song.");
    }

    // --- Navigation Logic ---
    async function showHomePage() {
        searchHeader.classList.add('hidden');
        homeLink.classList.add('active');
        searchLink.classList.remove('active');
        contentArea.innerHTML = '<h2>Popüler Müzikler</h2>'; // Set the title

        try {
            const response = await fetch(`${API_BASE_URL}/popular`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Popüler müzikler alınamadı.');
            }
            const results = await response.json();
            displayResults(results); // Display results below the title
        } catch (error) {
            contentArea.innerHTML += `<p style="color: red;">Hata: ${error.message}</p>`;
        }
    }

    function showSearchPage() {
        searchHeader.classList.remove('hidden');
        contentArea.innerHTML = ''; // Clear content for a new search page
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
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    async function performSearch() {
        const query = searchBar.value;
        if (!query) return;

        showSearchPage(); // Switch to search view first
        contentArea.innerHTML = '<h2>Arama Sonuçları</h2>'; // Add title for search results

        try {
            const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error);
            }
            const results = await response.json();
            displayResults(results);
        } catch (error) {
            alert(`Error searching: ${error.message}`);
        }
    }

    function displayResults(results) {
        let resultsGrid = contentArea.querySelector('.results-grid');
        if (resultsGrid) {
            resultsGrid.remove();
        }

        resultsGrid = document.createElement('div');
        resultsGrid.className = 'results-grid';

        if (results.length === 0) {
            const noResults = document.createElement('p');
            noResults.textContent = 'Sonuç bulunamadı.';
            contentArea.appendChild(noResults);
            return;
        }

        results.forEach(song => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `<img src="${song.thumbnail}" alt="${song.title}"> <p>${song.title}</p>`;
            resultItem.addEventListener('click', () => playSong(song.videoId));
            resultsGrid.appendChild(resultItem);
        });

        contentArea.appendChild(resultsGrid);
    }

    // --- Playback Logic ---
    function playSong(videoId) {
        if (isPlayerReady && player && typeof player.loadVideoById === 'function') {
            console.log(`Loading video: ${videoId}`);
            player.loadVideoById(videoId);
            playerFooter.classList.remove('hidden'); // Show the footer player
        } else {
            console.log("Player not ready, queuing videoId:", videoId);
            videoQueue = videoId;
             // Also ensure the footer is ready to be shown when the player is ready
            playerFooter.classList.remove('hidden');
        }
    }

    // --- Initial Page Load ---
    showHomePage(); // Show home page by default
});
