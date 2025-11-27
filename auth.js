document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.textContent = ''; // Clear previous errors

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                errorMessage.textContent = 'Şifreler eşleşmiyor.';
                return;
            }

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    console.error('Registration failed with status:', response.status);
                    throw new Error(data.error || 'Registration failed');
                }

                console.log('Registration successful, redirecting to login page...');
                // Redirect to login page on successful registration
                window.location.href = 'login.html';

            } catch (error) {
                errorMessage.textContent = error.message;
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.textContent = ''; // Clear previous errors

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                // Set a flag in localStorage to indicate the user is logged in
                localStorage.setItem('isLoggedIn', 'true');

                // On successful login, redirect to the main app page
                window.location.href = 'index.html';

            } catch (error) {
                errorMessage.textContent = error.message;
            }
        });
    }
});
