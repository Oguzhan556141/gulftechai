import { renderMarkdown, escapeHtml } from './utils.js';

export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => document.querySelectorAll(sel);

export const UI = {
    chatMessages: $('#chatMessages'),
    chatInput: $('#chatInput'),
    sendBtn: $('#sendBtn'),
    sidebar: $('#sidebar'),
    menuBtn: $('#menuBtn'),
    sidebarClose: $('#sidebarClose'),
    newChatBtn: $('#newChatBtn'),
    sidebarBrand: $('#sidebarBrand'),
    historyList: $('#historyList'),
    settingsBtn: $('#settingsBtn'),
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

    updateApiStatus(apiKey, model) {
        const dot = this.apiStatus.querySelector('.status-dot');
        const label = this.apiStatus.querySelector('span:last-child');
        const badge = this.modelBadge;

        if (apiKey) {
            dot.className = 'status-dot online';
            label.textContent = model;
            const modelName = model.split('-').slice(0, 2).join(' ').replace('gemini', 'Gemini');
            badge.textContent = modelName;
            badge.classList.add('live');
        } else {
            dot.className = 'status-dot offline';
            label.textContent = 'Simüle Mod';
            badge.textContent = 'Simüle Mod';
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
        if (!this.countdownTimer || !next) return;
        const now = new Date();
        const nextDate = new Date(next.date);
        const diff = nextDate - now;
        
        if (diff <= 0) {
            this.countdownTimer.innerHTML = `<div class="countdown-label">🚀 <strong>${next.name}</strong> Başladı!</div>`;
            return;
        }

        const values = {
            d: Math.floor(diff / 86400000),
            h: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
            m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
            s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
        };

        // If the inner structure isn't ready (first run or fallback), create it
        if (!this.countdownTimer.querySelector('.countdown-digits')) {
            this.countdownTimer.innerHTML = `
                <div class="countdown-label">🏟️ <strong>${next.name}</strong> — ${next.location}</div>
                <div class="countdown-digits">
                    <span class="cd-block"><span class="cd-num" id="cd-d"></span><span class="cd-unit">gün</span></span>
                    <span class="cd-sep">:</span>
                    <span class="cd-block"><span class="cd-num" id="cd-h"></span><span class="cd-unit">saat</span></span>
                    <span class="cd-sep">:</span>
                    <span class="cd-block"><span class="cd-num" id="cd-m"></span><span class="cd-unit">dk</span></span>
                    <span class="cd-sep">:</span>
                    <span class="cd-block"><span class="cd-num" id="cd-s"></span><span class="cd-unit">sn</span></span>
                </div>`;
        }

        // Update individual units
        ['d', 'h', 'm', 's'].forEach(unit => {
            const el = $(`#cd-${unit}`);
            if (el && el.textContent !== String(values[unit])) {
                el.textContent = values[unit];
                el.classList.add('updating');
                setTimeout(() => el.classList.remove('updating'), 400);
            }
        });
    }
};
