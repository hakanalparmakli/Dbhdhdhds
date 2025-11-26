document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search-bar');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    const playerContainer = document.getElementById('player-container');
    const errorMessage = document.getElementById('error-message');

    const API_BASE_URL = 'http://localhost:3000';
    let player;
    let errorTimeout;
    let errorCount = 0;
    const MAX_ERRORS = 3;

    // Load YouTube IFrame Player API
    window.onYouTubeIframeAPIReady = function() {
        console.log("YouTube API is ready.");
    };

    searchBtn.addEventListener('click', async () => {
        const query = searchBar.value;
        if (!query) return;

        try {
            const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const results = await response.json();
            displayResults(results);
        } catch (error) {
            console.error('Failed to search:', error);
            showError('Failed to perform search. Please try again later.');
        }
    });

    function displayResults(results) {
        searchResults.innerHTML = '';
        if (results.length === 0) {
            searchResults.innerHTML = '<p>No results found.</p>';
            return;
        }
        results.forEach(song => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <img src="${song.thumbnail}" alt="${song.title}">
                <p>${song.title}</p>
            `;
            resultItem.addEventListener('click', () => {
                playSong(song.videoId);
                errorCount = 0; // Reset error count on new song selection
            });
            searchResults.appendChild(resultItem);
        });
    }

    function playSong(videoId) {
        if (player) {
            player.destroy();
        }
        player = new YT.Player(playerContainer, {
            height: '0',
            width: '0',
            videoId: videoId,
            events: {
                'onReady': onPlayerReady,
                'onError': onPlayerError
            }
        });
    }

    function onPlayerReady(event) {
        event.target.playVideo();
        hideError();
    }

    function onPlayerError(event) {
        console.error('Player Error:', event.data);
        errorCount++;
        if (errorCount >= MAX_ERRORS) {
            showError('Playback failed multiple times. Please try another song.');
            // Stop trying to play more songs
        } else {
            showError('Error playing video. Trying next available song...');
            // In a real scenario, you would have a playlist to advance to the next song.
            // For now, we'll just show the error.
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        if (errorTimeout) clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    function hideError() {
        errorMessage.style.display = 'none';
        if (errorTimeout) clearTimeout(errorTimeout);
    }
});
