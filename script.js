document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check ---
    (function authCheck() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn !== 'true') {
            // If not logged in, redirect to the login page
            window.location.href = 'login.html';
        }
    })();


    // --- Logout Logic ---
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        });
    }

    // Mobile navigation
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    // Page elements
    const homeLink = document.getElementById('home-link');
    const searchLink = document.getElementById('search-link');
    const libraryLink = document.getElementById('library-link');
    const settingsLink = document.getElementById('settings-link');
    const searchContainer = document.getElementById('search-container');
    const contentArea = document.getElementById('content-area');
    const searchBar = document.getElementById('search-bar');
    const searchBtn = document.getElementById('search-btn');
    const playerFooter = document.getElementById('player-footer');

    // Player control elements
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const saveToLibraryBtn = document.getElementById('save-to-library-btn');
    const songTitle = document.getElementById('song-title');
    const songArtist = document.getElementById('song-artist');
    const progressBar = document.getElementById('progress-bar');
    const progress = document.getElementById('progress');


    let player;
    let isPlayerReady = false;

    // --- State for Auto-Skip Feature ---
    let currentTrackList = []; // Will store videoIds
    let currentTrackListWithDetails = []; // To store full song objects {videoId, title, thumbnail}
    let currentTrackIndex = -1;
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 10; // Increased tolerance for non-embeddable videos
    let progressInterval = null;


    // --- YouTube IFrame Player Setup ---
    window.onYouTubeIframeAPIReady = function() {
        console.log("YouTube IFrame API is ready.");
        player = new YT.Player('player', {
            height: '80',
            width: '100%',
            playerVars: {
                'autoplay': 1,
                'controls': 1,
                'origin': 'http://localhost:3000'
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
    };

    function onPlayerReady(event) {
        console.log("YouTube Player is ready.");
        isPlayerReady = true;
        if (currentTrackIndex !== -1) {
            playSongByIndex(currentTrackIndex);
        }
    }

    // Reset error count when a video starts playing successfully
    function onPlayerStateChange(event) {
        console.log(`Player state changed: ${event.data}`);
        // Update play/pause button icon
        if (event.data === YT.PlayerState.PLAYING) {
            console.log("State is PLAYING, resetting error count.");
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            consecutiveErrors = 0; // Reset error count on successful play
            startProgressBar();
        } else {
            console.log(`State is NOT PLAYING (is ${event.data}), setting icon to play.`);
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            stopProgressBar();
        }
    }

    // --- Robust Error Handling: Auto-Skip with Circuit Breaker ---
    function onPlayerError(event) {
        console.error(`YouTube Player Error: ${event.data}. Video ID: ${currentTrackList[currentTrackIndex]}.`);
        consecutiveErrors++;

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.error("Max consecutive errors reached. Stopping playback.");
            player.stopVideo();
            playerFooter.classList.add('hidden');
            alert("Oynatılabilecek bir şarkı bulunamadı. Lütfen başka bir arama yapın veya daha sonra tekrar deneyin.");
            return;
        }

        console.log(`Skipping to next track (Error ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`);
        if (currentTrackIndex < currentTrackList.length - 1) {
            currentTrackIndex++;
            playSongByIndex(currentTrackIndex);
        } else {
            console.warn("End of track list reached. No more songs to skip to.");
            playerFooter.classList.add('hidden');
        }
    }

    // --- Navigation Logic ---
    async function showHomePage() {
        searchContainer.classList.add('hidden');
        homeLink.classList.add('active');
        searchLink.classList.remove('active');
        libraryLink.classList.remove('active');
        contentArea.innerHTML = '<h2>Popüler Müzikler</h2>';

        try {
            const response = await fetch('/popular');
            if (!response.ok) throw new Error('Popüler müzikler alınamadı.');
            const results = await response.json();

            currentTrackListWithDetails = results;
            currentTrackList = results.map(song => song.videoId);
            displayResults(results);
        } catch (error) {
            contentArea.innerHTML += `<p style="color: red;">Hata: ${error.message}</p>`;
        }
    }

    function showSearchPage() {
        searchContainer.classList.remove('hidden');
        contentArea.innerHTML = '';
        homeLink.classList.remove('active');
        searchLink.classList.add('active');
        libraryLink.classList.remove('active');
    }

    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showHomePage();
    });

    searchLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSearchPage();
    });

    libraryLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLibraryPage();
    });

    settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSettingsPage();
    });

    function showSettingsPage() {
        searchContainer.classList.add('hidden');
        homeLink.classList.remove('active');
        searchLink.classList.remove('active');
        libraryLink.classList.remove('active');
        settingsLink.classList.add('active');
        contentArea.innerHTML = `
            <h2>Ayarlar</h2>
            <div class="settings-container">
                <div class="setting-item">
                    <label for="playback-speed">Oynatma Hızı</label>
                    <select id="playback-speed">
                        <option value="0.5">0.5x</option>
                        <option value="1" selected>Normal</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label for="language-select">Dil</label>
                    <select id="language-select">
                        <option value="tr">Türkçe</option>
                        <option value="en">English</option>
                    </select>
                </div>
                <div class="setting-item disabled">
                    <label for="bass-boost">Bas Güçlendirme</label>
                    <input type="range" id="bass-boost" min="0" max="100" value="0" disabled>
                    <span>(Yakında)</span>
                </div>
                <div class="setting-item disabled">
                    <label>Ekolayzır</label>
                    <div class="equalizer-placeholder">
                        <p>Yakında</p>
                    </div>
                </div>
            </div>
        `;

        // Add event listener for playback speed
        const playbackSpeedSelector = document.getElementById('playback-speed');
        playbackSpeedSelector.addEventListener('change', (event) => {
            const newRate = parseFloat(event.target.value);
            if (player && typeof player.setPlaybackRate === 'function') {
                player.setPlaybackRate(newRate);
            }
        });
    }

    function showLibraryPage() {
        searchContainer.classList.add('hidden');
        homeLink.classList.remove('active');
        searchLink.classList.remove('active');
        libraryLink.classList.add('active');
        contentArea.innerHTML = '<h2>Kitaplığım</h2>';

        const library = getLibrary();
        if (library.length === 0) {
            contentArea.innerHTML += '<p>Kaydedilmiş şarkı bulunamadı.</p>';
            return;
        }

        // Use the same displayResults function for consistency
        currentTrackListWithDetails = library;
        currentTrackList = library.map(song => song.videoId);
        displayResults(library);
    }

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
            const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Arama sırasında bir hata oluştu.');
            const results = await response.json();

            currentTrackListWithDetails = results;
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
            resultItem.addEventListener('click', () => playSongByIndex(index));
            resultsGrid.appendChild(resultItem);
        });

        contentArea.appendChild(resultsGrid);
    }

    // --- Playback Logic ---
    function playSongByIndex(index) {
        if (index < 0 || index >= currentTrackList.length) {
            console.warn("Invalid track index:", index);
            return;
        }
        // Reset error count when user manually selects a new song
        consecutiveErrors = 0;
        currentTrackIndex = index;
        const videoId = currentTrackList[index];

        if (isPlayerReady && player && typeof player.loadVideoById === 'function') {
            console.log(`Loading video by index ${index}: ${videoId}`);
            player.loadVideoById(videoId);
            updateSongInfo();
            updateSaveButton(isSongInLibrary(videoId));
            playerFooter.classList.remove('hidden');
        } else {
            console.log("Player not ready, queuing track index:", index);
        }
    }

    // --- Custom Player Controls ---
    function updateSongInfo() {
        if (currentTrackIndex !== -1) {
            const currentSong = currentTrackListWithDetails[currentTrackIndex];
            songTitle.textContent = currentSong.title;
            // Simple split for artist, might not be perfect for all YouTube titles
            songArtist.textContent = currentSong.title.split(' - ')[0];
        }
    }

    function togglePlayPause() {
        if (!player || !isPlayerReady) return;
        const playerState = player.getPlayerState();
        if (playerState === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }

    function playNext() {
        if (currentTrackIndex < currentTrackList.length - 1) {
            playSongByIndex(currentTrackIndex + 1);
        } else {
            console.log("End of playlist.");
            // Optional: loop or stop
        }
    }

    function playPrev() {
        if (currentTrackIndex > 0) {
            playSongByIndex(currentTrackIndex - 1);
        } else {
             console.log("Start of playlist.");
        }
    }

    function startProgressBar() {
        stopProgressBar(); // Ensure no multiple intervals are running
        progressInterval = setInterval(() => {
            if (player && typeof player.getCurrentTime === 'function') {
                const currentTime = player.getCurrentTime();
                const duration = player.getDuration();
                if (duration > 0) {
                    const progressPercent = (currentTime / duration) * 100;
                    progress.style.width = `${progressPercent}%`;
                }
            }
        }, 500);
    }

    function stopProgressBar() {
        clearInterval(progressInterval);
        progressInterval = null;
    }

    function seek(event) {
        if (!player || !isPlayerReady || player.getDuration() <= 0) return;
        const progressBarRect = progressBar.getBoundingClientRect();
        const clickPositionX = event.clientX - progressBarRect.left;
        const progressBarWidth = progressBarRect.width;
        const seekRatio = clickPositionX / progressBarWidth;
        const seekToTime = player.getDuration() * seekRatio;
        player.seekTo(seekToTime, true);
    }

    // Event Listeners
    playPauseBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrev);
    progressBar.addEventListener('click', seek);
    saveToLibraryBtn.addEventListener('click', toggleSaveToLibrary);

    // --- Library Logic (localStorage) ---
    function getLibrary() {
        return JSON.parse(localStorage.getItem('hSoundLibrary')) || [];
    }

    function saveSongToLibrary(song) {
        const library = getLibrary();
        if (!isSongInLibrary(song.videoId)) {
            library.push(song);
            localStorage.setItem('hSoundLibrary', JSON.stringify(library));
        }
    }

    function removeSongFromLibrary(videoId) {
        let library = getLibrary();
        library = library.filter(song => song.videoId !== videoId);
        localStorage.setItem('hSoundLibrary', JSON.stringify(library));
    }

    function isSongInLibrary(videoId) {
        const library = getLibrary();
        return library.some(song => song.videoId === videoId);
    }

    function toggleSaveToLibrary() {
        if (currentTrackIndex === -1) return;
        const currentSong = currentTrackListWithDetails[currentTrackIndex];
        if (isSongInLibrary(currentSong.videoId)) {
            removeSongFromLibrary(currentSong.videoId);
            updateSaveButton(false);
        } else {
            saveSongToLibrary(currentSong);
            updateSaveButton(true);
        }
    }

    function updateSaveButton(isSaved) {
        if (isSaved) {
            saveToLibraryBtn.innerHTML = '<i class="fas fa-heart"></i>'; // Solid heart
        } else {
            saveToLibraryBtn.innerHTML = '<i class="far fa-heart"></i>'; // Regular heart
        }
    }


    // --- Mobile Navigation Logic ---
    function openSidebar() {
        sidebar.classList.add('visible');
        overlay.classList.remove('hidden');
    }

    function closeSidebar() {
        sidebar.classList.remove('visible');
        overlay.classList.add('hidden');
    }

    menuToggleBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (sidebar.classList.contains('visible')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    overlay.addEventListener('click', closeSidebar);


    // --- Initial Page Load ---
    showHomePage();
});
