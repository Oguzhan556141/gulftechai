// ===== i18n — Multi-language support (TR/EN/DE/FR/ES) =====
export const SUPPORTED_LANGUAGES = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷', label: '🇹🇷 TR' },
    { code: 'en', name: 'English', flag: '🇬🇧', label: '🇬🇧 EN' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', label: '🇩🇪 DE' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', label: '🇫🇷 FR' },
    { code: 'es', name: 'Español', flag: '🇪🇸', label: '🇪🇸 ES' }
];

const translations = {
    tr: {
        newChat: 'Yeni Sohbet',
        tournamentCalendar: 'Turnuva Takvimi',
        today: 'Bugün',
        noChats: 'Henüz sohbet yok',
        deleteChat: 'Sil',
        appTitle: 'GulfTech AI',
        userMode: 'v1.1',
        apiSettings: 'API Ayarları',
        apiDesc: 'Gerçek AI yanıtları için bir Google Gemini API anahtarı girin. Anahtar olmadan simüle modda çalışır.',
        apiKeyLabel: 'Gemini API Anahtarı',
        modelLabel: 'Model',
        save: 'Kaydet',
        showHide: 'Göster/Gizle',
        modelFlash: 'Gemini 2.0 Flash (Hızlı)',
        modelPro: 'Gemini 2.0 Pro (Gelişmiş)',
        model15Pro: 'Gemini 1.5 Pro',
        welcomeSub: 'FRC #11392 Yapay Zeka Asistanı',
        welcomeDesc: 'Robotik, FRC stratejisi, takım bilgisi ve daha fazlası hakkında sorularınızı sorun.',
        chipRebuilt: 'REBUILT Puanlama',
        chipTeam: 'Takım Kadrosu',
        chipFirst: 'FIRST & FYV',
        chipProjects: 'Projelerimiz',
        inputPlaceholder: 'GulfTech AI\'ya mesajınızı yazın...',
        inputHint: 'GulfTech AI hata yapabilir. Önemli bilgileri doğrulayın.',
        poweredBy: 'Powered by Gulf Tech #11392',
        send: 'Gönder',
        mapTitle: 'Bölge Haritası & Salon Planı',
        backToTurkey: '← Türkiye Haritasına Dön',
        days: 'gün',
        hours: 'saat',
        minutes: 'dk',
        seconds: 'sn',
        started: 'Başladı!',
        orionActivated: '🌌 OrionOS Geliştirici Modu Aktif',
        orionDeactivated: '💫 Kullanıcı moduna dönüldü'
    },
    en: {
        newChat: 'New Chat',
        tournamentCalendar: 'Tournament Calendar',
        today: 'Today',
        noChats: 'No chats yet',
        deleteChat: 'Delete',
        appTitle: 'GulfTech AI',
        userMode: 'v1.1',
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
        orionDeactivated: '💫 Switched to User Mode'
    },
    de: {
        newChat: 'Neuer Chat',
        tournamentCalendar: 'Turnierkalender',
        today: 'Heute',
        noChats: 'Noch keine Chats',
        deleteChat: 'Löschen',
        appTitle: 'GulfTech AI',
        userMode: 'v1.1',
        apiSettings: 'API-Einstellungen',
        apiDesc: 'Geben Sie einen Google Gemini API-Schlüssel ein. Ohne Schlüssel läuft der Simulationsmodus.',
        apiKeyLabel: 'Gemini API-Schlüssel',
        modelLabel: 'Modell',
        save: 'Speichern',
        showHide: 'Anzeigen/Ausblenden',
        modelFlash: 'Gemini 2.0 Flash (Schnell)',
        modelPro: 'Gemini 2.0 Pro (Fortgeschritten)',
        model15Pro: 'Gemini 1.5 Pro',
        welcomeSub: 'FRC #11392 KI-Assistent',
        welcomeDesc: 'Stellen Sie Fragen zu Robotik, FRC-Strategie, Teaminformationen und mehr.',
        chipRebuilt: 'REBUILT Punkte',
        chipTeam: 'Team-Kader',
        chipFirst: 'FIRST & FYV',
        chipProjects: 'Unsere Projekte',
        inputPlaceholder: 'Schreiben Sie eine Nachricht an GulfTech AI...',
        inputHint: 'GulfTech AI kann Fehler machen. Überprüfen Sie wichtige Daten.',
        poweredBy: 'Bereitgestellt von Gulf Tech #11392',
        send: 'Senden',
        mapTitle: 'Regional-Karte & Hallenplan',
        backToTurkey: '← Zurück zur Türkei-Karte',
        days: 'Tage',
        hours: 'Std',
        minutes: 'Min',
        seconds: 'Sek',
        started: 'Gestartet!',
        orionActivated: '🌌 OrionOS Entwicklermodus Aktiviert',
        orionDeactivated: '💫 Zurück zum Benutzermodus'
    },
    fr: {
        newChat: 'Nouvelle discussion',
        tournamentCalendar: 'Calendrier des tournois',
        today: 'Aujourd\'hui',
        noChats: 'Pas encore de discussion',
        deleteChat: 'Supprimer',
        appTitle: 'GulfTech AI',
        userMode: 'v1.1',
        apiSettings: 'Paramètres de l\'API',
        apiDesc: 'Entrez une clé API Google Gemini. Sans clé, l\'assistant fonctionne en simulation.',
        apiKeyLabel: 'Clé API Gemini',
        modelLabel: 'Modèle',
        save: 'Enregistrer',
        showHide: 'Afficher/Masquer',
        modelFlash: 'Gemini 2.0 Flash (Rapide)',
        modelPro: 'Gemini 2.0 Pro (Avancé)',
        model15Pro: 'Gemini 1.5 Pro',
        welcomeSub: 'Assistant IA FRC #11392',
        welcomeDesc: 'Posez vos questions sur la robotique, les stratégies FRC, l\'équipe et plus encore.',
        chipRebuilt: 'Score REBUILT',
        chipTeam: 'Membres de l\'équipe',
        chipFirst: 'FIRST & FYV',
        chipProjects: 'Nos projets',
        inputPlaceholder: 'Écrivez votre message à GulfTech AI...',
        inputHint: 'GulfTech AI peut faire des erreurs. Vérifiez les informations.',
        poweredBy: 'Propulsé par Gulf Tech #11392',
        send: 'Envoyer',
        mapTitle: 'Carte régionale & Plan de salle',
        backToTurkey: '← Retour à la carte de Turquie',
        days: 'jours',
        hours: 'h',
        minutes: 'min',
        seconds: 's',
        started: 'Démarré !',
        orionActivated: '🌌 Mode Développeur OrionOS Activé',
        orionDeactivated: '💫 Retour au mode utilisateur'
    },
    es: {
        newChat: 'Nuevo chat',
        tournamentCalendar: 'Calendario de torneos',
        today: 'Hoy',
        noChats: 'No hay chats aún',
        deleteChat: 'Eliminar',
        appTitle: 'GulfTech AI',
        userMode: 'v1.1',
        apiSettings: 'Configuración API',
        apiDesc: 'Ingrese una clave API de Google Gemini. Sin clave, funciona en modo simulación.',
        apiKeyLabel: 'Clave API Gemini',
        modelLabel: 'Modelo',
        save: 'Guardar',
        showHide: 'Mostrar/Ocultar',
        modelFlash: 'Gemini 2.0 Flash (Rápido)',
        modelPro: 'Gemini 2.0 Pro (Avanzado)',
        model15Pro: 'Gemini 1.5 Pro',
        welcomeSub: 'Asistente de IA FRC #11392',
        welcomeDesc: 'Haz preguntas sobre robótica, estrategia FRC, información del equipo y más.',
        chipRebuilt: 'Puntuación REBUILT',
        chipTeam: 'Equipo',
        chipFirst: 'FIRST & FYV',
        chipProjects: 'Nuestros proyectos',
        inputPlaceholder: 'Escribe tu mensaje a GulfTech AI...',
        inputHint: 'GulfTech AI puede cometer errores. Verifica la información clave.',
        poweredBy: 'Desarrollado por Gulf Tech #11392',
        send: 'Enviar',
        mapTitle: 'Mapa regional y Plano del lugar',
        backToTurkey: '← Volver al mapa de Turquía',
        days: 'días',
        hours: 'h',
        minutes: 'min',
        seconds: 'seg',
        started: '¡Iniciado!',
        orionActivated: '🌌 Modo Desarrollador OrionOS Activado',
        orionDeactivated: '💫 Cambio a modo usuario'
    }
};

const I18N_STORAGE_KEY = 'gt_language';

let currentLang = localStorage.getItem(I18N_STORAGE_KEY) || 'tr';

export function t(key) {
    return translations[currentLang]?.[key] || translations.tr[key] || translations.en[key] || key;
}

export function getLang() {
    return currentLang;
}

export function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem(I18N_STORAGE_KEY, lang);
    applyTranslations();
}

export function toggleLanguage() {
    const codes = SUPPORTED_LANGUAGES.map(l => l.code);
    const nextIdx = (codes.indexOf(currentLang) + 1) % codes.length;
    setLanguage(codes[nextIdx]);
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

    document.documentElement.lang = currentLang;

    // Update active state in language menu / trigger
    const currentObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];
    
    // Update main header and sidebar triggers
    document.querySelectorAll('.lang-current-label').forEach(el => {
        el.textContent = currentObj.label;
    });

    document.querySelectorAll('.lang-dropdown-item').forEach(btn => {
        const langCode = btn.getAttribute('data-lang');
        btn.classList.toggle('active', langCode === currentLang);
    });
}

export function initI18n() {
    applyTranslations();
}
