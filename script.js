document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const musicPlayer = document.getElementById('music-player');
    const createAccountBtn = document.getElementById('create-account-btn');
    const loginBtn = document.getElementById('login-btn');

    createAccountBtn.addEventListener('click', () => {
        loginScreen.style.display = 'none';
        musicPlayer.style.display = 'block';
    });

    loginBtn.addEventListener('click', () => {
        loginScreen.style.display = 'none';
        musicPlayer.style.display = 'block';
    });
});
