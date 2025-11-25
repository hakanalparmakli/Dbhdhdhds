document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search-bar');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    const audioPlayer = document.getElementById('audio-player');

    const API_BASE_URL = 'http://localhost:3000';

    searchBtn.addEventListener('click', async () => {
        const query = searchBar.value;
        if (!query) return;

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
    });

    function displayResults(results) {
        searchResults.innerHTML = '';
        results.forEach(song => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `<img src="${song.thumbnail}" alt="${song.title}"> <p>${song.title}</p>`;
            resultItem.addEventListener('click', () => playSong(song.videoId));
            searchResults.appendChild(resultItem);
        });
    }

    function playSong(videoId) {
        audioPlayer.src = `${API_BASE_URL}/play/${videoId}`;
        audioPlayer.play();
    }
});
