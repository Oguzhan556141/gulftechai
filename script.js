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
- Takım Adı: Gulf Tech #11392 (İzmit Körfezi'nden ilham alır)
- Konum: Gölcük BİLSEM, Kocaeli, Türkiye
- Okul: Yücel Koyuncu Bilim ve Sanat Merkezi
- Maskot: Köpek balığı (Özgüven, potansiyel ve azmi temsil eder)
- Renkler: Mavi (derinlik ve kararlılık) ve Sarı (enerji)
- Motto: STEM eğitimi ve liderlik odaklı bir gelişim yolculuğu.

Kilit Kişiler:
- Takım Mentorü: Ensar İnce
- Takım & Mekanik Kaptanı: Levent Yiğit
- Takım & PR Kaptanı: Tuğra Kerem Kaya
- Yazılım Kaptanı: İrem Ünver
- Yazılım Ekibi: Oğuzhan Aşkın, İrem Ünver, Zeynep Sude Çakmak, Elif Başuslu
- Mekanik Ekibi: Levent Yiğit, Tufan Gülmez, Arda Furkan Aygenoğlu, Muhammet Ali Sardoğan, Nilgün Hilal Karataş
- PR Ekibi: Tuğra Kerem Kaya, Zeynep Sude Çakmak, Beray Erenel, Elif Başuslu, Ege Göllü, Nilgün Hilal Karataş
- Tasarım & CAD: Eren Özgüler

Görevin:
- Üyeleri isim ve görevleriyle net eşleştir: Örn: "Oğuzhan Aşkın yazılım ekibindedir."
- Outreach: Çocuk Kasabası (Çocuk Kasabası) mentorlukları, İZAYDAŞ teknik gezisi (atık yönetimi).
- Teknik: 2026 Scouting sistemi (web tabanlı), Swerve/Tank şasiler, gerçek zamanlı veri analizi.
- Sponsorlar: Boeing, Fikret Yüksel Vakfı, TEKSA, Teknorova, Gölcük BİLSEM, Gölcük Belediyesi.

- İletişim: gulftechtr@gmail.com | Instagram: @gulftechtr | LinkedIn: Gulf Tech Team | YouTube: @gulftechtr
- Telefon: +90 (537) 692 6558, +90 (544) 552 0919
- Playlistler: "Tech the Halls" (Yılbaşı & Mühendislik), "Charge Up FEBRUARY" (Yüksek enerji/motivasyon)

