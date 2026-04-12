// ===== i18n — Multi-language support (TR/EN) =====
const translations = {
    tr: {
        // Sidebar
        newChat: 'Yeni Sohbet',
        tournamentCalendar: 'Turnuva Takvimi',
        today: 'Bugün',
        noChats: 'Henüz sohbet yok',
        deleteChat: 'Sil',
        // Header
        appTitle: 'GulfTech AI',
        // Modes
        userMode: 'v1.0',
        // Settings Modal
        apiSettings: 'API Ayarları',
        apiDesc: 'Gerçek AI yanıtları için bir Google Gemini API anahtarı girin. Anahtar olmadan simüle modda çalışır.',
        apiKeyLabel: 'Gemini API Anahtarı',
        modelLabel: 'Model',
        save: 'Kaydet',
        showHide: 'Göster/Gizle',
        // Models
        modelFlash: 'Gemini 2.0 Flash (Hızlı)',
        modelPro: 'Gemini 2.0 Pro (Gelişmiş)',
        model15Pro: 'Gemini 1.5 Pro',
        // Welcome
        welcomeSub: 'FRC #11392 Yapay Zeka Asistanı',
        welcomeDesc: 'Robotik, FRC stratejisi, takım bilgisi ve daha fazlası hakkında sorularınızı sorun.',
        // Suggestion Chips
        chipRebuilt: 'REBUILT Puanlama',
        chipTeam: 'Takım Kadrosu',
        chipFirst: 'FIRST & FYV',
        chipProjects: 'Projelerimiz',
        // Input
        inputPlaceholder: 'GulfTech AI\'ya mesajınızı yazın...',
        inputHint: 'GulfTech AI hata yapabilir. Önemli bilgileri doğrulayın.',
        poweredBy: 'Powered by Gulf Tech #11392',
        send: 'Gönder',
        // Map Modal
        mapTitle: 'Bölge Haritası & Salon Planı',
        backToTurkey: '← Türkiye Haritasına Dön',
        // Countdown
        days: 'gün',
        hours: 'saat',
        minutes: 'dk',
        seconds: 'sn',
        started: 'Başladı!',
        // OrionOS
        orionActivated: '🌌 OrionOS Geliştirici Modu Aktif',
        orionDeactivated: '💫 Kullanıcı moduna dönüldü',
        // Language
        langSwitch: '🇬🇧 EN'
    },
    en: {
        newChat: 'New Chat',
        tournamentCalendar: 'Tournament Calendar',
        today: 'Today',
        noChats: 'No chats yet',
        deleteChat: 'Delete',
        appTitle: 'GulfTech AI',
        userMode: 'v1.0',
        apiSettings: 'API Settings',
        apiDesc: 'Enter a Google Gemini API key for real AI responses. Without a key, it runs in simulation mode.',
        apiKeyLabel: 'Gemini API Key',
        modelLabel: 'Model',
        save: 'Save',
        showHide: 'Show/Hide',
        modelFlash: 'Gemini 2.0 Flash (Fast)',
        modelPro: 'Gemini 2.0 Pro (Advanced)',
        model15Pro: 'Gemini 1.5 Pro',
        welcomeSub: 'FRC #11392 AI Assistant',
        welcomeDesc: 'Ask questions about robotics, FRC strategy, team info, and more.',
        chipRebuilt: 'REBUILT Scoring',
        chipTeam: 'Team Roster',
        chipFirst: 'FIRST & FYV',
        chipProjects: 'Our Projects',
        inputPlaceholder: 'Type your message to GulfTech AI...',
        inputHint: 'GulfTech AI may make mistakes. Verify important info.',
        poweredBy: 'Powered by Gulf Tech #11392',
        send: 'Send',
        mapTitle: 'Region Map & Venue Plan',
        backToTurkey: '← Back to Turkey Map',
        days: 'days',
        hours: 'hrs',
        minutes: 'min',
        seconds: 'sec',
        started: 'Started!',
        orionActivated: '🌌 OrionOS Developer Mode Activated',
        orionDeactivated: '💫 Switched to User Mode',
        langSwitch: '🇹🇷 TR'
    }
};

const I18N_STORAGE_KEY = 'gt_language';

let currentLang = localStorage.getItem(I18N_STORAGE_KEY) || 'tr';

export function t(key) {
    return translations[currentLang]?.[key] || translations.tr[key] || key;
}

export function getLang() {
    return currentLang;
}

export function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem(I18N_STORAGE_KEY, lang);
    applyTranslations();
}

export function toggleLanguage() {
    setLanguage(currentLang === 'tr' ? 'en' : 'tr');
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = val;
        } else {
            el.textContent = val;
        }
    });
    // Update html lang attribute
    document.documentElement.lang = currentLang;
    // Update lang switch button text
    const langBtn = document.getElementById('langSwitchBtn');
    if (langBtn) {
        langBtn.textContent = t('langSwitch');
    }
}

export function initI18n() {
    applyTranslations();
}
