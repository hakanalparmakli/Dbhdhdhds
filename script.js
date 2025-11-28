document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check ---
    (function authCheck() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const authScreen = document.getElementById('auth-screen');
        const musicPlayer = document.getElementById('music-player');

        if (isLoggedIn === 'true') {
            authScreen.style.display = 'none';
            musicPlayer.style.display = 'block';
        } else {
            authScreen.style.display = 'block';
            musicPlayer.style.display = 'none';
        }
    })();


    // --- Logout Logic ---
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('accessToken');
            window.location.reload();
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
    const songThumbnail = document.getElementById('song-thumbnail');

    // Modal elements
    const videoModal = document.getElementById('video-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalPlayPauseBtn = document.getElementById('modal-play-pause-btn');
    const modalNextBtn = document.getElementById('modal-next-btn');
    const modalPrevBtn = document.getElementById('modal-prev-btn');


    let player;
    let modalPlayer;
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
            height: '0', // It's hidden anyway
            width: '0',
            playerVars: {
                'autoplay': 1,
                'controls': 0, // Hide default controls
                'origin': 'http://localhost:3000'
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });

        modalPlayer = new YT.Player('modal-player', {
            height: '100%',
            width: '100%',
            playerVars: {
                'autoplay': 1,
                'controls': 0, // We use custom controls
                'origin': 'http://localhost:3000'
            },
            events: {
                // We can reuse the same handlers for simplicity
                'onStateChange': onModalPlayerStateChange
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
        // This function now controls BOTH the main player and modal player icons
        const state = event.data;
        const playIcon = '<i class="fas fa-play"></i>';
        const pauseIcon = '<i class="fas fa-pause"></i>';

        if (state === YT.PlayerState.PLAYING) {
            playPauseBtn.innerHTML = pauseIcon;
            modalPlayPauseBtn.innerHTML = pauseIcon;
            consecutiveErrors = 0;
            startProgressBar();
        } else {
            playPauseBtn.innerHTML = playIcon;
            modalPlayPauseBtn.innerHTML = playIcon;
            stopProgressBar();
        }
    }

    // A separate state change handler for the modal player to avoid conflicts
    function onModalPlayerStateChange(event) {
        onPlayerStateChange(event); // Reuse the same logic for UI updates
    }


    // --- Modal Logic ---
    function openModal() {
        if (currentTrackIndex === -1) return;

        const currentTime = player.getCurrentTime();

        videoModal.classList.remove('hidden');

        // Load the same video in the modal player and seek to the current time
        modalPlayer.loadVideoById(currentTrackList[currentTrackIndex], currentTime);

        // Pause the small player
        player.pauseVideo();
    }

    function closeModal() {
        const currentTime = modalPlayer.getCurrentTime();

        videoModal.classList.add('hidden');

        // Stop the video in the modal
        modalPlayer.stopVideo();

        // Resume the small player from where the modal player left off
        player.seekTo(currentTime, true);
        player.playVideo();
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
    function showHomePage() {
        searchContainer.classList.add('hidden');
        homeLink.classList.add('active');
        searchLink.classList.remove('active');
        libraryLink.classList.remove('active');
        contentArea.innerHTML = '<h2>Welcome to H-Sound</h2><p>Search for music to get started.</p>';
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

        const t = currentTranslations || {};

        contentArea.innerHTML = `
            <h2>${t.settings || 'Ayarlar'}</h2>
            <div class="settings-container">
                <div class="setting-item">
                    <label for="playback-speed">${t.playback_speed || 'Oynatma Hızı'}</label>
                    <select id="playback-speed">
                        <option value="0.5">0.5x</option>
                        <option value="1" selected>${t.normal_speed || 'Normal'}</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label for="language-select">${t.language || 'Dil'}</label>
                    <select id="language-select">
                        <option value="tr">Türkçe</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>
        `;

        // Add event listeners
        const playbackSpeedSelector = document.getElementById('playback-speed');
        playbackSpeedSelector.addEventListener('change', (event) => {
            const newRate = parseFloat(event.target.value);
            if (player && typeof player.setPlaybackRate === 'function') {
                player.setPlaybackRate(newRate);
            }
        });

        const languageSelector = document.getElementById('language-select');
        const savedLang = localStorage.getItem('hSoundLanguage') || 'tr';
        languageSelector.value = savedLang;
        languageSelector.addEventListener('change', (event) => {
            loadLanguage(event.target.value);
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

            // If the modal is open, also load the video there
            if (!videoModal.classList.contains('hidden')) {
                modalPlayer.loadVideoById(videoId);
            }

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
            const songThumbnail = document.getElementById('song-thumbnail');

            songTitle.textContent = currentSong.title;
            songArtist.textContent = currentSong.title.split(' - ')[0]; // Simple artist split
            songThumbnail.src = currentSong.thumbnail;
            songThumbnail.alt = currentSong.title; // for accessibility
        }
    }

    function togglePlayPause() {
        const activePlayer = videoModal.classList.contains('hidden') ? player : modalPlayer;
        if (!activePlayer || !isPlayerReady) return;

        const playerState = activePlayer.getPlayerState();
        if (playerState === YT.PlayerState.PLAYING) {
            activePlayer.pauseVideo();
        } else {
            activePlayer.playVideo();
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
    songThumbnail.addEventListener('click', openModal);
    modalCloseBtn.addEventListener('click', closeModal);

    // Modal control listeners
    modalPlayPauseBtn.addEventListener('click', togglePlayPause); // Can reuse the same function
    modalNextBtn.addEventListener('click', playNext);
    modalPrevBtn.addEventListener('click', playPrev);

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


    // --- Internationalization (i18n) ---
    let currentTranslations = {};

    async function loadLanguage(lang) {
        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Could not load language file: ${lang}`);
            }
            const translations = await response.json();
            currentTranslations = translations;
            updateUIText(translations);
            localStorage.setItem('hSoundLanguage', lang);

            // If the settings page is currently active, re-run its logic to apply new translations
            if (settingsLink.classList.contains('active')) {
                showSettingsPage();
            }
        } catch (error) {
            console.error('Failed to load language:', error);
            // Fallback to Turkish if loading fails
            if (lang !== 'tr') {
                loadLanguage('tr');
            }
        }
    }

    function updateUIText(t) {
        // Update sidebar
        document.querySelector('#home-link').innerHTML = `<i class="fas fa-home"></i> ${t.home}`;
        document.querySelector('#search-link').innerHTML = `<i class="fas fa-search"></i> ${t.search}`;
        document.querySelector('#library-link').innerHTML = `<i class="fas fa-book"></i> ${t.library}`;
        document.querySelector('#settings-link').innerHTML = `<i class="fas fa-cog"></i> ${t.settings}`;
        document.querySelector('#logout-link').innerHTML = `<i class="fas fa-sign-out-alt"></i> ${t.logout}`;

        // Update search bar
        document.getElementById('search-bar').placeholder = t.search_placeholder;
        document.getElementById('search-btn').textContent = t.search_button;

        // Update content headers dynamically
        const currentHeader = contentArea.querySelector('h2');
        if (currentHeader) {
            if (currentHeader.textContent.includes('Popüler')) {
                currentHeader.textContent = t.popular_music;
            } else if (currentHeader.textContent.includes('Arama')) {
                currentHeader.textContent = t.search_results;
            } else if (currentHeader.textContent.includes('Kitaplığım')) {
                currentHeader.textContent = t.my_library;
            } else if (currentHeader.textContent.includes('Ayarlar')) {
                currentHeader.textContent = t.settings;
            }
        }
    }

    // --- Auth Forms Logic ---
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (data.accessToken) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('accessToken', data.accessToken);
                window.location.reload();
            } else {
                alert(data.error);
            }
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();
            alert(data.message || data.error);
        });
    }

    // --- Initial Page Load ---
    const savedLang = localStorage.getItem('hSoundLanguage') || 'tr';
    loadLanguage(savedLang).then(() => {
        showHomePage();
    });
});
