// track.js
// Handles chat and sidebar logic for NutriTracker Track tab

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

// Loaded log template for reuse
let logTemplate = null;
if (typeof fetch !== 'undefined') {
    fetch('components/log.html')
        .then(r => r.text ? r.text() : Promise.reject())
        .then(t => {
            const tmp = document.createElement('div');
            tmp.innerHTML = t.trim();
            logTemplate = tmp.querySelector('template');
        })
        .catch(() => {
            const tmp = document.createElement('template');
            logTemplate = tmp;
        });
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatMessage(text) {
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br>');
    return html;
}

if (chatForm) {
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Submit handler triggered');
        const msg = chatInput.value.trim();
        if (msg) {
            const row = document.createElement('div');
            row.className = 'message-row user';
            const div = document.createElement('div');
            div.innerHTML = formatMessage(msg);
            div.className = 'message';
            row.appendChild(div);
            if (chatMessages) {
                chatMessages.appendChild(row);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            chatInput.value = '';
            // Send to backend AI chat
            sendToAIChat(msg);
        }
        return false;
    });
}

// Maintain chat history in memory for this session
let chatHistory = [];

function createLogElement(log, dailyGoals = window.nutritionData, opts = {}) {
    if (!logTemplate) return null;
    const node = logTemplate.content.cloneNode(true);
    const entry = node.querySelector('.log-entry');
    // If static, remove 'pending' class
    if (opts.static) entry.classList.remove('pending');
    // Set log data
    if (window.setLogData) {
        window.setLogData(entry, log, dailyGoals, opts);
    }
    // Hide log-actions for static logs
    const actions = entry.querySelector('.log-actions');
    if (opts.static && actions) actions.style.display = 'none';
    // Make title not editable for static logs
    const title = entry.querySelector('#log-title');
    if (opts.static && title) title.removeAttribute('contenteditable');
    // Only add event listeners for editable logs
    if (!opts.static) {
        const accept = entry.querySelector('.accept-log');
        const reject = entry.querySelector('.reject-log');
        if (accept) accept.addEventListener('click', () => saveLog(entry, log));
        if (reject) reject.addEventListener('click', () => entry.parentElement.remove());
    }
    // Expand/collapse logic
    if (opts.static) {
        const logContent = entry.querySelector('.log-content');
        logContent.classList.add('log-collapsed'); // Start collapsed
        const toggleBtn = entry.querySelector('.log-expand-toggle');
        toggleBtn.classList.add("visible");
        toggleBtn.classList.remove("hidden");
        const glyph = entry.querySelector('.log-expand-glyph');
        if (logContent && toggleBtn && glyph) {
            let expanded = false;
            function setState(exp) {
                expanded = exp;
                if (expanded) {
                    logContent.classList.remove('log-collapsed');
                    glyph.textContent = 'keyboard_arrow_up'; // up
                } else {
                    logContent.classList.add('log-collapsed');
                    glyph.textContent = 'keyboard_arrow_down'; // down
                }
            }
            setState(false);
            toggleBtn.addEventListener('click', () => setState(!expanded));
        }
    }
    return entry;
}

function presentLog(log) {
    const el = createLogElement(log);
    if (!el) return;
    const row = document.createElement('div');
    row.className = 'message-row center';
    row.appendChild(el);
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function saveLog(element, log) {
    if (!log.timestamp) {
        log.timestamp = Math.floor(Date.now() / 1000);
    }
    fetchWithAuth('https://nutritracker.exautomata.ai/logs', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(log)
    }).then(() => {
        element.classList.remove('pending');
        const actions = element.querySelector('.log-actions');
        if (actions) actions.remove();
    }).then(() => {
        // Update nutrition data after saving log
        // Add new log to window.logData
        const date = log.timestamp ? (new Date(log.timestamp * 1000)).toISOString().slice(0, 10) : (new Date()).toISOString().slice(0, 10);
        if (!window.logData[date]) window.logData[date] = [];
        window.logData[date].unshift(log);
        renderLogsFromData();
    })
}

