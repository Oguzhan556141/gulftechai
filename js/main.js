import { CONFIG } from './config.js';
import { UI, $, $$ } from './ui.js';
import { getNextRegional, delay, renderMarkdown } from './utils.js';
import { callGeminiAPI, simulateResponse } from './api.js';
import { renderMap } from './map.js';

let appData = null;
let conversations = JSON.parse(localStorage.getItem(CONFIG.CONV_STORAGE_KEY) || '{}');
let currentConvId = null;
let isResponding = false;
let apiKey = localStorage.getItem(CONFIG.API_KEY_STORAGE_KEY) || '';
let model = localStorage.getItem(CONFIG.MODEL_STORAGE_KEY) || CONFIG.DEFAULT_MODEL;

async function init() {
    try {
        const [dataRes, knowRes] = await Promise.all([
            fetch(CONFIG.DATA_PATH),
            fetch('knowledge.json')
        ]);
        appData = await dataRes.json();
        window.appKnowledge = await knowRes.json(); // Global for now or pass as needed
    } catch (err) {
        console.error('Initial load error:', err);
    }

    UI.updateApiStatus(apiKey, model);
    loadHistory();
    bindEvents();
    UI.autoResizeInput();
    
    if (apiKey) UI.apiKeyInput.value = apiKey;
    UI.modelSelect.value = model;

    UI.updateCountdown(getNextRegional(appData?.regionals));
    setInterval(() => UI.updateCountdown(getNextRegional(appData?.regionals)), 1000);

    // Initial Mascot Animation Setup
    setupMascotInteractions();
    
    // Dynamic background effects
    initDynamicStars();
}

function bindEvents() {
    UI.sendBtn.addEventListener('click', handleSend);
    UI.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    UI.chatInput.addEventListener('input', () => {
        UI.sendBtn.disabled = !UI.chatInput.value.trim();
        UI.autoResizeInput();
    });

    // Sidebar
    UI.menuBtn.addEventListener('click', () => UI.toggleSidebar(true));
    UI.sidebarClose.addEventListener('click', () => UI.toggleSidebar(false));
    UI.newChatBtn.addEventListener('click', startNewChat);
    UI.sidebarBrand.addEventListener('click', () => {
        UI.chatMessages.innerHTML = '';
        currentConvId = null;
        UI.toggleSidebar(false);
        startNewChat();
    });

    // Settings
    UI.settingsBtn.addEventListener('click', () => UI.settingsModal.classList.add('visible'));
    UI.settingsClose.addEventListener('click', () => UI.settingsModal.classList.remove('visible'));
    UI.saveApiKeyBtn.addEventListener('click', saveSettings);
    UI.toggleApiVis.addEventListener('click', () => {
        UI.apiKeyInput.type = UI.apiKeyInput.type === 'password' ? 'text' : 'password';
    });

    // Schedule Modal
    UI.navSchedule.addEventListener('click', () => {
        UI.mapModal.classList.add('visible');
        openScheduleModal();
    });
    UI.mapModalClose.addEventListener('click', () => UI.mapModal.classList.remove('visible'));
    UI.mapModal.addEventListener('click', (e) => {
        if (e.target === UI.mapModal) UI.mapModal.classList.remove('visible');
    });

    // Suggestion Chips Delegation (Global)
    document.addEventListener('click', (e) => {
        const chip = e.target.closest('.suggestion-chip');
        if (chip) {
            const text = chip.textContent.trim();
            UI.chatInput.value = text;
            handleSend();
        }
    });
}

import { MapComponent } from './map.js';
function openScheduleModal() {
    const mapComp = new MapComponent(appData);
    UI.mapModalBody.innerHTML = '';
    UI.mapModalBody.appendChild(mapComp.render());
}

function saveSettings() {
    apiKey = UI.apiKeyInput.value.trim();
    model = UI.modelSelect.value;
    localStorage.setItem(CONFIG.API_KEY_STORAGE_KEY, apiKey);
    localStorage.setItem(CONFIG.MODEL_STORAGE_KEY, model);
    UI.updateApiStatus(apiKey, model);
    UI.settingsModal.classList.remove('visible');
}

