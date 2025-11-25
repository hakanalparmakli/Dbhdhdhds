document.addEventListener('DOMContentLoaded', () => {
    const authScreen = document.getElementById('auth-screen');
    const musicPlayer = document.getElementById('music-player');

    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const registerBtn = document.getElementById('register-btn');

    const API_BASE_URL = 'http://localhost:3000';

    // --- Session Management ---
    function getToken() {
        return localStorage.getItem('authToken');
    }

    function setToken(token) {
        localStorage.setItem('authToken', token);
    }

    function logout() {
        localStorage.removeItem('authToken');
        authScreen.style.display = 'block';
        musicPlayer.style.display = 'none';
    }

    // --- App Initialization ---
    const initialToken = getToken();
    if (initialToken) {
        authScreen.style.display = 'none';
        musicPlayer.style.display = 'block';
    }

    // --- Authentication ---
    registerBtn.addEventListener('click', async () => {
        const username = registerUsernameInput.value;
        const password = registerPasswordInput.value;
        if (!username || !password) return alert('Please enter a username and password.');
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (response.ok) alert('Account created! Please log in.');
            else alert(`Error: ${data.error}`);
        } catch (error) {
            alert('Could not connect to the server.');
        }
    });

    loginBtn.addEventListener('click', async () => {
        const username = loginUsernameInput.value;
        const password = loginPasswordInput.value;
        if (!username || !password) return alert('Please enter a username and password.');
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (response.ok) {
                setToken(data.accessToken);
                authScreen.style.display = 'none';
                musicPlayer.style.display = 'block';
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Could not connect to the server.');
        }
    });

    // --- Music Player ---
    const searchBar = document.getElementById('search-bar');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    const audioPlayer = document.getElementById('audio-player');

    searchBtn.addEventListener('click', async () => {
        const query = searchBar.value;
        if (!query) return;
        const token = getToken();
        if (!token) return logout();

        try {
            const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Authentication failed');
            const results = await response.json();
            displayResults(results);
        } catch (error) {
            alert('Failed to search. Your session may have expired.');
            logout();
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
        const token = getToken();
        if (!token) return logout();
        audioPlayer.src = `${API_BASE_URL}/play/${videoId}?token=${token}`;
        audioPlayer.play();
    }
});