window.sendToAIChat = function(userMsg) {
    console.log('Actually sending message');
    chatHistory.push({ role: 'user', content: userMsg });
    return fetchWithAuth('https://nutritracker.exautomata.ai/ai_chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: chatHistory })
    })
    .then(res => {
        if (res.status === 401) {
            logoutUser('Session expired or invalid. Please log in again.');
            return { reply: 'Session expired.' };
        }
        return res.json();
    })
    .then(data => {
        let reply = data.reply || data.error || { text: 'Sorry, no response.' };
        
        if (reply.log_result) {
            const log_result = reply.log_result;
            presentLog(log_result);
            chatHistory.push({ role: 'assistant', content: "Log presented to user" + JSON.stringify(reply.log_result) });
        }
        chatHistory.push({ role: 'assistant', content: reply.text || "Empty response/Error" });
        const botRow = document.createElement('div');
        botRow.className = 'message-row bot';
        const botDiv = document.createElement('div');
        botDiv.innerHTML = formatMessage(reply.text);
        botDiv.className = 'bot-message';
        botRow.appendChild(botDiv);
        if (chatMessages) {
            chatMessages.appendChild(botRow);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    })
    .catch((err) => {
        console.error('Error in sendToAIChat:', err);
        const botRow = document.createElement('div');
        botRow.className = 'message-row bot';
        const botDiv = document.createElement('div');
        botDiv.innerHTML = formatMessage('Error contacting AI.');
        botDiv.className = 'bot-message';
        botRow.appendChild(botDiv);
        if (chatMessages) {
            chatMessages.appendChild(botRow);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });
}

window.updateNutritionBars = function(data) {
    // Calories
    //const calAmt = document.getElementById('nutrient-calories-amount');
    //const calFill = document.getElementById('nutrient-calories-bar-fill');
    //if (calAmt && calFill && data.calories) {
    //    calAmt.textContent = `${data.calories.current} / ${data.calories.goal} kcal`;
    //    const percent = Math.round(100 * data.calories.current / data.calories.goal);
    //    calFill.style.width = percent + '%';
    //}
    //// Protein
    //const protAmt = document.getElementById('nutrient-protein-amount');
    //const protFill = document.getElementById('nutrient-protein-bar-fill');
    //if (protAmt && protFill && data.protein) {
    //    protAmt.textContent = `${data.protein.current}g / ${data.protein.goal}g`;
    //    const percent = Math.round(100 * data.protein.current / data.protein.goal);
    //    protFill.style.width = percent + '%';
    //}
    //// Carbs
    //const carbAmt = document.getElementById('nutrient-carbs-amount');
    //const carbFill = document.getElementById('nutrient-carbs-bar-fill');
    //if (carbAmt && carbFill && data.carbs) {
    //    carbAmt.textContent = `${data.carbs.current}g / ${data.carbs.goal}g`;
    //    const percent = Math.round(100 * data.carbs.current / data.carbs.goal);
    //    carbFill.style.width = percent + '%';
    //}
    //// Fat
    //const fatAmt = document.getElementById('nutrient-fat-amount');
    //const fatFill = document.getElementById('nutrient-fat-bar-fill');
    //if (fatAmt && fatFill && data.fat) {
    //    fatAmt.textContent = `${data.fat.current}g / ${data.fat.goal}g`;
    //    const percent = Math.round(100 * data.fat.current / data.fat.goal);
    //    fatFill.style.width = percent + '%';
    //}
}

// Utility to fetch logs and render in log-list
window.logData = {};

function renderLogsFromData() {
    const logList = document.querySelector('.log-list');
    if (!logList) return;
    logList.innerHTML = '';
    const grouped = window.logData;
    const todayStr = (new Date()).toISOString().slice(0, 10);
    // --- Render Nutrition Summary as a log at the top ---
    if (window.nutritionData) {
        let nutritionSummary = { calories: {current: 0, goal: window.nutritionData.calories.goal}, protein: {current: 0, goal: window.nutritionData.protein.goal}, carbs: {current: 0, goal: window.nutritionData.carbs.goal}, fat: {current: 0, goal: window.nutritionData.fat.goal} };
        if (grouped[todayStr] && grouped[todayStr].length > 0 && window.nutritionData) {
            // Calculate today's nutrition nutritionSummary
            
            grouped[todayStr].forEach(log => {
                if (log.macros) {
                    nutritionSummary.calories.current += log.macros.calories || 0;
                    nutritionSummary.protein.current  += log.macros.protein  || 0;
                    nutritionSummary.carbs.current    += log.macros.carbs    || 0;
                    nutritionSummary.fat.current      += log.macros.fat      || 0;
                }
            });
        
            updateTodaysNutritionSummary(nutritionSummary)
        }
    }
    // --- Render logs grouped by date ---
    Object.keys(grouped).sort((a, b) => b.localeCompare(a)).forEach(date => {
        let headerText = (date === todayStr)
            ? 'Today'
            : (new Date(date)).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
        const dateHeader = document.createElement('div');
        dateHeader.className = 'log-date-header';
        dateHeader.textContent = headerText;
        logList.appendChild(dateHeader);
        // Render newest logs first within each date
        grouped[date].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).forEach(log => {
            const entry = createLogElement(log, undefined, { static: true });
            if (entry) logList.appendChild(entry);
        });
    });
    // Stay scrolled to the top
    logList.scrollTop = 0;
}

