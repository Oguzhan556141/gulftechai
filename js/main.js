import { CONFIG } from './config.js';
import { UI, $, $$ } from './ui.js';
import { getNextRegional, delay, renderMarkdown } from './utils.js';
import { callGeminiAPI, simulateResponse } from './api.js';
import { renderMap, MapComponent } from './map.js';
import { initI18n, toggleLanguage, setLanguage, t } from './i18n.js';
import { isOrionCommand, executeOrionCommand, applyStoredCustomKnowledge } from './orion.js';

let appData = null;
let conversations = JSON.parse(localStorage.getItem(CONFIG.CONV_STORAGE_KEY) || '{}');
let currentConvId = null;
let isResponding = false;
let model = localStorage.getItem(CONFIG.MODEL_STORAGE_KEY) || CONFIG.DEFAULT_MODEL;
let isOrionMode = localStorage.getItem('gt_orion_mode') === 'true';

// ===== ORION OS SECRET PASSPHRASE =====
const ORION_PASSPHRASE = 'mortal demon';

async function init() {
    console.log('App initializing...');
    try {
        const [dataRes, teamRes, ruleRes, firstRes, generalRes] = await Promise.all([
            fetch(CONFIG.DATA_PATH),
            fetch('teamKnowledge.json'),
            fetch('ruleKnowledge.json'),
            fetch('firstKnowledge.json'),
            fetch('generalKnowledge.json')
        ]);

        if (!dataRes.ok) throw new Error(`Data loading failed: ${dataRes.status}`);
        if (!teamRes.ok) throw new Error(`Team knowledge loading failed: ${teamRes.status}`);
        if (!ruleRes.ok) throw new Error(`Rule knowledge loading failed: ${ruleRes.status}`);
        if (!firstRes.ok) throw new Error(`FIRST knowledge loading failed: ${firstRes.status}`);
        if (!generalRes.ok) throw new Error(`General knowledge loading failed: ${generalRes.status}`);

        appData = await dataRes.json();
        const teamKnowledge = await teamRes.json();
        const ruleKnowledge = await ruleRes.json();
        const firstKnowledge = await firstRes.json();
        const generalKnowledge = await generalRes.json();

        // Merge all knowledge into one object for backward compatibility
        window.appKnowledge = {
            takim_kimligi: teamKnowledge.takim_kimligi,
            yonetim_ve_mentorlar: teamKnowledge.yonetim_ve_mentorlar,
            kaptanlar: teamKnowledge.kaptanlar,
            ekip_uyeleri: teamKnowledge.ekip_uyeleri,
            divizyonlar: teamKnowledge.divizyonlar,
            teknik_hafiza: teamKnowledge.teknik_hafiza,
            etkinlikler: teamKnowledge.projeler_ve_etkinlikler,
            sponsorlar: teamKnowledge.sponsorlar,
            iletisim: teamKnowledge.iletisim,
            sosyal_aglar: teamKnowledge.sosyal_aglar,
            hedefler: teamKnowledge.hedefler,
            playlistler: teamKnowledge.playlistler,
            web_sitesi_sayfalari: teamKnowledge.web_sitesi_sayfalari,
            sosyal_etkilesim: teamKnowledge.sosyal_etkilesim,
            instagram_icerik: teamKnowledge.instagram_icerik,
            yarisma_hafizasi: {
                sezon: ruleKnowledge.oyun_bilgisi.sezon + ' ' + ruleKnowledge.oyun_bilgisi.oyun_adi,
                oyun_bilgisi: ruleKnowledge.oyun_bilgisi,
                oyun_parcalari: ruleKnowledge.oyun_parcalari,
                saha_elemanlari: ruleKnowledge.saha_elemanlari,
                mac_yapisi: ruleKnowledge.mac_yapisi,
                puanlama_sistemi: ruleKnowledge.puanlama_sistemi,
                siralama_puanlari: ruleKnowledge.siralama_puanlari,
                robot_kurallari: ruleKnowledge.robot_kurallari,
                strateji_notlari: ruleKnowledge.strateji_notlari,
                onemli_terimler: ruleKnowledge.onemli_terimler,
                pit_alani: ruleKnowledge.pit_alani,
                bolgesel_turnuvalar: ruleKnowledge.bolgesel_turnuvalar || []
            },
            first_bilgisi: firstKnowledge.first_vakfi,
            fikret_yuksel_vakfi: firstKnowledge.fikret_yuksel_vakfi,
            frc_turkiye: firstKnowledge.frc_turkiye,
            genel_kultur: generalKnowledge
        };

        // Apply any live knowledge overrides previously set via OrionOS Live Editor
        applyStoredCustomKnowledge();

        console.log('All knowledge files loaded successfully');
    } catch (err) {
        console.error('Initial load error:', err);
        UI.appendMessage('ai', '⚠️ Hafıza yüklenirken hata oluştu: ' + err.message);
    }

    initI18n();
    UI.updateApiStatus(true, model);
    loadHistory();
    bindEvents();
    UI.autoResizeInput();

    // Apply OrionOS mode if saved
    if (isOrionMode) {
        applyOrionMode(true);
    }

    // Register Service Worker for PWA/Offline Support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => console.log('ServiceWorker registered:', registration))
                .catch(error => console.error('ServiceWorker registration failed:', error));
        });
    }

    if (apiKey) UI.apiKeyInput.value = apiKey;
    UI.modelSelect.value = model;



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
        updateInlineSuggestions();
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

    // Settings - guard in case button is removed
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => UI.settingsModal.classList.add('visible'));
    }
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

    // Developer & API Diagnostics Dashboard Modal (OrionOS Exclusive)
    const devNavBtn = document.getElementById('navDevDashboard');
    const devModal = document.getElementById('devDashboardModal');
    const devClose = document.getElementById('devDashboardClose');

    const updateDevDashboardMetrics = () => {
        const telemetry = window.__orionTelemetry || { totalCalls: 0, lastLatency: null, totalCharsReceived: 0 };
        const latEl = document.getElementById('devLatencyVal');
        if (latEl) latEl.textContent = telemetry.lastLatency !== null ? `${telemetry.lastLatency} ms` : 'Beklemede';

        const convKeys = Object.keys(conversations || {});
        let totalMsgs = 0;
        let totalChars = 0;
        convKeys.forEach(k => {
            const msgs = conversations[k].messages || [];
            totalMsgs += msgs.length;
            msgs.forEach(m => totalChars += (m.content || '').length);
        });

        const tokenEl = document.getElementById('devTokenVal');
        if (tokenEl) tokenEl.textContent = `~${Math.round(totalChars / 4).toLocaleString()} token`;

        const msgEl = document.getElementById('devMsgCountVal');
        if (msgEl) msgEl.textContent = `${totalMsgs} adet (${convKeys.length} sohbet)`;

        const modEl = document.getElementById('devModelVal');
        if (modEl) modEl.textContent = model;

        const k = window.appKnowledge || {};
        const kInfo = document.getElementById('devKnowledgeInfo');
        if (kInfo) {
            kInfo.textContent = `${(k.sponsorlar || []).length} Sponsor, ${(k.yonetim_ve_mentorlar || []).length} Mentör, ${(k.ekip_uyeleri || []).length} Üye`;
        }
    };

    if (devNavBtn && devModal) {
        devNavBtn.addEventListener('click', () => {
            updateDevDashboardMetrics();
            devModal.classList.add('visible');
            UI.toggleSidebar(false);
        });
    }

    if (devClose && devModal) {
        devClose.addEventListener('click', () => devModal.classList.remove('visible'));
        devModal.addEventListener('click', (e) => {
            if (e.target === devModal) devModal.classList.remove('visible');
        });
    }

    // Dev modal quick action buttons
    const triggerConsoleCmd = (cmdText) => {
        if (devModal) devModal.classList.remove('visible');
        UI.chatInput.value = cmdText;
        handleSend();
    };

    document.getElementById('btnDevStats')?.addEventListener('click', () => triggerConsoleCmd('/stats'));
    document.getElementById('btnDevSyncIg')?.addEventListener('click', () => triggerConsoleCmd('/sync-ig'));
    document.getElementById('btnDevDump')?.addEventListener('click', () => triggerConsoleCmd('/dump-knowledge'));
    document.getElementById('btnDevClearCache')?.addEventListener('click', () => triggerConsoleCmd('/clear-cache'));

    // Language Dropdown Menus (Header & Sidebar)
    const setupLangDropdown = (btnId) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        const wrapper = btn.closest('.lang-dropdown-wrapper');
        if (!wrapper) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other open wrappers first
            document.querySelectorAll('.lang-dropdown-wrapper').forEach(w => {
                if (w !== wrapper) w.classList.remove('open');
            });
            wrapper.classList.toggle('open');
        });
    };

    setupLangDropdown('langDropdownBtn');
    setupLangDropdown('sidebarLangBtn');

    // Language Selection Items
    document.querySelectorAll('.lang-dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = item.getAttribute('data-lang');
            if (lang) {
                setLanguage(lang);
                UI.updateApiStatus(true, model);
            }
            document.querySelectorAll('.lang-dropdown-wrapper').forEach(w => w.classList.remove('open'));
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.lang-dropdown-wrapper')) {
            document.querySelectorAll('.lang-dropdown-wrapper').forEach(w => w.classList.remove('open'));
        }
    });

    // Suggestion Chips Delegation (Global)
    document.addEventListener('click', (e) => {
        const chip = e.target.closest('.suggestion-chip, .inline-chip');
        if (chip) {
            const text = chip.getAttribute('data-prompt') || chip.textContent.trim();
            UI.chatInput.value = text;
            handleSend();
            if (chip.classList.contains('inline-chip')) {
                UI.inlineSuggestions.classList.remove('visible');
            }
        }
    });
}

