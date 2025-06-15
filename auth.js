// frontend/auth.js
// Handles NutriTracker authentication: login, token storage, refresh, and logout

const AUTH_TOKEN_KEY = 'nutritracker_token';
const REFRESH_TOKEN_KEY = 'nutritracker_refresh_token';
const API_BASE = 'https://nutritracker.exautomata.ai';

function storeTokens(token, refreshToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

// Add a global error message area to the page if not present
function ensureErrorArea() {
    if (!document.getElementById('global-error')) {
        const errDiv = document.createElement('div');
        errDiv.id = 'global-error';
        errDiv.style.position = 'fixed';
        errDiv.style.top = '24px';
        errDiv.style.left = '50%';
        errDiv.style.transform = 'translateX(-50%)';
        errDiv.style.background = '#f44336';
        errDiv.style.color = '#fff';
        errDiv.style.padding = '12px 24px';
        errDiv.style.borderRadius = '6px';
        errDiv.style.fontWeight = 'bold';
        errDiv.style.zIndex = 9999;
        errDiv.style.display = 'none';
        document.body.appendChild(errDiv);
    }
}

function showError(msg) {
    ensureErrorArea();
    const errDiv = document.getElementById('global-error');
    errDiv.textContent = msg;
    errDiv.style.display = 'block';
    setTimeout(() => { errDiv.style.display = 'none'; }, 3500);
}

function logoutUser(msg) {
    clearTokens();
    showError(msg || 'You have been logged out.');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
}

async function refreshAuthToken() {
    const user = firebase.auth().currentUser;
    if (!user) {
        logoutUser('Session expired. Please log in again.');
        return null;
    }
    try {
        const token = await user.getIdToken(true);
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        return token;
    } catch (e) {
        logoutUser('Session expired. Please log in again.');
        return null;
    }
}

function fetchWithAuth(url, options = {}) {
    let token = getToken();
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, options).then(async res => {
        if (res.status === 401 && getRefreshToken()) {
            token = await refreshAuthToken();
            if (!token) return res;
            options.headers['Authorization'] = 'Bearer ' + token;
            return fetch(url, options);
        }
        return res;
    });
}
window.fetchWithAuth = fetchWithAuth;

if (typeof module !== "undefined" && module.exports) { module.exports = {storeTokens, clearTokens, getToken, getRefreshToken, fetchWithAuth, refreshAuthToken, showError, logoutUser}; }