function updateTodaysNutritionSummary(nutritionSummary) {
    // Create a custom summary log element styled like a log
    // Update the nutrition summary bars at the top of the page
    const calAmt = document.getElementById('nutrient-calories-amount');
    if (calAmt) {
        calAmt.innerText = `${nutritionSummary.calories.current} / ${nutritionSummary.calories.goal} kcal`;
        const calFill = document.getElementById('nutrient-calories-bar-fill');
        if (calFill) {
            const percent = Math.round(100 * nutritionSummary.calories.current / nutritionSummary.calories.goal);
            calFill.style.width = percent + '%';
        }
    }
    const protAmt = document.getElementById('nutrient-protein-amount');
    if (protAmt) {
        protAmt.innerText = `${nutritionSummary.protein.current}g / ${nutritionSummary.protein.goal}g`;
        const protFill = document.getElementById('nutrient-protein-bar-fill');
        if (protFill) {
            const percent = Math.round(100 * nutritionSummary.protein.current / nutritionSummary.protein.goal);
            protFill.style.width = percent + '%';
        }
    }
    const carbAmt = document.getElementById('nutrient-carbs-amount');
    if (carbAmt) {
        carbAmt.innerText = `${nutritionSummary.carbs.current}g / ${nutritionSummary.carbs.goal}g`;
        const carbFill = document.getElementById('nutrient-carbs-bar-fill');
        if (carbFill) {
            const percent = Math.round(100 * nutritionSummary.carbs.current / nutritionSummary.carbs.goal);
            carbFill.style.width = percent + '%';
        }
    }
    const fatAmt = document.getElementById('nutrient-fat-amount');
    if (fatAmt) {
        fatAmt.innerText = `${nutritionSummary.fat.current}g / ${nutritionSummary.fat.goal}g`;
        const fatFill = document.getElementById('nutrient-fat-bar-fill');
        if (fatFill) {
            const percent = Math.round(100 * nutritionSummary.fat.current / nutritionSummary.fat.goal);
            fatFill.style.width = percent + '%';
        }
    }
}

function fetchLogs() {
    fetchWithAuth('https://nutritracker.exautomata.ai/logs?limit=20', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        const logs = Array.isArray(data.logs) ? data.logs : [];
        // Sort logs newest first
        logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const grouped = {};
        logs.forEach(log => {
            const date = log.timestamp ? (new Date(log.timestamp * 1000)).toISOString().slice(0, 10) : 'Unknown';
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(log);
        });
        window.logData = grouped;
        renderLogsFromData();
    })
    .catch(err => {
        console.error('Failed to load logs:', err);
    });
}