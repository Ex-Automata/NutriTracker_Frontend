// index.js
// Handles all NutriTracker main app logic (tabs, auth, nutrition fetch, etc.)

document.addEventListener('DOMContentLoaded', function() {
    const tabs = [
        { id: 'tab-track', file: 'track.html', placeholder: '<h2>Placeholder</h2><p>Track your meals and nutrition here.</p>' },
        { id: 'tab-stats', file: 'stats.html', placeholder: '<h2>Placeholder</h2><p>View your nutrition statistics here.</p>' },
        { id: 'tab-profile', file: 'profile.html', placeholder: '<h2>Placeholder</h2><p>Manage your profile here.</p>' }
    ];
    const mainContent = document.getElementById('main-content');
    function setActiveTab(tabId) {
        document.querySelectorAll('.tab').forEach(btn => {
            btn.classList.toggle('active', btn.id === tabId);
        });
    }
    function loadTab(tabIdx) {
        setActiveTab(tabs[tabIdx].id);
        fetch(tabs[tabIdx].file)
            .then(res => res.ok ? res.text() : null)
            .then(html => {
                if (html) {
                    mainContent.innerHTML = html;
                    // Dynamically load and execute track.js if loading Track tab
                    if (tabs[tabIdx].id === 'tab-track') {
                        // Load log.js first, then track.js
                        const logScript = document.createElement('script');
                        logScript.src = 'components/log.js';
                        logScript.onload = () => {
                            const script = document.createElement('script');
                            script.src = 'track.js';
                            script.onload = () => {
                                console.log('track.js loaded');
                                // Call fetchLogs after scripts are loaded
                                if (typeof window.fetchLogs === 'function') {
                                    window.fetchLogs();
                                }
                            };
                            document.body.appendChild(script);
                        };
                        document.body.appendChild(logScript);
                    }
                } else {
                    mainContent.innerHTML = tabs[tabIdx].placeholder;
                }
            });
    }
    document.getElementById('tab-track').addEventListener('click', () => {
        console.log('Track tab clicked');
        loadTab(0);
    });
    //document.getElementById('tab-stats').addEventListener('click', () => {
    //    console.log('Stats tab clicked');
    //    loadTab(1);
    //});
    //document.getElementById('tab-profile').addEventListener('click', () => {
    //    console.log('Profile tab clicked');
    //    loadTab(2);
    //});
    
    const token = getToken();
    if (token) {
        document.getElementById('main-app-container').style.display = '';
        window.userToken = token;
        window.nutritionData = undefined; // Store the latest nutrition data globally
        // Fetch nutrition data and update UI on Track tab load
        async function fetchNutritionAndUpdate() {
            const res = await fetchWithAuth('https://nutritracker.exautomata.ai:5000/nutrition', { method: 'GET' });
            if (res.status === 401) {
                logoutUser('Session expired or invalid. Please log in again.');
                return;
            }
            const data = await res.json();
            window.nutritionData = data; // Store fetched data globally
            const activeTab = document.querySelector('.tab.active');
            if (activeTab && activeTab.id === 'tab-track') {
                // Check for malformed data
                if (!data || typeof data !== 'object' || !data.calories || !data.protein || !data.carbs || !data.fat) {
                    logoutUser('Malformed nutrition data.');
                    return;
                }
                updateNutritionSidebar(data);
                // If logs are available, re-render them with updated nutrition info
                if (typeof window.renderLogsFromData === 'function' && window.logData) {
                    window.renderLogsFromData();
                }
            }
        }
        function updateNutritionSidebar(data) {
            // No longer needed: handled by summary log in track.js
        }
        document.getElementById('tab-track').addEventListener('click', function() {
            setTimeout(fetchNutritionAndUpdate, 100);
        });
        setTimeout(fetchNutritionAndUpdate, 300);
    } else {
        logoutUser('Please log in.');
    }
    // Initial load
    loadTab(0);
});