function updateInlineSuggestions() {
    const val = UI.chatInput.value.trim().toLowerCase();
    const container = UI.inlineSuggestions;

    if (val.length < 2) {
        container.classList.remove('visible');
        return;
    }

    // Turkish-aware normalization
    const norm = val.replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g');

    const keywords = [
        { key: 'frc', prompt: 'FRC nedir, açıklar mısın?', label: '🤖 FRC Nedir?' },
        { key: 'takım', prompt: 'Takım kadrosunu tanıtır mısın?', label: '👥 Takımımız' },
        { key: 'uye', prompt: 'Takım kadrosunu tanıtır mısın?', label: '👥 Üyeler' },
        { key: 'iletisim', prompt: 'İletişim bilgilerini paylaşır mısın?', label: '🔗 İletişim' },
        { key: 'tarih', prompt: 'Takım tarihçesini anlatır mısın?', label: '📖 Tarihçemiz' },
        { key: 'etkinlik', prompt: 'Projelerinizden ve etkinliklerinizden bahseder misiniz?', label: '📅 Etkinlikler' },
        { key: 'robot', prompt: 'Teknik altyapınızdan bahseder misiniz?', label: '⚙️ Teknik' },
        { key: 'sponsor', prompt: 'Sponsorlarınız kimler?', label: '🤝 Sponsorlar' },
        { key: 'rebuilt', prompt: 'REBUILT oyunundaki puanlama sistemi nasıl çalışıyor?', label: '🏗️ REBUILT' },
        { key: 'first', prompt: 'FIRST vakfı hakkında bilgi verir misin?', label: '🌐 FIRST Vakfı' },
        { key: 'fikret', prompt: 'Fikret Yüksel Vakfı hakkında bilgi verir misin?', label: '🏢 Fikret Yüksel' },
        { key: 'vakif', prompt: 'FIRST vakfı ve Fikret Yüksel Vakfı hakkında bilgi verir misin?', label: '🌐 Vakıflar' },
        { key: 'kural', prompt: 'REBUILT oyun kurallarını açıklar mısın?', label: '📜 Kurallar' },
        { key: 'puan', prompt: 'REBUILT puanlama sistemini açıklar mısın?', label: '🎯 Puanlama' },
        { key: 'hub', prompt: 'REBUILT oyunundaki hub nedir?', label: '🛢️ Hub' },
        { key: 'tower', prompt: 'REBUILT oyunundaki kule tırmanışı nasıl çalışıyor?', label: '🗼 Kule' },
        { key: 'otonom', prompt: 'REBUILT otonom periyodu nasıl çalışıyor?', label: '🤖 Otonom' },
        { key: 'dizivyon', prompt: 'Takım divizyonlarını tanıtır mısın?', label: '⚙️ Divizyonlar' },
        { key: 'proje', prompt: 'Projelerinizden bahseder misiniz?', label: '🚀 Projeler' },
        { key: 'oyun', prompt: 'REBUILT oyun kurallarını açıklar mısın?', label: '🎮 REBUILT Oyunu' },
        { key: 'turnuva', prompt: 'Turnuva takvimini gösterir misin?', label: '📍 Turnuva Takvimi' },
        { key: 'odul', prompt: 'FRC ödüllerinden bahseder misin?', label: '🏆 Ödüller' },
        { key: 'pit', prompt: 'Pit alanı nasıl çalışır?', label: '🔧 Pit Alanı' },
        { key: 'strateji', prompt: 'REBUILT strateji notlarını paylaşır mısın?', label: '🎯 Strateji' },
        { key: 'bilgi', prompt: 'Bana ilginç bir genel kültür bilgisi verir misin?', label: '🧠 Genel Kültür' },
        { key: 'tarih', prompt: 'Önemli tarihi olaylar nelerdir?', label: '📜 Tarih' },
        { key: 'bilim', prompt: 'Kuantum fiziği hakkında bilgi verir misin?', label: '🔬 Bilim' },
        { key: 'sanat', prompt: 'Rönesans sanatı hakkında ne biliyorsun?', label: '🎨 Sanat' }
    ];

    const matches = keywords.filter(k => {
        const normKey = k.key.replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g');
        return normKey.includes(norm) || k.label.toLowerCase().includes(norm);
    });

    if (matches.length > 0) {
        container.innerHTML = matches.slice(0, 6).map(m => `
            <div class="inline-chip" data-prompt="${m.prompt}">${m.label}</div>
        `).join('');
        container.classList.add('visible');
    } else {
        container.classList.remove('visible');
    }
}



