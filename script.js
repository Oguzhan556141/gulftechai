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
                title: text.slice(0, 50),
                messages: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
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
            conversations[currentConvId].messages.push({ role: 'ai', content: response });
            appendMessage('ai', response);
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

    // ===== GEMINI API =====
    async function callGeminiAPI(userMessage, history) {
        const systemPrompt = `Sen GulfTech AI'sın — FRC (FIRST Robotics Competition) Takımı #11392 "Gulf Tech" için geliştirilmiş bir yapay zeka asistanısın.

Takım Bilgileri:
- Takım Adı: Gulf Tech #11392
- Konum: İzmit, Türkiye (İzmit Körfezi bölgesi)
- Okul: Yücel Koyuncu Bilim ve Sanat Merkezi
- Maskot: Köpek balığı (güç, özgüven ve potansiyeli simgeler)
- Renkler: Koyu mavi/lacivert tonları ve sarı/altın
- Alt takımlar: PR, Mekanik, Elektronik, Yazılım, Tasarım
- FLL'den FRC'ye geçiş yapmış, 5 yıllık FLL deneyimi olan bir takım
- Eskişehir'den başlayıp Avustralya'ya kadar uluslararası deneyim

Görevin:
- FRC stratejisi, robotik, programlama (Java, C++, Python), mekanik tasarım, elektronik, scouting ve takım yönetimi konularında yardımcı ol
- Türkçe ve İngilizce yanıt verebilirsin, kullanıcı hangi dilde yazarsa o dilde cevap ver
- Teknik konularda detaylı ve kod örnekleriyle açıklama yap
- Samimi ama profesyonel bir ton kullan
- Markdown formatı kullan (başlıklar, kod blokları, listeler)`;

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

        // Simulate thinking delay
        await delay(800 + Math.random() * 1200);

        // Knowledge base
        const responses = {
            greeting: `Merhaba! 🦈 Ben **GulfTech AI**, FRC Takımı **#11392 Gulf Tech** için geliştirilmiş yapay zeka asistanıyım.

Size **robotik**, **FRC stratejisi**, **programlama**, **mekanik tasarım**, **scouting** ve daha birçok konuda yardımcı olabilirim.

Ne hakkında konuşmak istersiniz?`,

            gulftech: `## 🦈 Gulf Tech #11392

**Gulf Tech**, İzmit Körfezi bölgesinden gelen bir **FRC (FIRST Robotics Competition)** takımıdır.

### Temel Bilgiler
- **Takım Numarası:** #11392
- **Konum:** İzmit, Türkiye
- **Okul:** Yücel Koyuncu Bilim ve Sanat Merkezi
- **Maskot:** Köpek Balığı 🦈
- **Renkler:** Koyu mavi/lacivert tonları + Sarı/Altın

### Alt Takımlar
- 🎨 **PR** — Halkla ilişkiler ve sosyal medya
- ⚙️ **Mekanik** — Robot yapısı ve mekanizma tasarımı
- ⚡ **Elektronik** — Devre ve sensör sistemleri
- 💻 **Yazılım** — Robot programlama ve otonom kodlama
- 📐 **Tasarım** — CAD ve 3D modelleme

### Yolculuk
Takım, **5 yıllık FLL (FIRST Lego League)** deneyimini FRC'ye taşımıştır. Eskişehir'den başlayan ve Avustralya'ya kadar uzanan uluslararası bir geçmişe sahiptirler.

> *"FRC bizim için yalnızca bir yarışma değil, aynı zamanda bir öğrenme ve gelişim yolculuğudur."*`,

            reefscape: `## 🎮 FRC 2025 — REEFSCAPE

**REEFSCAPE**, FRC'nin 2025 sezonu oyunudur ve su altı/mercan resifi temalı bir oyundur.

### Oyun Alanı
- Okyanus temalı bir sahada oynanan 3v3 ittifak maçları
- **Mercan (Coral)** ve **Yosun (Algae)** game piece'leri

### Otonom Periyot (15 saniye)
- Robot önceden programlanmış komutlarla hareket eder
- Mercanları Reef yapısına yerleştirmek
- Belirli bölgelere otonom hareket puanı

### Teleop Periyot (2dk 15sn)
- Sürücü kontrolüyle mercanları Reef yapısına yerleştirme
- Yosunları işleme (Processor) veya ağa (Net) atma
- Reef yapısının farklı seviyelerine (L1–L4) mercan yerleştirme

### Endgame
- Robotun **Cage** yapısına tırmanması (Shallow/Deep)
- İttifak bonusları

### Strateji İpuçları
1. **Hızlı otonom** çok kritik — ilk mercanları erken yerleştirin
2. **Çok seviyeli** scoring yapabilen robotlar avantajlı
3. **Tırmanma mekanizması** endgame puanları için şart
4. **Savunma stratejisi** ikinci ittifakta düşünülmeli`,

            autonomous: `## 🤖 FRC Otonom Stratejileri

Otonom periyot, maçın ilk **15 saniyesidir** ve robot tamamen önceden programlanmış komutlarla çalışır.

### Temel Stratejiler

#### 1. Basit Otonom (Güvenli)
- Topluluk bölgesinden çıkış
- Bir game piece'i scoring pozisyonuna bırakma
\`\`\`java
// Basit otonom örneği
public void autonomousInit() {
    autoTimer.reset();
    autoTimer.start();
}

public void autonomousPeriodic() {
    if (autoTimer.get() < 2.0) {
        drive.arcadeDrive(0.5, 0); // İleri git
    } else {
        drive.arcadeDrive(0, 0); // Dur
    }
}
\`\`\`

#### 2. Çoklu Scoring Otonomu (Orta)
- 2-3 game piece scoring
- PathPlanner veya Trajectory kullanımı

#### 3. Agresif Otonom (İleri)
- 4+ game piece otonomu
- Vision processing (Limelight/PhotonVision)
- Dinamik yol düzeltme

### Araçlar
- **PathPlanner** — Otonom yol planlaması
- **PhotonVision** — Görüntü işleme
- **WPILib Trajectory** — Yörünge takibi
- **REV/CTRE tuning** — Motor kontrolcü ayarları

### İpuçları
1. Otonomu **modüler** yazın — küçük komutlar birleştirin
2. Her zaman bir **yedek basit otonom** hazır tutun
3. **Odometry** kalibrasyonunu ihmal etmeyin
4. Pratikte **en az 50+ test** çalıştırın`,

            coding: `## 💻 FRC Robot Kodlama — Yaygın Hatalar

Java ile FRC robot programlarken en sık yapılan hatalar:

### 1. Motor Kontrolcü Yapılandırması
\`\`\`java
// ❌ YANLIŞ — Factory default unutulmuş
TalonFX motor = new TalonFX(1);

// ✅ DOĞRU
TalonFX motor = new TalonFX(1);
motor.getConfigurator().apply(new TalonFXConfiguration());
\`\`\`

### 2. Null Reference Hataları
\`\`\`java
// ❌ Subsystem'de init yapmadan kullanım
private Joystick joystick;
// robotInit'te joystick = new Joystick(0) unutulmuş

// ✅ Constructor'da başlatma
private final Joystick joystick = new Joystick(0);
\`\`\`

### 3. Otonom Zamanlama
\`\`\`java
// ❌ Thread.sleep kullanımı (YANLIŞ!)
Thread.sleep(2000); // Robot'u kilitler!

// ✅ Timer veya Command-based yapı
new WaitCommand(2.0).andThen(new DriveCommand());
\`\`\`

### 4. PID Tuning
- **P değeri** çok yüksek → Titreşim
- **I değeri** kullanırken **iZone** ayarlayın
- **D değeri** ile response hızını stabilize edin

### 5. CAN Bus Hataları
- Aynı CAN ID'yi iki cihaza vermek
- CAN kablolarını doğru terminate etmemek
- Firmware güncellemelerini yapmamak

> **İpucu:** Her zaman **SmartDashboard / Shuffleboard** ile debug yapın!`,

            scouting: `## 📊 FRC Scouting — Veri Toplama Rehberi

Scouting, maç stratejisi için **kritik** önemdedir.

### Toplanması Gereken Veriler

#### Otonom
- Başlangıç pozisyonu
- Scoring sayısı ve pozisyonları
- Topluluk bölgesinden çıkış (Evet/Hayır)

#### Teleop
- Game piece scoring (tip + konum)
- Toplama hızı (Fast/Medium/Slow)
- Savunma yapıyor mu?
- Penaltı sayısı

#### Endgame
- Tırmanma tipi (Shallow/Deep/None)
- Tırmanma süresi
- Park etme

### Scouting Yöntemleri

| Yöntem | Avantaj | Dezavantaj |
|--------|---------|------------|
| **Kağıt** | Basit, batarya gerektirmez | Veri girişi yavaş |
| **Tablet App** | Hızlı, standart | Şarj ihtiyacı |
| **Web App** | Her cihazda çalışır | İnternet gerekli |
| **QR Code** | Offline + hızlı transfer | Uygulama gerekli |

### Araçlar
- **The Blue Alliance API** — Takım verileri
- **Statbotics** — EPA istatistikleri
- **Google Sheets** — Basit analiz
- **Tableau / Power BI** — Gelişmiş analiz

### İpuçları
1. Scout'çuları **eğitin** — tutarlılık önemli
2. **Super scout** sistemi kullanın (subjektif gözlem)
3. Verileri **gerçek zamanlı** analiz edin
4. İttifak seçiminde **veriye dayalı** karar verin`,

            cad: `## ⚙️ FRC Mekanik Tasarım — CAD Yazılımları

### Önerilen CAD Yazılımları

#### 1. Onshape (⭐ En Çok Önerilen)
- **Ücretsiz** eğitim lisansı
- **Bulut tabanlı** — kurulum gerektirmez
- Takım çolaborasyonu mükemmel
- FRC parça kütüphaneleri mevcut
- **Link:** [onshape.com](https://www.onshape.com)

#### 2. SolidWorks
- Endüstri standardı
- FIRST sponsorluğuyla **ücretsiz**
- Çok güçlü simülasyon
- Öğrenme eğrisi yüksek

#### 3. Fusion 360
- Autodesk'ten **ücretsiz** öğrenci lisansı
- CAM entegrasyonu (CNC için)
- Render kalitesi yüksek

### FRC İçin CAD İpuçları

1. **MKCad** kütüphanesini kullanın — hazır FRC parçaları
2. **COTS parçaları** (WCP, REV, Andymark) modellerine bağlayın
3. **Tolerans** hesaplarını unutmayın (±0.5mm)
4. **Alt montaj** (sub-assembly) yapısı kurun:
   - Drivetrain
   - Intake
   - Shooter/Scorer
   - Climber
5. Tasarımı **haftalık review** yapın

### Robot Ağırlık Yönetimi
- FRC limit: **56 kg (125 lbs)**
- Hedef: **52 kg** — bumper ve batarya için pay bırakın
- **Pocketing** ile parçaları hafifletin
- Alüminyum vs Carbon Fiber karşılaştırması yapın`,

            default: `Harika bir soru! 🦈

Bu konuda size yardımcı olmaktan mutluluk duyarım. Ancak şu an **simüle modda** çalışıyorum, bu yüzden yanıtlarım sınırlı olabilir.

**Tam AI deneyimi** için:
1. Sol alttaki ⚙️ **Ayarlar** butonuna tıklayın
2. Bir **Google Gemini API anahtarı** girin
3. [Google AI Studio](https://aistudio.google.com/apikey) adresinden ücretsiz anahtar alabilirsiniz

Simüle modda şu konularda yardımcı olabilirim:
- 🦈 Gulf Tech #11392 hakkında bilgi
- 🎮 FRC REEFSCAPE kuralları
- 🤖 Otonom stratejileri
- 💻 Robot kodlama ipuçları
- 📊 Scouting yöntemleri
- ⚙️ CAD ve mekanik tasarım

Bu konulardan birini sormayı deneyin!`
        };

        // Match response
        if (/merhaba|selam|hey|hi|hello|naber|nasıl/i.test(msg)) {
            return responses.greeting;
        }
        if (/gulf\s*tech|takım|team|#11392|11392|hakkında|bilgi ver/i.test(msg)) {
            return responses.gulftech;
        }
        if (/reefscape|reef|2025|oyun.*kural|game.*rule/i.test(msg)) {
            return responses.reefscape;
        }
        if (/otonom|autonomous|auto.*strat/i.test(msg)) {
            return responses.autonomous;
        }
        if (/kod|code|java|python|program|yazılım|software|hata|error|bug/i.test(msg)) {
            return responses.coding;
        }
        if (/scout|veri.*topla|data.*collect|istatist/i.test(msg)) {
            return responses.scouting;
        }
        if (/cad|solidworks|onshape|fusion|mekanik|tasarım|design|mech/i.test(msg)) {
            return responses.cad;
        }

        return responses.default;
    }

    // ===== MESSAGE RENDERING =====
    function appendMessage(role, content, animate = true) {
        const div = document.createElement('div');
        div.className = `message ${role}`;

        if (!animate) div.style.animation = 'none';

        const avatarContent = role === 'ai'
            ? '<img src="assets/shark-mascot.png" alt="AI">'
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
