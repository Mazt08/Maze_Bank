// Maze Bank - Authentication Handler (Login & Registration)

document.addEventListener('DOMContentLoaded', () => {
    // Check if user already has an active session on auth pages
    checkExistingSession();

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlerts();

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!username || !password) {
                showAlert('Please enter both your username and password.', 'danger');
                return;
            }

            setLoading(submitBtn, true);

            try {
                const response = await fetch('api/auth/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Redirect to dashboard on successful login
                    window.location.href = 'dashboard.html';
                } else {
                    showAlert(data.message || 'Authentication failed. Please verify credentials.', 'danger');
                }
            } catch (err) {
                showAlert('Network error: Unable to contact authentication server.', 'danger');
            } finally {
                setLoading(submitBtn, false);
            }
        });
    }

    // Register Form Handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlerts();

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!username || !password || !confirmPassword) {
                showAlert('All fields are required.', 'danger');
                return;
            }

            if (password !== confirmPassword) {
                showAlert('Passwords do not match. Please verify.', 'danger');
                return;
            }

            if (password.length < 6) {
                showAlert('Password must be at least 6 characters long.', 'danger');
                return;
            }

            setLoading(submitBtn, true);

            try {
                const response = await fetch('api/auth/register.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    window.location.href = 'dashboard.html';
                } else {
                    showAlert(data.message || 'Registration failed.', 'danger');
                }
            } catch (err) {
                showAlert('Network error: Unable to complete registration.', 'danger');
            } finally {
                setLoading(submitBtn, false);
            }
        });
    }
});

async function checkExistingSession() {
    try {
        const response = await fetch('api/auth/session.php');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                window.location.href = 'dashboard.html';
            }
        }
    } catch (e) {
        // Session check silently fails if unauthenticated or offline
    }
}

function showAlert(message, type = 'danger') {
    const alertBox = document.getElementById('alertBox');
    if (!alertBox) return;

    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove('d-none');
}

function clearAlerts() {
    const alertBox = document.getElementById('alertBox');
    if (!alertBox) return;
    alertBox.textContent = '';
    alertBox.classList.add('d-none');
}

function setLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'Processing...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Submit';
    }
}
