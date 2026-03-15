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

    // ===== NEW CHAT =====
    function startNewChat() {
        currentConvId = null;
        chatMessages.innerHTML = '';

        // Re-add welcome screen
        const welcome = document.createElement('div');
        welcome.className = 'welcome-screen';
        welcome.id = 'welcomeScreen';
        welcome.innerHTML = `
            <img src="assets/shark-mascot.png" alt="GulfTech Shark" class="welcome-mascot">
            <h1>Gulf<span class="accent">Tech</span> AI</h1>
            <p>FRC #11392 Yapay Zeka Asistanı</p>
            <p class="welcome-sub">Robotik, FRC stratejisi, programlama ve daha fazlası hakkında sorularınızı sorun.</p>
            <div class="suggestions" id="suggestions">
                <button class="suggestion-chip" data-prompt="FRC 2025 REEFSCAPE oyun kurallarını açıkla">
                    <span class="chip-icon">🎮</span><span>REEFSCAPE Kuralları</span>
                </button>
                <button class="suggestion-chip" data-prompt="FRC'de otonom dönem için en iyi stratejiler neler?">
                    <span class="chip-icon">🤖</span><span>Otonom Stratejileri</span>
                </button>
                <button class="suggestion-chip" data-prompt="Java'da FRC robot kodu yazarken en yaygın hatalar neler?">
                    <span class="chip-icon">💻</span><span>Robot Kod Hataları</span>
                </button>
                <button class="suggestion-chip" data-prompt="Scouting verisi toplamak için en iyi yöntemler neler?">
                    <span class="chip-icon">📊</span><span>Scouting İpuçları</span>
                </button>
                <button class="suggestion-chip" data-prompt="FRC'de mekanik tasarım için CAD yazılımı önerir misin?">
                    <span class="chip-icon">⚙️</span><span>CAD & Mekanik</span>
                </button>
                <button class="suggestion-chip" data-prompt="Gulf Tech #11392 takımı hakkında bilgi ver">
                    <span class="chip-icon">🦈</span><span>Gulf Tech Hakkında</span>
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
        const systemPrompt = `Sen GulfTech AI'sın — FRC (FIRST Robotics Competition) Takımı #11392 "Gulf Tech" için geliştirilmiş bir yapay zeka asistanısın.

Takım Kimliği:
- Takım Adı: Gulf Tech #11392
- Kuruluş: 2026 (FRC Rookie Yılı)
- Konum: Gölcük BİLSEM, Kocaeli
- Arka Plan: 5 yıllık FLL tecrübesi üzerine kurulmuş profesyonel bir FRC takımı.
- Maskot: Köpek balığı (Mavi: Derinlik, Sarı/Altın: Enerji)

Departmanlar ve Kilit Kişiler:
- Mentor: Ensar İnce
- Kaptanlar: Levent Yiğit, Tuğra Kerem Kaya, İrem Ünver
- Yazılım (Software): İrem Ünver (Kaptan), Oğuzhan Aşkın, Zeynep Sude Çakmak, Elif Başuslu
- Mekanik (Mechanical): Levent Yiğit (Kaptan), Tufan Gülmez, Arda Furkan Aygenoğlu, Muhammet Ali Sardoğan, Nilgün Hilal Karataş
- PR (Halkla İlişkiler): Tuğra Kerem Kaya (Kaptan), Beray Erenel, Ege Göllü, Zeynep Sude Çakmak, Elif Başuslu, Nilgün Hilal Karataş
- Tasarım (Design): Eren Özgüler (Onshape uzmanı)
- Elektronik (Electronic): Donanım entegrasyonu ve kablolama ekibi.

Tarihçe:
- Takım, 2026'da FRC'ye katılmasına rağmen BİLSEM bünyesinde 5 yıllık bir robotik kültürü taşır.
- Destekçiler: Boeing, Gölcük Belediyesi, Fikret Yüksel Vakfı.
- FRC 2026 REBUILT: Bu sezon Hub ve Tower stratejilerine odaklanıyoruz.

Görevin:
- Takımın tarihçesini, departmanlarını ve 2026 REBUILT hedeflerini sinsi değil, gururla anlat.
- Mavi renk şemasını (Gulf Blue) ve köpek balığı vizyonunu vurgula.
- Türkçe/İngilizce yanıt ver, samimi ol, 🦈 kullan.
- Markdown formatı kullan.`;

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
            captains: "Levent Yiğit, Tuğra Kerem Kaya ve İrem Ünver",
            software: ["İrem Ünver (Yazılım Kaptanı)", "Oğuzhan Aşkın", "Zeynep Sude Çakmak", "Elif Başuslu"],
            mechanical: ["Levent Yiğit (Mekanik Kaptanı)", "Tufan Gülmez", "Arda Furkan Aygenoğlu", "Muhammet Ali Sardoğan", "Nilgün Hilal Karataş"],
            pr: ["Tuğra Kerem Kaya (PR Kaptanı)", "Beray Erenel", "Ege Göllü", "Zeynep Sude Çakmak", "Elif Başuslu", "Nilgün Hilal Karataş"],
            design: ["Eren Özgüler (Onshape/CAD Uzmanı)"],
            electronics: ["Takım Elektronik Altyapı Ekibi"]
        };

        const history = `**GulfTech #11392**, 2026 yılında FRC dünyasına bir 'Rookie' takımı olarak merhaba dedi. Ancak köklerimiz, Gölcük BİLSEM'deki **5 yıllık FLL (FIRST LEGO League)** robotik geçmişimize dayanıyor. Boeing ve Gölcük Belediyesi gibi dev isimlerin desteğiyle, Kocaeli'den yükselen bir teknoloji fırtınası olmayı hedefliyoruz! 🌊🤖`;

        let response = "";

        if (/takım.*tanıt|ekib.*tanıt|üyeler|kimler var/i.test(msg)) {
            response = `### 🦈 GulfTech Departmanları\n\n` +
                `**🎓 Baş Mentor:**\n- ${team.mentor}\n\n` +
                `**🔱 Kaptanlar:**\n- ${team.captains}\n\n` +
                `**💻 Yazılım (Software):**\n- ${team.software.join('\n- ')}\n\n` +
                `**⚙️ Mekanik (Mechanical):**\n- ${team.mechanical.join('\n- ')}\n\n` +
                `**🎨 PR (Public Relations):**\n- ${team.pr.join('\n- ')}\n\n` +
                `**📐 Tasarım (Design/CAD):**\n- ${team.design.join('\n- ')}\n\n` +
                `**⚡ Elektronik:**\n- ${team.electronics.join('\n- ')}\n\n` +
                `Ekiplerimiz, 2026 **REBUILT** sezonunda en iyi performansı sergilemek için senkronize bir şekilde çalışıyor! 🚀`;
            await delay(1200);
            return response;
        }

        if (/tarih|geçmiş|hikaye|ne zaman kuruldu/i.test(msg)) {
            response = `### 📖 Tarihçemiz\n\n${history}\n\nYolculuğumuz BİLSEM'in robotik vizyonuyla başladı ve bugün FRC'nin dev sahalarına taşındı. 🦈✨`;
            await delay(1000);
            return response;
        }

        if (/2026|rebuilt|game|oyun/i.test(msg)) {
            response += `### 🏗️ FRC 2026: REBUILT (Presented by Haas)\n\n2026 sezonu teması **REBUILT** olarak açıklandı! "Geçmişi yeniden hayal etme" konseptiyle sahadayız:\n` +
                `- **Active Hubs (Aktif Merkezler):** Robotlar topladıkları yakıtları (fuel) merkezlere atarak puan toplar.\n` +
                `- **The Tower (Kule):** Maç sonunda robotların kuleye tırmanması (Level 1, 2 veya 3) en önemli puan kaynaklarından biridir.\n` +
                `- **Otonom Dönem:** İlk 20 saniye robotlar merkezlere yakıt atarak ve tırmanış hazırlığı yaparak başlar.\n` +
                `- **Yakıt Toplama:** Yakıtlar outpost'lardaki insan oyunculardan veya sahadaki depolardan toplanabilir.\n\n` +
                `Biz GulfTech olarak 2026'da "REBUILT" sahasında en verimli yakıt sistemini kurmayı hedefliyoruz! 🦈💎\n\n`;
        }

        if (/reefscape|oyun|kural|2025/i.test(msg)) {
            response += `### 🎮 FRC 2025: REEFSCAPE\n\n**REEFSCAPE** sezonunda odaklanmamız gereken ana noktalar:\n` +
                `- **Coral (Mercan):** Resif'in (Reef) 4 farklı seviyesine mercan yerleştirerek puan kazanılır. L4 en yüksek puanı verir.\n` +
                `- **Algae (Yosun):** Resif üzerindeki yosunları temizleyerek 'Processor'a atmak veya 'Barge'a ulaştırmak önemlidir.\n` +
                `- **Endgame:** Maç sonunda robotların 'Barge'a tırmanması (Deep veya Shallow climb) kritik puan değerindedir.\n\n` +
                `Biz GulfTech olarak bu sene hızlı bir asansör sistemi ve stabil bir Swerve şasisi ile sahada fark yaratmayı hedefliyoruz! 🚀\n\n`;
        }

        if (/swerve|şasi|drive/i.test(msg)) {
            response += `### 🏎️ Swerve Drive (MK4i)\nTakımımız **MK4i Swerve** modüllerini kullanıyor. Avantajlarımız:\n` +
                `- **360° Manevra Kabiliyeti:** Dar alanlarda rakipleri kolayca ekarte edebiliyoruz.\n` +
                `- **Fırçasız Motorlar:** CANcoder ve Falcon/Kraken motorlarla maksimum tork ve hız.\n` +
                `- **Yazılım Kontrolü:** WPILib ve PathPlanner ile otonom dönemde milimetrik hassasiyet. 🚀\n\n`;
        }

        if (/scout|veri|analiz/i.test(msg)) {
            response += `### 📊 Gelişmiş Scouting\nScouting ekibimiz, rakip analizlerini gerçek zamanlı yaparak maç stratejilerimizi güncelliyor. 2026 için hedefimiz, veriyi doğrudan tableau veya özel web panellerimize aktaran tamamen otonom bir sistem! 📈\n\n`;
        }

        // Broad fallback
        if (response === "") {
            response = `Anlıyorum! 🦈 **FRC 2025 REEFSCAPE** veya **2026 REBUILT** sezonu hakkında sormak istediğin bir şey var mı? \n\nRobot mekaniği, yakıt toplama stratejileri veya kule tırmanış detaylarından bahsedebilirim! ✨`;
        } else {
            response += `\nBaşka merak ettiğin bir FRC detayı var mı? 🦈`;
        }

        await delay(1000 + Math.random() * 1000);
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

})();