function openScheduleModal() {
    const mapComp = new MapComponent(appData);
    UI.mapModalBody.innerHTML = '';
    UI.mapModalBody.appendChild(mapComp.render());
}

function saveSettings() {
    model = UI.modelSelect.value;
    localStorage.setItem(CONFIG.MODEL_STORAGE_KEY, model);
    UI.updateApiStatus(true, model);
    UI.settingsModal.classList.remove('visible');
}

function loadHistory() {
    UI.historyList.innerHTML = '';
    const ids = Object.keys(conversations).sort((a, b) => (conversations[b].updatedAt || 0) - (conversations[a].updatedAt || 0));

    if (ids.length === 0) {
        UI.historyList.innerHTML = `<div style="padding:12px;color:var(--text-muted);font-size:0.82rem;text-align:center;">${t('noChats')}</div>`;
        return;
    }

    ids.forEach(id => {
        const conv = conversations[id];
        const item = document.createElement('div');
        item.className = 'history-item' + (id === currentConvId ? ' active' : '');
        item.innerHTML = `
            <svg class="history-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="history-item-text">${conv.title || t('newChat')}</span>
            <button class="history-item-delete" title="${t('deleteChat')}">
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

// ===== IMPROVED TOPIC EXTRACTION =====
function extractTopic(userText, aiResponse) {
    const lower = userText.toLowerCase();

    // Check known topic keywords first
    if (/ekip|kadro|kimler|üye/.test(lower)) return 'Takım Kadrosu 👥';
    if (/yazılım|software/.test(lower)) return 'Yazılım Ekibi 💻';
    if (/mekanik|robot/.test(lower)) return 'Mekanik & Robot ⚙️';
    if (/turnuva|takvim|bölge/.test(lower)) return 'Yarışma Takvimi 📍';
    if (/rebuilt|oyun|puan|hub|tower|kule/.test(lower)) return 'REBUILT 2026 🏗️';
    if (/sponsor|destek/.test(lower)) return 'Sponsorlar 🤝';
    if (/first.*vak|first.*found/.test(lower)) return 'FIRST Vakfı 🌐';
    if (/fikret|yüksel/.test(lower)) return 'Fikret Yüksel Vakfı 🏢';
    if (/iletişim|link|instagram|sosyal/.test(lower)) return 'İletişim 🔗';
    if (/etkinlik|proje/.test(lower)) return 'Projeler & Etkinlikler 🚀';
    if (/teknik|donanım|scout/.test(lower)) return 'Teknik Altyapı ⚙️';
    if (/strateji|taktik/.test(lower)) return 'Strateji 🎯';
    if (/ödül|award/.test(lower)) return 'FRC Ödülleri 🏆';
    if (/pit|alan/.test(lower)) return 'Pit Alanı 🔧';
    if (/kural|boyut|tampon/.test(lower)) return 'Robot Kuralları 📏';
    if (/tarih|geçmiş|logo/.test(lower)) return 'Tarihçemiz 📖';
    if (/frc|first.*robot/.test(lower)) return 'FRC Nedir? 🤖';
    if (/başarı|tebrik|helal/.test(lower)) return 'Teşekkür ❤️';

    // If AI response is available, try to extract from first heading or first sentence
    if (aiResponse) {
        const headingMatch = aiResponse.match(/###?\s+(.{3,40})/);
        if (headingMatch) {
            let heading = headingMatch[1].replace(/[#*]/g, '').trim();
            if (heading.length > 30) heading = heading.slice(0, 27) + '...';
            return heading;
        }
    }

    // Fallback: truncate user message
    return userText.length > 25 ? userText.slice(0, 22) + '...' : userText;
}

// ===== ORION OS MODE =====
function applyOrionMode(enable) {
    isOrionMode = enable;
    localStorage.setItem('gt_orion_mode', String(enable));
    document.body.classList.toggle('orion-mode', enable);

    const nebula = document.getElementById('orionNebula');
    if (nebula) {
        nebula.classList.toggle('active', enable);
    }

    const devNavBtn = document.getElementById('navDevDashboard');
    if (devNavBtn) {
        devNavBtn.style.display = enable ? 'flex' : 'none';
    }

    // Generate starfield canvas for OrionOS
    if (enable) {
        initOrionStarfield();
        UI.modelBadge.textContent = 'OrionOS';
        UI.modelBadge.classList.add('orion-badge');
    } else {
        UI.modelBadge.classList.remove('orion-badge');
        UI.updateApiStatus(true, model);
        const modal = document.getElementById('devDashboardModal');
        if (modal) modal.classList.remove('visible');

        // Clear starfield
        const canvas = document.getElementById('orionStarfield');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
}

function initOrionStarfield() {
    const canvas = document.getElementById('orionStarfield');
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.8 + 0.2,
            speed: Math.random() * 0.002 + 0.001
        });
    }

    function animateStars() {
        if (!isOrionMode) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        stars.forEach(star => {
            star.opacity += Math.sin(Date.now() * star.speed) * 0.005;
            star.opacity = Math.max(0.1, Math.min(1, star.opacity));

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 120, 140, ${star.opacity})`;
            ctx.fill();

            // Subtle crimson glow
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 7, 58, ${star.opacity * 0.25})`;
            ctx.fill();
        });

        requestAnimationFrame(animateStars);
    }

    animateStars();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Check if message is the OrionOS passphrase
function isOrionPassphrase(text) {
    return text.trim().toLowerCase() === ORION_PASSPHRASE;
}

async function handleSend() {
    let text = UI.chatInput.value.trim();
    const textLower = text.toLowerCase();
    if (!text || isResponding) return;

    // ===== ORION OS SECRET TOGGLE =====
    if (isOrionPassphrase(text)) {
        const willEnable = !isOrionMode;
        applyOrionMode(willEnable);

        UI.chatInput.value = '';
        UI.sendBtn.disabled = true;
        UI.autoResizeInput();

        // Show activation/deactivation message
        let msg = willEnable 
            ? `🌌 **OrionOS Yönetici / Terminal Modu Aktif Edildi.**\n\n` +
              `> Yetki Seviyesi: \`ROOT / DEVELOPER\`\n` +
              `> Komut Konsolu: \`AKTİF\`\n` +
              `> Canlı Bilgi Düzenleyici (Live Editor): \`AKTİF\`\n\n` +
              `Komut listesini ve yardım menüsünü görmek için \`/help\` yazabilirsiniz.`
            : t('orionDeactivated');

        if (!currentConvId) {
            currentConvId = 'conv_' + Date.now();
            conversations[currentConvId] = { title: willEnable ? 'OrionOS 🌌' : t('newChat'), messages: [], updatedAt: Date.now() };
        }

        $('#welcomeScreen')?.remove();
        UI.appendMessage('ai', msg);
        conversations[currentConvId].messages.push({ role: 'ai', content: msg });
        localStorage.setItem(CONFIG.CONV_STORAGE_KEY, JSON.stringify(conversations));
        loadHistory();
        return;
    }

    // ===== ORION OS CLI / ADMIN & LIVE KNOWLEDGE INTERCEPTOR =====
    // ONLY executed when isOrionMode is true. If isOrionMode is false, commands are ignored
    // and processed as normal chat messages (zero leak / complete stealth).
    if (isOrionMode && isOrionCommand(text, isOrionMode)) {
        if (!currentConvId) {
            currentConvId = 'conv_' + Date.now();
            conversations[currentConvId] = { title: 'OrionOS Terminal 📟', messages: [], updatedAt: Date.now() };
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
            const adminResponse = await executeOrionCommand(text, {
                conversations,
                currentConvId,
                model
            });

            typingIndicator.remove();
            const msgEl = UI.appendMessage('ai', adminResponse);
            msgEl.classList.add('orion-terminal-msg');
            conversations[currentConvId].messages.push({ role: 'ai', content: adminResponse });
            localStorage.setItem(CONFIG.CONV_STORAGE_KEY, JSON.stringify(conversations));
            loadHistory();
            UI.scrollToBottom();
        } catch (err) {
            typingIndicator.remove();
            UI.appendMessage('ai', '⚠️ Terminal Hatası: ' + err.message);
        } finally {
            isResponding = false;
        }
        return;
    }

    if (!currentConvId) {
        currentConvId = 'conv_' + Date.now();
        const title = extractTopic(text, null);
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
        let responseText = await simulateResponse(textLower, appData, window.appKnowledge);
        
        // If no local handler matched, fallback to Gemini API
        if (responseText === null) {
            responseText = await callGeminiAPI(textLower, conversations[currentConvId].messages, null, model, appData, window.appKnowledge);
        }

        typingIndicator.remove();
        const msgEl = UI.appendMessage('ai', '', true);
        const bodyEl = msgEl.querySelector('.message-body');

        // Update title with AI response context (topic summarization)
        if (conversations[currentConvId].messages.length <= 2) {
            const betterTitle = extractTopic(textLower, responseText);
            conversations[currentConvId].title = betterTitle;
        }

        // Simple typewriter
        let i = 0;
        const words = responseText.split(' ');
        const interval = setInterval(() => {
            if (i < words.length) {
                bodyEl.innerHTML = renderMarkdown(words.slice(0, i + 1).join(' '));
                i++;
                UI.scrollToBottom();
            } else {
                clearInterval(interval);
                // If it's regional info, append the map
                if (/bölge|regional|turnuva|takvim/i.test(textLower)) {
                    bodyEl.appendChild(renderMap(appData));
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
