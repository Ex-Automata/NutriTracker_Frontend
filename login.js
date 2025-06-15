// login.js rewritten for Firebase Auth

// Initialize on DOM ready to handle email link logins
window.addEventListener('DOMContentLoaded', () => {
    if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
        // Retrieve email from local storage
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            email = window.prompt('Please provide your email for confirmation');
        }
        firebase.auth().signInWithEmailLink(email, window.location.href)
            .then(async (result) => {
                window.localStorage.removeItem('emailForSignIn');
                const token = await result.user.getIdToken();
                storeTokens(token, result.user.refreshToken);
                window.location.href = 'index.html';
            })
            .catch(err => {
                showError('Login failed');
                console.error(err);
            });
    }
});

function handleEmailLink(e) {
    console.log('Email link login currently disabled');
    return;
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    if (!email) return;
    const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true
    };
    firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings)
        .then(() => {
            window.localStorage.setItem('emailForSignIn', email);
            document.getElementById('auth-link-container').style.display = 'block';
        })
        .catch(err => {
            showError('Failed to send email link');
            console.error(err);
        });
}

function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(async result => {
            const token = await result.user.getIdToken();
            storeTokens(token, result.user.refreshToken);
            window.location.href = 'index.html';
        })
        .catch(err => {
            showError('Google login failed');
            console.error(err);
        });
}