function loadHistory() {
    UI.historyList.innerHTML = '';
    const ids = Object.keys(conversations).sort((a, b) => (conversations[b].updatedAt || 0) - (conversations[a].updatedAt || 0));

    if (ids.length === 0) {
        UI.historyList.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:0.82rem;text-align:center;">Henüz sohbet yok</div>';
        return;
    }

    ids.forEach(id => {
        const conv = conversations[id];
        const item = document.createElement('div');
        item.className = 'history-item' + (id === currentConvId ? ' active' : '');
        item.innerHTML = `
            <svg class="history-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="history-item-text">${conv.title || 'Yeni Sohbet'}</span>
            <button class="history-item-delete" title="Sil">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14H7L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
        `;
        item.addEventListener('click', (e) => {
            if (e.target.closest('.history-item-delete')) {
                delete conversations[id];
                localStorage.setItem(CONFIG.CONV_STORAGE_KEY, JSON.stringify(conversations));
                if (id === currentConvId) startNewChat(); else loadHistory();
                return;
            }
            loadConversation(id);
        });
        UI.historyList.appendChild(item);
    });
}

function loadConversation(id) {
    currentConvId = id;
    UI.chatMessages.innerHTML = '';
    conversations[id].messages.forEach(msg => UI.appendMessage(msg.role, msg.content, false));
    UI.scrollToBottom();
    loadHistory();
    UI.toggleSidebar(false);
}

function startNewChat() {
    currentConvId = null;
    location.reload(); 
}

function initDynamicStars() {
    const starCount = 60;
    const body = document.body;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star-node';
        star.style.left = `${Math.random() * 100}vw`;
        star.style.top = `${Math.random() * 100}vh`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        star.style.opacity = (Math.random() * 0.5) + 0.3;
        body.appendChild(star);
    }
}

function extractTopic(text) {
    const lower = text.toLowerCase();
    if (lower.includes('ekip') || lower.includes('kadro') || lower.includes('kimler')) return 'Takım Kadrosu 👥';
    if (lower.includes('yazılım') || lower.includes('software')) return 'Yazılım Ekibi 💻';
    if (lower.includes('mekanik') || lower.includes('robot')) return 'Mekanik & Robot ⚙️';
    if (lower.includes('turnuva') || lower.includes('takvim') || lower.includes('bölge')) return 'Yarışma Takvimi 📍';
    if (lower.includes('blue wave') || lower.includes('hikaye') || lower.includes('nedir')) return 'The Blue Wave 🌊';
    if (lower.includes('başarı') || lower.includes('tebrik')) return 'Teşekkür Mesajı ❤️';
    
    return text.length > 25 ? text.slice(0, 22) + '...' : text;
}

async function handleSend() {
    const text = UI.chatInput.value.trim();
    if (!text || isResponding) return;

    if (!currentConvId) {
        currentConvId = 'conv_' + Date.now();
        const title = extractTopic(text);
        conversations[currentConvId] = { title: title, messages: [], updatedAt: Date.now() };
    }

    $('#welcomeScreen')?.remove();
    conversations[currentConvId].messages.push({ role: 'user', content: text });
    UI.appendMessage('user', text);
    
    UI.chatInput.value = '';
    UI.sendBtn.disabled = true;
    UI.autoResizeInput();
    UI.scrollToBottom();

    isResponding = true;
    const typingIndicator = UI.showTypingIndicator();

    try {
        const responseText = apiKey 
            ? await callGeminiAPI(text, conversations[currentConvId].messages, apiKey, model, appData, window.appKnowledge)
            : await simulateResponse(text, appData, window.appKnowledge);

        typingIndicator.remove();
        const msgEl = UI.appendMessage('ai', '', true);
        const bodyEl = msgEl.querySelector('.message-body');
        
        // Simple typewriter
        let i = 0;
        const words = responseText.split(' ');
        const interval = setInterval(() => {
            if (i < words.length) {
                bodyEl.innerHTML = renderMarkdown(words.slice(0, i+1).join(' ')); 
                i++;
                UI.scrollToBottom();
            } else {
                clearInterval(interval);
                // If it's regional info, append the map
                if (/bölge|regional|turnuva|takvim/i.test(text)) {
                    bodyEl.appendChild(renderMap(appData.regionals));
                }
                conversations[currentConvId].messages.push({ role: 'ai', content: responseText });
                localStorage.setItem(CONFIG.CONV_STORAGE_KEY, JSON.stringify(conversations));
                loadHistory();
            }
        }, 30);

    } catch (err) {
        typingIndicator.remove();
        UI.appendMessage('ai', '⚠️ Hata: ' + err.message);
    } finally {
        isResponding = false;
    }
}

function setupMascotInteractions() {
    const mascots = $$('.welcome-mascot, .brand-logo');
    mascots.forEach(m => {
        m.addEventListener('mouseenter', () => {
            m.style.transform = 'scale(1.1) rotate(5deg)';
            m.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        });
        m.addEventListener('mouseleave', () => {
            m.style.transform = 'scale(1) rotate(0deg)';
        });
    });
}

document.addEventListener('DOMContentLoaded', init);
