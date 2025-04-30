// Authentication state
let currentUser = null;
let userFavorites = [];

// DOM elements for auth (these will be initialized when the document is loaded)
let loginForm, registerForm, loginButton, registerButton;
let showLoginButton, showRegisterButton, logoutLink;
let profileLink, favoritesLink, loginNavItem, registerNavItem;
let userNavItem, usernameDisplay;
let loginModal, registerModal;

// Initialize auth module
function initAuth() {
    // Initialize DOM elements
    loginForm = document.getElementById('loginForm');
    registerForm = document.getElementById('registerForm');
    loginButton = document.getElementById('loginButton');
    registerButton = document.getElementById('registerButton');
    showLoginButton = document.getElementById('showLoginButton');
    showRegisterButton = document.getElementById('showRegisterButton');
    logoutLink = document.getElementById('logoutLink');
    profileLink = document.getElementById('profileLink');
    favoritesLink = document.getElementById('favoritesLink');
    loginNavItem = document.getElementById('loginNavItem');
    registerNavItem = document.getElementById('registerNavItem');
    userNavItem = document.getElementById('userNavItem');
    usernameDisplay = document.getElementById('usernameDisplay');

    // Initialize modals
    loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    registerModal = new bootstrap.Modal(document.getElementById('registerModal'));

    // Add event listeners
    loginButton.addEventListener('click', handleLogin);
    registerButton.addEventListener('click', handleRegister);
    showLoginButton.addEventListener('click', showLogin);
    showRegisterButton.addEventListener('click', showRegister);
    logoutLink.addEventListener('click', handleLogout);
    profileLink.addEventListener('click', showProfile);
    favoritesLink.addEventListener('click', showFavorites);

    // Check auth status
    checkAuth();
}

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Authentication failed');
                }
            })
            .then(user => {
                currentUser = user;
                userFavorites = user.favorites || [];
                updateAuthUI(true);
                fetchUserFavorites();
            })
            .catch(error => {
                console.error('Auth check failed:', error);
                localStorage.removeItem('token');
                updateAuthUI(false);
            });
    } else {
        updateAuthUI(false);
    }
}

// Update UI based on auth state
function updateAuthUI(isLoggedIn) {
    if (isLoggedIn && currentUser) {
        loginNavItem.classList.add('d-none');
        registerNavItem.classList.add('d-none');
        userNavItem.classList.remove('d-none');
        usernameDisplay.textContent = currentUser.username;
    } else {
        loginNavItem.classList.remove('d-none');
        registerNavItem.classList.remove('d-none');
        userNavItem.classList.add('d-none');
        usernameDisplay.textContent = 'User';
    }
}

// Handle login
function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    errorDiv.classList.add('d-none');

    fetch('/api/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                errorDiv.textContent = data.error;
                errorDiv.classList.remove('d-none');
            } else {
                localStorage.setItem('token', data.token);
                currentUser = data.user;
                loginModal.hide();
                loginForm.reset();
                checkAuth();
                showToast('Success', 'Logged in successfully', 'success');
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            errorDiv.textContent = 'An error occurred during login';
            errorDiv.classList.remove('d-none');
        });
}

// Handle registration
function handleRegister() {
    const name = document.getElementById('registerName').value;
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');

    errorDiv.classList.add('d-none');

    // Basic validation
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.classList.remove('d-none');
        return;
    }

    fetch('/api/users/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, username, email, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                errorDiv.textContent = data.error;
                errorDiv.classList.remove('d-none');
            } else {
                localStorage.setItem('token', data.token);
                currentUser = data.user;
                registerModal.hide();
                registerForm.reset();
                checkAuth();
                showToast('Success', 'Registration successful', 'success');
            }
        })
        .catch(error => {
            console.error('Registration error:', error);
            errorDiv.textContent = 'An error occurred during registration';
            errorDiv.classList.remove('d-none');
        });
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('token');
    currentUser = null;
    userFavorites = [];
    updateAuthUI(false);
    // Redirect to artworks view
    if (typeof setCurrentView === 'function') {
        setCurrentView('artworks');
    }
    showToast('Success', 'Logged out successfully', 'success');
}

// Show login modal
function showLogin() {
    registerModal.hide();
    setTimeout(() => {
        loginModal.show();
    }, 400);
}

// Show register modal
function showRegister() {
    loginModal.hide();
    setTimeout(() => {
        registerModal.show();
    }, 400);
}

// Export auth functions
window.auth = {
    initAuth,
    checkAuth,
    currentUser: () => currentUser,
    isLoggedIn: () => !!currentUser,
    userFavorites: () => userFavorites
};