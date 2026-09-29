import { renderMarkdown, escapeHtml } from './utils.js';
import { t } from './i18n.js';

export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => document.querySelectorAll(sel);

export const UI = {
    chatMessages: $('#chatMessages'),
    chatInput: $('#chatInput'),
    inlineSuggestions: $('#inlineSuggestions'),
    sendBtn: $('#sendBtn'),
    sidebar: $('#sidebar'),
    menuBtn: $('#menuBtn'),
    sidebarClose: $('#sidebarClose'),
    newChatBtn: $('#newChatBtn'),
    sidebarBrand: $('#sidebarBrand'),
    historyList: $('#historyList'),
    settingsBtn: null, // Removed
    settingsModal: $('#settingsModal'),
    settingsClose: $('#settingsClose'),
    saveApiKeyBtn: $('#saveApiKey'),
    apiKeyInput: $('#apiKeyInput'),
    modelSelect: $('#modelSelect'),
    toggleApiVis: $('#toggleApiVis'),
    apiStatus: $('#apiStatus'),
    modelBadge: $('#modelBadge'),
    countdownTimer: $('#countdownTimer'),
    navSchedule: $('#navSchedule'),
    mapModal: $('#mapModal'),
    mapModalClose: $('#mapModalClose'),
    mapModalBody: $('#mapModalBody'),
    backToTurkey: $('#backToTurkey'),
    langSwitchBtn: $('#langSwitchBtn'),

    toggleSidebar(show) {
        this.sidebar.classList.toggle('open', show);
        let overlay = $('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', () => this.toggleSidebar(false));
        }
        overlay.classList.toggle('visible', show);
    },

    updateApiStatus(isServerSecured, model) {
        const dot = this.apiStatus.querySelector('.status-dot');
        const label = this.apiStatus.querySelector('span:last-child');
        const badge = this.modelBadge;

        if (isServerSecured) {
            dot.className = 'status-dot online';
            label.textContent = 'v1.1';
            badge.textContent = 'v1.1';
            badge.classList.add('live');
        } else {
            dot.className = 'status-dot offline';
            label.textContent = t('userMode');
            badge.textContent = t('userMode');
            badge.classList.remove('live');
        }
    },

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        });
    },

    autoResizeInput() {
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 150) + 'px';
    },

    appendMessage(role, content, animate = true) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        if (!animate) div.style.animation = 'none';

        const avatarContent = role === 'ai'
            ? '<img src="assets/ai-mascot.png" alt="AI" class="clean-logo">'
            : 'Sen';
        const senderName = role === 'ai' ? 'GulfTech AI' : 'Sen';

        div.innerHTML = `
            <div class="message-avatar">${avatarContent}</div>
            <div class="message-content">
                <div class="message-sender">${senderName}</div>
                <div class="message-body">${role === 'ai' ? renderMarkdown(content) : escapeHtml(content)}</div>
            </div>
        `;
        this.chatMessages.appendChild(div);
        return div;
    },

    showTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'message ai';
        div.innerHTML = `
            <div class="message-avatar"><img src="assets/ai-mascot.png" alt="AI"></div>
            <div class="message-content">
                <div class="message-sender">GulfTech AI</div>
                <div class="typing-indicator"><span></span><span></span><span></span></div>
            </div>
        `;
        this.chatMessages.appendChild(div);
        this.scrollToBottom();
        return div;
    },

    updateCountdown(next) {
        if (!next) return;
        const now = new Date();
        const diff = new Date(next.date) - now;

        if (diff <= 0) {
            const lbl = document.getElementById('countdownTimer');
            if (lbl) lbl.innerHTML = `<div class="countdown-label">🚀 <strong>${next.name}</strong> başladı!</div>`;
            return;
        }

        const vals = {
            d: Math.floor(diff / 86400000),
            h: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
            m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
            s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
        };

        ['d', 'h', 'm', 's'].forEach(unit => {
            const el = document.getElementById(`cd-${unit}`);
            if (!el) return;
            const v = String(vals[unit]);
            if (el.textContent !== v) {
                el.textContent = v;
                el.classList.add('updating');
                setTimeout(() => el.classList.remove('updating'), 500);
            }
        });
    }
};
