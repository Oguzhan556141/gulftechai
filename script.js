/* ===========================
   GulfTech AI — Chat Engine
   FRC #11392 AI Assistant
   =========================== */

(function () {
    'use strict';

    // ===== DOM =====
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const chatMessages = $('#chatMessages');
    const chatInput = $('#chatInput');
    const sendBtn = $('#sendBtn');
    const welcomeScreen = $('#welcomeScreen');
    const suggestions = $('#suggestions');
    const sidebar = $('#sidebar');
    const menuBtn = $('#menuBtn');
    const sidebarClose = $('#sidebarClose');
    const newChatBtn = $('#newChatBtn');
    const historyList = $('#historyList');
    const settingsBtn = $('#settingsBtn');
    const settingsModal = $('#settingsModal');
    const settingsClose = $('#settingsClose');
    const saveApiKeyBtn = $('#saveApiKey');
    const apiKeyInput = $('#apiKeyInput');
    const modelSelect = $('#modelSelect');
    const toggleApiVis = $('#toggleApiVis');
    const apiStatus = $('#apiStatus');
    const modelBadge = $('#modelBadge');
    const contactForm = $('#contactForm');

    // ===== STATE =====
    let conversations = JSON.parse(localStorage.getItem('gt_conversations') || '{}');
    let currentConvId = null;
    let isResponding = false;
    let apiKey = localStorage.getItem('gt_api_key') || '';
    let model = localStorage.getItem('gt_model') || 'gemini-2.0-flash';

    // ===== INIT =====
    function init() {
        updateApiStatus();
        loadHistory();
        bindEvents();
        autoResizeInput();

        if (apiKey) {
            apiKeyInput.value = apiKey;
        }
        modelSelect.value = model;
    }

    // ===== EVENT LISTENERS =====
    function bindEvents() {
        sendBtn.addEventListener('click', handleSend);

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });

        chatInput.addEventListener('input', () => {
            sendBtn.disabled = !chatInput.value.trim();
            autoResizeInput();
        });

        // Suggestion chips
        $$('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chatInput.value = chip.dataset.prompt;
                sendBtn.disabled = false;
                handleSend();
            });
        });

        // Sidebar
        menuBtn.addEventListener('click', () => toggleSidebar(true));
        sidebarClose.addEventListener('click', () => toggleSidebar(false));

        // New chat
        newChatBtn.addEventListener('click', startNewChat);

        // Settings
        settingsBtn.addEventListener('click', () => settingsModal.classList.add('visible'));
        settingsClose.addEventListener('click', () => settingsModal.classList.remove('visible'));
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.remove('visible');
        });

        saveApiKeyBtn.addEventListener('click', saveSettings);

        toggleApiVis.addEventListener('click', () => {
            apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
        });
    }

    // ===== SIDEBAR =====
    function toggleSidebar(show) {
        sidebar.classList.toggle('open', show);
        // Handle overlay
        let overlay = $('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', () => toggleSidebar(false));
        }
        overlay.classList.toggle('visible', show);
    }

    // ===== SETTINGS =====
    function saveSettings() {
        apiKey = apiKeyInput.value.trim();
        model = modelSelect.value;
        localStorage.setItem('gt_api_key', apiKey);
        localStorage.setItem('gt_model', model);
        updateApiStatus();
        settingsModal.classList.remove('visible');
    }

    function updateApiStatus() {
        const dot = apiStatus.querySelector('.status-dot');
        const label = apiStatus.querySelector('span:last-child');
        const badge = modelBadge;

        if (apiKey) {
            dot.className = 'status-dot online';
            label.textContent = model;
            badge.textContent = model.split('-').slice(0, 2).join(' ').replace('gemini', 'Gemini');
            badge.classList.add('live');
        } else {
            dot.className = 'status-dot offline';
            label.textContent = 'Simüle Mod';
            badge.textContent = 'Simüle Mod';
            badge.classList.remove('live');
        }
    }

    // ===== CHAT HISTORY =====
    function loadHistory() {
        historyList.innerHTML = '';
        const ids = Object.keys(conversations).sort((a, b) => {
            return (conversations[b].updatedAt || 0) - (conversations[a].updatedAt || 0);
        });

        if (ids.length === 0) {
            historyList.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:0.82rem;text-align:center;">Henüz sohbet yok</div>';
            return;
        }

        ids.forEach(id => {
            const conv = conversations[id];
            const item = document.createElement('div');
            item.className = 'history-item' + (id === currentConvId ? ' active' : '');
            item.innerHTML = `
                <svg class="history-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span class="history-item-text">${escapeHtml(conv.title || 'Yeni Sohbet')}</span>
                <button class="history-item-delete" title="Sil">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14H7L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                </button>
            `;

            item.addEventListener('click', (e) => {
                if (e.target.closest('.history-item-delete')) {
                    deleteConversation(id);
                    return;
                }
                loadConversation(id);
            });

            historyList.appendChild(item);
        });
    }

    function deleteConversation(id) {
        delete conversations[id];
        localStorage.setItem('gt_conversations', JSON.stringify(conversations));

        if (id === currentConvId) {
            startNewChat();
        } else {
            loadHistory();
        }
    }

    function loadConversation(id) {
        currentConvId = id;
        const conv = conversations[id];
        if (!conv) return;

        // Clear messages
        chatMessages.innerHTML = '';
        welcomeScreen?.remove();

        // Render messages
        conv.messages.forEach(msg => {
            appendMessage(msg.role, msg.content, false);
        });

        scrollToBottom();
        loadHistory();
        toggleSidebar(false);
    }

    function saveConversation() {
        if (!currentConvId) return;
        localStorage.setItem('gt_conversations', JSON.stringify(conversations));
        loadHistory();
    }

    // ===== COUNTDOWN =====
    function getNextRegional() {
        const regionals = [
            { name: 'Haliç Regional', date: new Date('2026-03-25T10:00:00+03:00'), location: 'Ataköy, İstanbul' },
            { name: 'Marmara Regional', date: new Date('2026-03-28T10:00:00+03:00'), location: 'Ataköy, İstanbul' },
            { name: 'Avrasya Regional', date: new Date('2026-03-31T10:00:00+03:00'), location: 'Ataköy, İstanbul' },
            { name: 'Ankara Regional', date: new Date('2026-04-07T10:00:00+03:00'), location: 'Ankara' },
            { name: 'Başkent Regional', date: new Date('2026-04-10T10:00:00+03:00'), location: 'Ankara' }
        ];
        const now = new Date();
        return regionals.find(r => r.date > now) || regionals[regionals.length - 1];
    }

    function updateCountdown() {
        const el = document.getElementById('countdownTimer');
        if (!el) return;
        const next = getNextRegional();
        const now = new Date();
        const diff = next.date - now;
        if (diff <= 0) { el.innerHTML = `<strong>${next.name}</strong> başladı! 🏟️`; return; }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        el.innerHTML = `<div class="countdown-label">🏟️ <strong>${next.name}</strong> — ${next.location}</div>` +
            `<div class="countdown-digits">` +
            `<span class="cd-block"><span class="cd-num">${d}</span><span class="cd-unit">gün</span></span>` +
            `<span class="cd-sep">:</span>` +
            `<span class="cd-block"><span class="cd-num">${String(h).padStart(2,'0')}</span><span class="cd-unit">saat</span></span>` +
            `<span class="cd-sep">:</span>` +
            `<span class="cd-block"><span class="cd-num">${String(m).padStart(2,'0')}</span><span class="cd-unit">dk</span></span>` +
            `<span class="cd-sep">:</span>` +
            `<span class="cd-block"><span class="cd-num">${String(s).padStart(2,'0')}</span><span class="cd-unit">sn</span></span>` +
            `</div>`;
    }

    // ===== NEW CHAT =====
    function startNewChat() {
        currentConvId = null;
        chatMessages.innerHTML = '';

        const welcome = document.createElement('div');
        welcome.className = 'welcome-screen';
        welcome.id = 'welcomeScreen';
        welcome.innerHTML = `
            <img src="assets/ai-mascot.png" alt="GulfTech AI" class="welcome-mascot clean-logo">
            <h1>Gulf<span class="accent">Tech</span> AI</h1>
            <p>FRC #11392 Yapay Zeka Asistanı</p>
            <div class="countdown-container" id="countdownTimer"></div>
            <p class="welcome-sub">Robotik, FRC stratejisi, takım bilgisi ve daha fazlası hakkında sorularınızı sorun.</p>
            <div class="suggestions" id="suggestions">
                <button class="suggestion-chip" data-prompt="FRC 2026 REBUILT oyun kurallarını açıkla">
                    <span class="chip-icon">🏗️</span><span>REBUILT Kuralları</span>
                </button>
                <button class="suggestion-chip" data-prompt="FRC ödülleri nelerdir?">
                    <span class="chip-icon">🏆</span><span>FRC Ödülleri</span>
                </button>
                <button class="suggestion-chip" data-prompt="Turnuva takvimi nedir?">
                    <span class="chip-icon">📍</span><span>Turnuva Takvimi</span>
                </button>
                <button class="suggestion-chip" data-prompt="Takım üyelerini tanıt">
                    <span class="chip-icon">🦈</span><span>Takım Kadrosu</span>
                </button>
                <button class="suggestion-chip" data-prompt="Yazılım ekibini anlat">
                    <span class="chip-icon">💻</span><span>Yazılım Ekibi</span>
                </button>
                <button class="suggestion-chip" data-prompt="Tarihçemizi anlat">
                    <span class="chip-icon">📖</span><span>Tarihçemiz</span>
                </button>
            </div>
        `;
        chatMessages.appendChild(welcome);

        // Re-bind suggestion chips
        welcome.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chatInput.value = chip.dataset.prompt;
                sendBtn.disabled = false;
                handleSend();
            });
        });

        loadHistory();
        toggleSidebar(false);
        chatInput.focus();
    }

    // ===== SEND MESSAGE =====
    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text || isResponding) return;

        // Create new conversation if needed
        if (!currentConvId) {
            currentConvId = 'conv_' + Date.now();
            conversations[currentConvId] = {
                title: generateSmartTitle(text),
                messages: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
        }

        // Helper for smart titles
        function generateSmartTitle(msg) {
            const m = msg.toLowerCase();
            if (m.includes('merhaba') || m.includes('selam')) return 'Tanışma';
            if (m.includes('yazılım') || m.includes('kod')) return 'Yazılım Hakkında';
            if (m.includes('mekanik') || m.includes('robot')) return 'Mekanik Tasarım';
            if (m.includes('pr') || m.includes('sponsor')) return 'PR ve Sponsorluk';
            if (m.includes('scout')) return 'Scouting Sistemi';
            if (m.includes('playlist') || m.includes('müzik')) return 'Müzik & Playlist';
            if (m.includes('iletişim') || m.includes('ulaş')) return 'İletişim Bilgileri';
            return msg.slice(0, 30) + '...';
        }

        // Remove welcome screen
        const welcome = $('#welcomeScreen');
        if (welcome) welcome.remove();

        // Add user message
        conversations[currentConvId].messages.push({ role: 'user', content: text });
        conversations[currentConvId].updatedAt = Date.now();
        appendMessage('user', text);

        chatInput.value = '';
        sendBtn.disabled = true;
        autoResizeInput();
        scrollToBottom();

        // Show typing indicator
        isResponding = true;
        const typingEl = showTypingIndicator();

        try {
            let response;
            if (apiKey) {
                response = await callGeminiAPI(text, conversations[currentConvId].messages);
            } else {
                response = await simulateResponse(text);
            }

            typingEl.remove();
            
            // Add message placeholder for typewriter
            const msgEl = appendMessage('ai', '', true);
            const bodyEl = msgEl.querySelector('.message-body');
            
            // Typewriter effect
            await typeWriter(response, bodyEl);
            
            conversations[currentConvId].messages.push({ role: 'ai', content: response });
        } catch (err) {
            typingEl.remove();
            const errorMsg = '⚠️ Bir hata oluştu: ' + err.message;
            conversations[currentConvId].messages.push({ role: 'ai', content: errorMsg });
            appendMessage('ai', errorMsg);
        }

        isResponding = false;
        saveConversation();
        scrollToBottom();
    }

    // Typewriter logic
    async function typeWriter(text, element) {
        let currentText = '';
        const words = text.split(' ');
        
        for (let i = 0; i < words.length; i++) {
            currentText += words[i] + (i === words.length - 1 ? '' : ' ');
            element.innerHTML = renderMarkdown(currentText);
            scrollToBottom();
            // Speed control
            await delay(10 + Math.random() * 30);
        }
    }

    // ===== GEMINI API =====
    async function callGeminiAPI(userMessage, history) {
        const currentYear = new Date().getFullYear();
        const systemPrompt = `Sen GulfTech AI'sın — FRC Takımı #11392 için geliştirilmiş bir yapay zeka asistanısın. Şu an ${currentYear} yılındayız.

Takım Kimliği:
- Takım Adı: Gulf Tech #11392
- Kuruluş: 2026 (FRC Rookie Yılı)
- Konum: Gölcük BİLSEM, Kocaeli, Türkiye
- Arka Plan: 5 yıllık FLL tecrübesi üzerine kurulmuş profesyonel bir FRC takımı.
- Maskot: Köpek balığı (Mavi: Derinlik, Sarı/Altın: Enerji)
- Destekçiler: Boeing, Gölcük Belediyesi, Fikret Yüksel Vakfı, TEKSA, Teknorova.

Departmanlar:
- Mentor: Ensar İnce
- Kaptanlar: Levent Yiğit (Mekanik), Tuğra Kerem Kaya (PR), İrem Ünver (Yazılım)
- Yazılım: İrem Ünver (Kaptan), Oğuzhan Aşkın, Zeynep Sude Çakmak, Elif Başuslu
- Mekanik: Levent Yiğit (Kaptan), Tufan Gülmez, Arda Furkan Aygenoğlu, Muhammet Ali Sardoğan, Nilgün Hilal Karataş
- PR: Tuğra Kerem Kaya (Kaptan), Beray Erenel, Ege Göllü, Zeynep Sude Çakmak, Elif Başuslu, Nilgün Hilal Karataş
- Tasarım & CAD: Eren Özgüler (Onshape)
- Elektronik: Donanım ve kablolama ekibi

FRC 2026 REBUILT (Presented by Haas):
- Tema: "Geçmişi yeniden hayal et"
- Oyun: Hub'lara yakıt atma, Tower'a tırmanma (L1-L3), otonom ilk 20sn.
- Bölge: Türkiye Regionalleri (İstanbul & Ankara, Mart-Nisan 2026)

FRC Ödülleri:
- Rookie All-Star: En iyi rookie takımı.
- Engineering Inspiration: Mühendislik kültürü yaygınlaştırma.
- FIRST Impact Award: En prestijli ödül, FIRST misyonunu temsil.
- Dean's List, Autonomous, Quality Award gibi birçok ödül daha.

KRİTİK KURALLAR:
1. Sadece sorulan branş/konu hakkında cevap ver. Sormadıkça diğer branşları karıştırma.
2. "Yazılım ekibini anlat" denince SADECE yazılım ekibini yaz, diğerlerini katma.
3. Türkçe/İngilizce yanıt ver, samimi ol, 🦈 kullan.
4. Markdown formatı kullan.`;

        const contents = [];

        // Add conversation history
        history.forEach(msg => {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        });

        const body = {
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: contents,
            generationConfig: {
                temperature: 0.8,
                topP: 0.95,
                maxOutputTokens: 4096
            }
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `API hatası (${res.status})`);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('API boş yanıt döndü.');
        }

        return text;
    }

    // ===== SIMULATED RESPONSES =====
    async function simulateResponse(userMessage) {
        const msg = userMessage.toLowerCase();

        // 🦈 CATEGORIZED TEAM KNOWLEDGE
        const team = {
            mentor: "Ensar İnce",
            captains: "Levent Yiğit (Mekanik), Tuğra Kerem Kaya (PR) ve İrem Ünver (Yazılım)",
            software: ["İrem Ünver (Kaptan)", "Oğuzhan Aşkın", "Zeynep Sude Çakmak", "Elif Başuslu"],
            mechanical: ["Levent Yiğit (Kaptan)", "Tufan Gülmez", "Arda Furkan Aygenoğlu", "Muhammet Ali Sardoğan", "Nilgün Hilal Karataş"],
            pr: ["Tuğra Kerem Kaya (Kaptan)", "Beray Erenel", "Ege Göllü", "Zeynep Sude Çakmak", "Elif Başuslu", "Nilgün Hilal Karataş"],
            design: ["Eren Özgüler (Onshape/CAD)"],
            electronics: ["Takım Elektronik Altyapı Ekibi"]
        };

        const teamHistory = `**GulfTech #11392**, 2026 yılında FRC dünyasına 'Rookie' olarak katıldı. Köklerimiz Gölcük BİLSEM'deki **5 yıllık FLL** robotik geçmişimize dayanıyor. Boeing, Gölcük Belediyesi ve Fikret Yüksel Vakfı desteğiyle Kocaeli'den yükselen bir teknoloji dalgası olmayı hedefliyoruz! 🌊🤖`;

        let response = "";

        // === BRANCH-ISOLATED RESPONSES ===
        if (/takım.*tanıt|ekib.*tanıt|tüm üyeler|kimler var|kadro/i.test(msg)) {
            response = `### 🦈 GulfTech Departmanları\n\n` +
                `**🎓 Baş Mentor:** ${team.mentor}\n\n` +
                `**🔱 Kaptanlar:** ${team.captains}\n\n` +
                `**💻 Yazılım:** ${team.software.join(', ')}\n\n` +
                `**⚙️ Mekanik:** ${team.mechanical.join(', ')}\n\n` +
                `**🎨 PR:** ${team.pr.join(', ')}\n\n` +
                `**📐 Tasarım:** ${team.design.join(', ')}\n\n` +
                `**⚡ Elektronik:** ${team.electronics.join(', ')}\n\n` +
                `2026 **REBUILT** sezonunda hep birlikte sahaya çıkıyoruz! 🚀`;
            await delay(1200);
            return response;
        }

        // ISOLATED: Only Software
        if (/yazılım|software|kod/i.test(msg) && !/takım|tüm|hep/i.test(msg)) {
            response = `### 💻 Yazılım Ekibi\n\nYazılım ekibimiz robotun beyni olan kontrol sistemlerinden sorumlu:\n- ${team.software.join('\n- ')}\n\nJava/WPILib, PathPlanner otonom ve Command-based programming kullanıyoruz. 🤖`;
            await delay(800); return response;
        }

        // ISOLATED: Only Mechanical
        if (/mekanik|mechanical/i.test(msg) && !/takım|tüm|hep/i.test(msg)) {
            response = `### ⚙️ Mekanik Ekibi\n\nMekanik ekibimiz robotun fiziksel inşasından sorumlu:\n- ${team.mechanical.join('\n- ')}\n\nMK4i Swerve Drive şasi, asansör sistemleri ve intake mekanizmaları onların eseri. 🛠️`;
            await delay(800); return response;
        }

        // ISOLATED: Only PR
        if (/pr|halkla|public/i.test(msg) && !/takım|tüm|hep/i.test(msg)) {
            response = `### 🎨 PR Ekibi\n\nPR ekibimiz takımın görünürlüğünden sorumlu:\n- ${team.pr.join('\n- ')}\n\nSosyal medya yönetimi, sponsorluk süreçleri ve takım tanıtımı onların uzmanlığı. ✨`;
            await delay(800); return response;
        }

        // ISOLATED: Only Design
        if (/tasarım|design|cad|onshape|eren/i.test(msg) && !/takım|tüm|hep/i.test(msg)) {
            response = `### 📐 Tasarım & CAD Ekibi\n\n- ${team.design.join('\n- ')}\n\nRobotumuzun her parçası Onshape üzerinde özenle tasarlanır. 3D modelleme ve prototipleme süreçlerini yönetiyor. 📐`;
            await delay(800); return response;
        }

        // History
        if (/tarih|geçmiş|hikaye|ne zaman kuruldu|kuruluş/i.test(msg)) {
            response = `### 📖 Tarihçemiz\n\n${teamHistory}\n\nYolculuğumuz BİLSEM'in robotik vizyonuyla başladı ve bugün FRC'nin dev sahalarına taşındı. 🦈✨`;
            await delay(1000); return response;
        }

        // FRC Awards
        if (/ödül|award|rookie all|impact|inspiration/i.test(msg)) {
            response = `### 🏆 FRC Ödülleri\n\nFRC'de kazanılabilecek en önemli ödüller:\n` +
                `- **Rookie All-Star:** Yılın en iyi rookie takımına verilir. Worlds'e direkt bilet!\n` +
                `- **Engineering Inspiration:** Mühendislik kültürünü toplumda yaygınlaştıran takıma.\n` +
                `- **FIRST Impact Award:** En prestijli ödül. FIRST misyonunu en iyi temsil eden takıma.\n` +
                `- **Autonomous Award:** En iyi otonom performansı gösteren takıma.\n` +
                `- **Quality Award:** Sağlam ve güvenilir robot tasarımı için.\n` +
                `- **Dean's List:** Öne çıkan bireysel öğrencilere. \n\n` +
                `Biz GulfTech olarak ilk sezonumuzda **Rookie All-Star** ödülünü hedefliyoruz! 🦈🏆`;
            await delay(1000); return response;
        }

        // Regional Info
        if (/bölge|regional|turnuva|takvim|ne zaman/i.test(msg)) {
            response = `### 📍 2026 Türkiye Regionalleri\n\n` +
                `| Turnuva | Tarih | Konum |\n|---------|-------|-------|\n` +
                `| Haliç Regional | 25-27 Mart | Ataköy, İstanbul |\n` +
                `| Marmara Regional | 28-30 Mart | Ataköy, İstanbul |\n` +
                `| Avrasya Regional | 31 Mar – 2 Nis | Ataköy, İstanbul |\n` +
                `| Ankara Regional | 7-9 Nisan | Ankara |\n` +
                `| Başkent Regional | 10-12 Nisan | Ankara |\n\n` +
                `Tüm turnuvalara giriş **ücretsizdir**. Ziyaret saatleri: 10:00 – 18:00. 🦈🏟️`;
            await delay(1000); return response;
        }

        // 2026 REBUILT
        if (/2026|rebuilt/i.test(msg)) {
            response += `### 🏗️ FRC 2026: REBUILT\n\n"Geçmişi yeniden hayal etme" konseptiyle sahadayız:\n` +
                `- **Active Hubs:** Yakıtları merkezlere atarak puan topla.\n` +
                `- **Tower:** Kuleye tırmanma (L1-L3) endgame puanlarını belirler.\n` +
                `- **Otonom:** İlk 20 sn tamamen otonom. Yakıt at + L1 tırman.\n` +
                `- **Yakıt:** Depolardan veya insan oyunculardan toplanır.\n\n`;
        }

        // Swerve
        if (/swerve|şasi|drive/i.test(msg)) {
            response += `### 🏎️ Swerve Drive (MK4i)\n- 360° manevra kabiliyeti\n- CANcoder + Falcon/Kraken motor sistemi\n- PathPlanner ile milimetrik otonom hassasiyet 🚀\n\n`;
        }

        // Scouting
        if (/scout|veri|analiz/i.test(msg)) {
            response += `### 📊 Scouting\nRakip analizlerini gerçek zamanlı yaparak maç stratejilerimizi güncelliyoruz. Web tabanlı scouting paneli geliştiriyoruz! 📈\n\n`;
        }

        // Greetings
        if (/selam|merhaba|hey|kimsin/i.test(msg)) {
            response += `Merhaba! 🦈 Ben **GulfTech AI**, FRC #11392 takımının dijital asistanıyım. Takım üyelerimizden, FRC 2026 REBUILT kurallarından, ödüllerden veya turnuva takviminden bahsedebilirim!\n\n`;
        }

        // Contact
        if (/iletişim|ulaş|mail|telefon/i.test(msg)) {
            response += `### 📞 İletişim\n- **E-posta:** gulftechtr@gmail.com\n- **Instagram:** @gulftechtr\n- **YouTube:** @gulftechtr\n- **Telefon:** +90 537 692 6558\n🦈\n\n`;
        }

        // Playlist
        if (/playlist|müzik|şarkı/i.test(msg)) {
            response += `### 🎵 Müzik\nPlaylistlerimiz: **Tech the Halls** ve **Charge Up FEBRUARY**. ⚡\n\n`;
        }

        // Mentor
        if (/mentor|ensar/i.test(msg)) {
            response += `### 🎓 Mentorumuz\nBaş mentorumuz **Ensar İnce**, takımımızın kurucusu ve teknik rehberi. 🦈\n\n`;
        }

        // Fallback
        if (response === "") {
            response = `Anlıyorum! 🦈 Sana şu konularda yardımcı olabilirim:\n- 🏗️ FRC 2026 REBUILT kuralları\n- 🏆 FRC ödülleri\n- 📍 Turnuva takvimi\n- 🦈 GulfTech takım bilgileri\n- 💻 Yazılım / ⚙️ Mekanik / 🎨 PR / 📐 Tasarım ekipleri\n\nHangi konuda yardımcı olayım? ✨`;
        } else {
            response += `\nBaşka bir soru var mı? 🦈`;
        }

        await delay(800 + Math.random() * 600);
        return response;
    }

    // ===== MESSAGE RENDERING =====
    function appendMessage(role, content, animate = true) {
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

        chatMessages.appendChild(div);
        return div;
    }

    function showTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'message ai';
        div.innerHTML = `
            <div class="message-avatar"><img src="assets/shark-mascot.png" alt="AI"></div>
            <div class="message-content">
                <div class="message-sender">GulfTech AI</div>
                <div class="typing-indicator"><span></span><span></span><span></span></div>
            </div>
        `;
        chatMessages.appendChild(div);
        scrollToBottom();
        return div;
    }

    // ===== MARKDOWN RENDERER =====
    function renderMarkdown(text) {
        let html = escapeHtml(text);

        // Code blocks
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
            return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
        });

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Headers (order matters: longest prefix first)
        html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Bold and italic
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Blockquotes
        html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid var(--accent);padding-left:12px;color:var(--text-secondary);margin:8px 0;">$1</blockquote>');

        // Tables
        html = html.replace(/^\|(.+)\|$/gm, (match) => {
            const cells = match.split('|').filter(c => c.trim());
            if (cells.every(c => /^[\s-:]+$/.test(c))) return ''; // separator row
            const isHeader = false;
            const tag = isHeader ? 'th' : 'td';
            const cellsHtml = cells.map(c => `<${tag} style="padding:8px 12px;border:1px solid var(--border);">${c.trim()}</${tag}>`).join('');
            return `<tr>${cellsHtml}</tr>`;
        });
        html = html.replace(/(<tr>[\s\S]*?<\/tr>)/g, (tableRows) => {
            if (tableRows.includes('<tr>')) {
                return `<table style="border-collapse:collapse;width:100%;margin:12px 0;font-size:0.88rem;">${tableRows}</table>`;
            }
            return tableRows;
        });

        // Unordered lists
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (match) => {
            if (!match.startsWith('<ul>')) return `<ul>${match}</ul>`;
            return match;
        });

        // Ordered lists
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';

        // Clean up empty paragraphs
        html = html.replace(/<p>\s*<\/p>/g, '');
        html = html.replace(/<p>\s*(<h[1-3]>)/g, '$1');
        html = html.replace(/(<\/h[1-3]>)\s*<\/p>/g, '$1');
        html = html.replace(/<p>\s*(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');
        html = html.replace(/<p>\s*(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
        html = html.replace(/<p>\s*(<table)/g, '$1');
        html = html.replace(/(<\/table>)\s*<\/p>/g, '$1');
        html = html.replace(/<p>\s*(<blockquote)/g, '$1');
        html = html.replace(/(<\/blockquote>)\s*<\/p>/g, '$1');

        return html;
    }

    // ===== UTILITIES =====
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function scrollToBottom() {
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    function autoResizeInput() {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===== BOOT =====
    init();
    updateCountdown();
    setInterval(updateCountdown, 1000);

})();