Görevin:
- FRC stratejisi, robotik, programlama, mekanik ve iletişim konularında yardımcı ol.
- Takım üyeleri ve iletişim kanalları hakkında detaylı bilgi ver.
- Türkçe/İngilizce yanıt ver, samimi ol, 🦈 kullan.
- Yanıtları tane tane (typewriter) veriyormuşsun gibi düşün (kod bunu yapacak).
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

        // Expand simulated knowledge base with researched details
        const teamInfo = {
            members: {
                mentors: ["Ensar İnce"],
                software: ["İrem Ünver (Kaptan)", "Oğuzhan Aşkın", "Zeynep Sude Çakmak", "Elif Başuslu"],
                mechanical: ["Levent Yiğit (Kaptan)", "Tufan Gülmez", "Arda Furkan Aygenoğlu", "Muhammet Ali Sardoğan", "Nilgün Hilal Karataş"],
                pr: ["Tuğra Kerem Kaya (Kaptan)", "Zeynep Sude Çakmak", "Beray Erenel", "Elif Başuslu", "Ege Göllü", "Nilgün Hilal Karataş"],
                design: ["Eren Özgüler"]
            },
            outreach: [
                "Çocuk Kasabası (Çocuk Kasabası) ziyaretleri ve mentorlukları",
                "İZAYDAŞ gezisi — Endüstriyel atık yönetimi ve geri dönüşüm eğitimi",
                "Diğer FRC takımlarıyla ortak toplantılar ve bilgi paylaşımı"
            ],
            sponsors: ["Boeing", "Fikret Yüksel Vakfı", "TEKSA", "Teknorova", "Gölcük BİLSEM", "Gölcük Belediyesi"],
            technical: {
                scouting: "2026 için geliştirilen yeni web tabanlı sistem. Auto climb, ball scoring, swerve/tank analizi ve robot kondisyonu takibi yapabiliyor."
            }
        };

        // Simulate thinking delay
        await delay(1000 + Math.random() * 1000);

        // Open-ended response logic
        if (/kaptan|captain|lider/i.test(msg)) {
            return `## 🦈 Gulf Tech Kaptanları\n\nTakımımızda liderlik rollerini şu isimler paylaşıyor:\n\n- **Levent Yiğit:** Takım Kaptanı ve Mekanik Kaptanı\n- **Tuğra Kerem Kaya:** Takım Kaptanı ve PR Kaptanı\n- **İrem Ünver:** Yazılım Kaptanı\n\nBu ekip, takımın hem teknik hem de stratejik yönetimini sağlıyor.`;
        }

        if (/yazılım|yazılımcı|software|kod/i.test(msg)) {
            return `## 💻 Yazılım Ekibimiz\n\nYazılım ekibimiz, robotun otonom ve teleop kontrollerinden sorumludur. Ekip üyelerimiz:\n\n- **İrem Ünver (Kaptan)**\n- **Oğuzhan Aşkın**\n- **Zeynep Sude Çakmak**\n- **Elif Başuslu**\n\nŞu an özellikle **2026 Scouting Sistemi** ve robotun kararlı çalışması üzerine odaklanmış durumdalar. 🤖`;
        }

        if (/etkinlik|outreach|ne yaptınız|gezi|ziyaret/i.test(msg)) {
            return `## 🌍 Gulf Tech Etkinlikleri\n\nTopluma katkı sağlamak ve kendimizi geliştirmek için birçok etkinlik düzenliyoruz:\n\n- **Çocuk Kasabası:** Geleceğin mühendislerine ilham vermek için Çocuk Kasabası'nda mentorluk yapıyoruz.\n- **İZAYDAŞ:** Sürdürülebilirlik vizyonumuz kapsamında atık yönetimi tesislerini ziyaret ettik.\n- **Takım Buluşmaları:** Diğer FRC takımlarıyla tecrübe paylaşımı yapıyoruz.\n\nAmacımız sadece robot yapmak değil, çevremizde bir fark yaratmak! 🦈`;
        }

        if (/pr|halkla|ilişkil|sosyal\s*medya|sponsor/i.test(msg)) {
            return `## 🎨 PR (Halkla İlişkiler) Ekibimiz\n\nTakımımızın sesini dünyaya duyuran ve destekçilerimizle bağ kuran ekibimiz:\n\n- **Tuğra Kerem Kaya (Kaptan)**\n- **Beray Erenel**\n- **Ege Göllü**\n- **Zeynep Sude Çakmak**\n- **Elif Başuslu**\n- **Nilgün Hilal Karataş**\n\nSponsorluk görüşmeleri, sosyal medya yönetimi ve takımın kurumsal kimliği bu ekibin elinden çıkıyor. 🦈✨`;
        }

        if (/tasarım|cad|3d|onshape|model/i.test(msg)) {
            return `## 📐 Tasarım ve CAD Ekibi\n\nRobotumuzun dijital dünyadaki mimarı:\n\n- **Eren Özgüler**\n\nRobot inşa edilmeden önce her parça **Onshape** üzerinde Eren tarafından titizlikle planlanıyor. "Önce Tasarla, Sonra İnşa Et" prensibiyle çalışıyoruz. 🛠️`;
        }

        if (/mekanik|mechanical|robot/i.test(msg)) {
            return `## ⚙️ Mekanik ve Tasarım\n\nRobotumuzun kalbi burada atıyor! Mekanik ekibimiz:\n\n- **Kaptan:** Levent Yiğit\n- **Üyeler:** Tufan, Arda Furkan, Muhammet Ali, Nilgün Hilal.\n\nRobot tasarımında **Onshape** gibi CAD yazılımları kullanıyoruz ve şu an **2025 REEFSCAPE** için en verimli mekanizmaları test ediyoruz. 📐`;
        }

        if (/scout/i.test(msg)) {
            return `## 📊 Scouting Sistemimiz\n\nVeri odaklı kararlar almak için geliştirdiğimiz **2026 Scouting Sistemi** oldukça güçlü:\n\n- **Web tabanlı:** Her yerden erişilebilir.\n- **Kapsam:** Auto başarısı, tırmanma, scoring ve robotun sürücü performansı.\n- **Analiz:** Swerve veya Tank şasi gibi teknik detayları gerçek zamanlı analiz ediyoruz.\n\nİttifak seçimlerinde en büyük yardımcımız bu sistem! 🦈`;
        }

        if (/playlist|müzik|şarkı|dinle/i.test(msg)) {
            return `## 🎵 Gulf Tech Playlistleri\n\nRobot yaparken motivasyonumuzu yüksek tutan favori listelerimiz:\n\n- **Tech the Halls:** Yılbaşı ruhunu mühendislik vizyonumuzla birleştirdiğimiz özel listemiz. 🎄⚙️\n- **Charge Up FEBRUARY:** Şubat ayının yoğun çalışma temposunda enerjimizi zirvede tutan yüksek tempolu parçalar. ⚡🚀\n\nBu listeler Spotify hesabımızda mevcut, robot kodlarken mutlaka dinlemelisin! 🦈`;
        }

        if (/iletişim|ulaş|telefon|numara|sosyal\s*medya|instagram|mail|e-posta/i.test(msg)) {
            return `## 📞 Bize Ulaşın\n\nGulf Tech #11392 ekibiyle her zaman iletişimde kalabilirsin:\n\n### Sosyal Medya\n- **Instagram:** [@gulftechtr](https://www.instagram.com/gulftechtr/)\n- **LinkedIn:** [Gulf Tech Team](https://www.linkedin.com/in/gulf-tech-280625398/)\n- **YouTube:** [@gulftechtr](https://www.youtube.com/@gulftechtr)\n\n### İletişim Kanalları\n- **E-posta:** gulftechtr@gmail.com\n- **Telefon 1:** +90 (537) 692 6558\n- **Telefon 2:** +90 (544) 552 0919\n\nSoruların varsa çekinmeden yazabilirsin! 🦈✨`;
        }

        // Generic informative response for everything else
        return `Güzel bir konu! 🦈 Bu konuda daha derinlemesine konuşabiliriz. \n\nŞu an **simüle modda** olduğum için belirli anahtar kelimelerle daha iyi yanıt verebiliyorum. Ama istersen bana **yazılım ekibini**, **sponsorlarımızı**, **playlistlerimizi** veya **iletişim kanallarımızı** sorabilirsin.\n\nEğer gerçek bir yapay zeka deneyimi istersen Ayarlar'dan **Gemini API** anahtarını ekleyebilirsin! ✨`;
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
