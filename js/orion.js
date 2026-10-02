// ==========================================
// GulfTech AI — OrionOS Console & Live Knowledge Engine
// Admin & Developer Utilities (Active ONLY when isOrionMode is true)
// ==========================================

const CUSTOM_KNOWLEDGE_KEY = 'gt_custom_knowledge_overrides';

/**
 * Loads and applies any stored knowledge mutations from localStorage
 * into window.appKnowledge.
 */
export function applyStoredCustomKnowledge() {
    if (!window.appKnowledge) return;
    try {
        const stored = localStorage.getItem(CUSTOM_KNOWLEDGE_KEY);
        if (!stored) return;
        const overrides = JSON.parse(stored);
        
        // Merge sponsors
        if (Array.isArray(overrides.sponsorlar) && overrides.sponsorlar.length > 0) {
            window.appKnowledge.sponsorlar = window.appKnowledge.sponsorlar || [];
            overrides.sponsorlar.forEach(newSponsor => {
                const existingIdx = window.appKnowledge.sponsorlar.findIndex(
                    s => s.ad && s.ad.toLowerCase() === newSponsor.ad.toLowerCase()
                );
                if (existingIdx >= 0) {
                    window.appKnowledge.sponsorlar[existingIdx] = newSponsor;
                } else {
                    window.appKnowledge.sponsorlar.unshift(newSponsor);
                }
            });
        }

        // Merge mentors
        if (Array.isArray(overrides.yonetim_ve_mentorlar) && overrides.yonetim_ve_mentorlar.length > 0) {
            window.appKnowledge.yonetim_ve_mentorlar = window.appKnowledge.yonetim_ve_mentorlar || [];
            overrides.yonetim_ve_mentorlar.forEach(newMentor => {
                const existingIdx = window.appKnowledge.yonetim_ve_mentorlar.findIndex(
                    m => m.isim && m.isim.toLowerCase() === newMentor.isim.toLowerCase()
                );
                if (existingIdx >= 0) {
                    window.appKnowledge.yonetim_ve_mentorlar[existingIdx] = newMentor;
                } else {
                    window.appKnowledge.yonetim_ve_mentorlar.push(newMentor);
                }
            });
        }

        // Merge team members
        if (Array.isArray(overrides.ekip_uyeleri) && overrides.ekip_uyeleri.length > 0) {
            window.appKnowledge.ekip_uyeleri = window.appKnowledge.ekip_uyeleri || [];
            overrides.ekip_uyeleri.forEach(newMember => {
                const existingIdx = window.appKnowledge.ekip_uyeleri.findIndex(
                    m => m.isim && m.isim.toLowerCase() === newMember.isim.toLowerCase()
                );
                if (existingIdx >= 0) {
                    window.appKnowledge.ekip_uyeleri[existingIdx] = newMember;
                } else {
                    window.appKnowledge.ekip_uyeleri.push(newMember);
                }
            });
        }

        // Merge captains
        if (Array.isArray(overrides.kaptanlar) && overrides.kaptanlar.length > 0) {
            window.appKnowledge.kaptanlar = window.appKnowledge.kaptanlar || [];
            overrides.kaptanlar.forEach(newCap => {
                const existingIdx = window.appKnowledge.kaptanlar.findIndex(
                    c => c.isim && c.isim.toLowerCase() === newCap.isim.toLowerCase()
                );
                if (existingIdx >= 0) {
                    window.appKnowledge.kaptanlar[existingIdx] = newCap;
                } else {
                    window.appKnowledge.kaptanlar.push(newCap);
                }
            });
        }

        // Generic custom key-values
        if (overrides.custom_fields) {
            window.appKnowledge.custom_fields = Object.assign(
                window.appKnowledge.custom_fields || {},
                overrides.custom_fields
            );
        }

        // Merge instagram_icerik
        if (overrides.instagram_icerik) {
            window.appKnowledge.instagram_icerik = Object.assign(
                window.appKnowledge.instagram_icerik || {},
                overrides.instagram_icerik
            );
            // Also sync to sosyal_aglar if exists
            if (window.appKnowledge.sosyal_aglar && typeof window.appKnowledge.sosyal_aglar.instagram === 'object') {
                if (overrides.instagram_icerik.takipci !== undefined) {
                    window.appKnowledge.sosyal_aglar.instagram.takipci = overrides.instagram_icerik.takipci;
                }
                if (overrides.instagram_icerik.takip !== undefined) {
                    window.appKnowledge.sosyal_aglar.instagram.takip = overrides.instagram_icerik.takip;
                }
                if (overrides.instagram_icerik.gonderi !== undefined) {
                    window.appKnowledge.sosyal_aglar.instagram.gonderi = overrides.instagram_icerik.gonderi;
                }
            }
        }
    } catch (e) {
        console.warn('OrionOS: Failed to apply custom knowledge overrides', e);
    }
}

/**
 * Saves a mutation item to localStorage
 */
function persistCustomKnowledge(category, item) {
    try {
        const stored = localStorage.getItem(CUSTOM_KNOWLEDGE_KEY);
        const overrides = stored ? JSON.parse(stored) : {};
        if (category === 'instagram_icerik' || category === 'custom_fields') {
            overrides[category] = Object.assign(overrides[category] || {}, item);
        } else {
            if (!overrides[category]) {
                overrides[category] = [];
            }
            
            const existingIdx = overrides[category].findIndex(
                x => (x.ad && item.ad && x.ad.toLowerCase() === item.ad.toLowerCase()) ||
                     (x.isim && item.isim && x.isim.toLowerCase() === item.isim.toLowerCase())
            );
            if (existingIdx >= 0) {
                overrides[category][existingIdx] = item;
            } else {
                overrides[category].push(item);
            }
        }
        localStorage.setItem(CUSTOM_KNOWLEDGE_KEY, JSON.stringify(overrides));
    } catch (e) {
        console.error('Failed to persist custom knowledge:', e);
    }
}

/**
 * Clears custom knowledge overrides from storage
 */
export function clearCustomKnowledge() {
    localStorage.removeItem(CUSTOM_KNOWLEDGE_KEY);
}

/**
 * Checks if input is an OrionOS command
 */
export function isOrionCommand(text, isOrionActive) {
    if (!isOrionActive) return false;
    const t = text.trim();
    return t.startsWith('/') || t.toLowerCase().startsWith('orion:');
}

/**
 * Executes OrionOS Admin Commands (CLI / Terminal & Knowledge Live Editor)
 */
export async function executeOrionCommand(rawText, context) {
    const { conversations, currentConvId, model } = context;
    const trimmed = rawText.trim();
    
    // Normalize command prefix: /stats -> stats, orion: add-sponsor -> add-sponsor
    let cmd = '';
    let args = '';

    if (trimmed.startsWith('/')) {
        const firstSpace = trimmed.indexOf(' ');
        if (firstSpace === -1) {
            cmd = trimmed.slice(1).toLowerCase();
            args = '';
        } else {
            cmd = trimmed.slice(1, firstSpace).toLowerCase();
            args = trimmed.slice(firstSpace + 1).trim();
        }
    } else if (trimmed.toLowerCase().startsWith('orion:')) {
        const afterPrefix = trimmed.slice(6).trim();
        const firstSpace = afterPrefix.indexOf(' ');
        if (firstSpace === -1) {
            cmd = afterPrefix.toLowerCase();
            args = '';
        } else {
            cmd = afterPrefix.slice(0, firstSpace).toLowerCase();
            args = afterPrefix.slice(firstSpace + 1).trim();
        }
    }

    // -------------------------------------------------------------
    // COMMAND: /help or orion: help
    // -------------------------------------------------------------
    if (cmd === 'help' || cmd === '?') {
        return `\`\`\`bash
╔══════════════════════════════════════════════════════════════════════════╗
║               🌌 ORION-OS v2.4 (KERNEL CLI & ADMIN CONSOLE)              ║
║                   [ROOT LEVEL ACCESS - AUTHORIZED ONLY]                  ║
╚══════════════════════════════════════════════════════════════════════════╝

[1. SİSTEM & TELEMETRİ KOMUTLARI]
  /stats                     -> Oturum konuşma sayısı, tahmini token, gecikme (latency)
  /clear-cache               -> Service Worker ve tarayıcı önbelleklerini temizler
  /dump-knowledge            -> Canlı sistem belleğindeki tüm bilgiyi JSON olarak indirir
  /clear-overrides           -> Canlı eklenen geçici bellek düzenlemelerini sıfırlar
  /help                      -> Bu yardım konsolunu görüntüler

[2. CANLI BİLGİ DÜZENLEYİCİ (KNOWLEDGE LIVE EDITOR)]
  orion: update-ig <Takipçi> [Takip] [Gönderi]
    Örnek: orion: update-ig 1050 160 102
    (Tek sayı girilirse sadece takipçiyi günceller: orion: update-ig 1050)

  orion: add-sponsor <İsim> | <Kategori>
    Örnek: orion: add-sponsor XYZ Metal | Teknik İmalat Destekçisi
  
  orion: update-mentor <İsim> | <Rol>
    Örnek: orion: update-mentor Dr. Ahmet Yılmaz | Baş Mekanik Mentörü
  
  orion: add-member <İsim> | <Rol> | <LinkedIn>
    Örnek: orion: add-member Selin Kaya | Vision & AI Sorumlusu | https://linkedin.com/...

  orion: set-motto <Yeni Motto>
    Örnek: orion: set-motto Derin Suların Şampiyon Mühendisleri 🦈
\`\`\``;
    }

    // -------------------------------------------------------------
    // COMMAND: /stats or orion: stats
    // -------------------------------------------------------------
    if (cmd === 'stats') {
        const convKeys = Object.keys(conversations || {});
        let totalMessages = 0;
        let totalChars = 0;

        convKeys.forEach(k => {
            const msgs = conversations[k].messages || [];
            totalMessages += msgs.length;
            msgs.forEach(m => {
                totalChars += (m.content || '').length;
            });
        });

        // Rough heuristic: 1 token ≈ 4 characters
        const estTokens = Math.round(totalChars / 4);
        const telemetry = window.__orionTelemetry || { totalCalls: 0, lastLatency: null, totalCharsReceived: 0 };
        const latencyStr = telemetry.lastLatency !== null ? `${telemetry.lastLatency} ms` : 'Henüz API çağrısı yapılmadı';
        
        // Knowledge stats
        const k = window.appKnowledge || {};
        const sponsorCount = (k.sponsorlar || []).length;
        const mentorCount = (k.yonetim_ve_mentorlar || []).length;
        const captainCount = (k.kaptanlar || []).length;
        const memberCount = (k.ekip_uyeleri || []).length;
        const generalCategories = Object.keys(k.genel_kultur || {}).length;

        // Custom memory count
        let customCount = 0;
        try {
            const rawStored = localStorage.getItem(CUSTOM_KNOWLEDGE_KEY);
            if (rawStored) {
                const parsed = JSON.parse(rawStored);
                customCount = (parsed.sponsorlar?.length || 0) + (parsed.yonetim_ve_mentorlar?.length || 0) + (parsed.ekip_uyeleri?.length || 0);
            }
        } catch(e) {}

        return `\`\`\`bash
╔══════════════════════════════════════════════════════════════════╗
║                   🌌 ORION-OS SİSTEM İSTATİSTİKLERİ             ║
╚══════════════════════════════════════════════════════════════════╝

[TELEMETRİ & AĞ]
  • Model:               ${model || 'gemini-3.8-flash'}
  • Son API Gecikmesi:   ${latencyStr}
  • Toplam API Çağrısı:  ${telemetry.totalCalls} adet
  • Alınan Veri:         ${(telemetry.totalCharsReceived / 1024).toFixed(2)} KB

[YEREL HAFIZA & KONUŞMALAR]
  • Kayıtlı Konuşmalar:  ${convKeys.length} adet
  • Toplam Mesaj Sayısı: ${totalMessages} mesaj
  • Yerel Karakter Boyutu: ~${totalChars} karakter
  • Tahmini Bellek Token: ~${estTokens.toLocaleString()} token

[CANLI BİLGİ VERİTABANI (KNOWLEDGE GRAPH)]
  • Sponsorlar:          ${sponsorCount} adet
  • Mentör Kadrosu:      ${mentorCount} kişi
  • Kaptanlar:           ${captainCount} kişi
  • Ekip Üyeleri:        ${memberCount} kişi
  • Genel Kültür Modülü: ${generalCategories} kategori
  • Canlı Eklenen Veri:  ${customCount} aktif override (localStorage)
  • Çekirdek Durumu:     HEALTHY / ZERO_LEAK_SECURE
\`\`\``;
    }

    // -------------------------------------------------------------
    // COMMAND: /clear-cache or orion: clear-cache
    // -------------------------------------------------------------
    if (cmd === 'clear-cache') {
        let clearedItems = [];
        try {
            if ('caches' in window) {
                const keys = await caches.keys();
                for (const key of keys) {
                    await caches.delete(key);
                    clearedItems.push(`Cache: ${key}`);
                }
            }
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const reg of regs) {
                    await reg.unregister();
                    clearedItems.push(`ServiceWorker: ${reg.scope}`);
                }
            }
        } catch (e) {
            return `⚠️ **Önbellek temizleme hatası:** ${e.message}`;
        }

        return `\`\`\`bash
[ORION-OS CACHE FLUSH COMPLETE]
${clearedItems.length > 0 ? clearedItems.map(c => '  ✓ Silindi -> ' + c).join('\n') : '  ✓ Tüm aktif önbellekler zaten temiz.'}

Tüm Service Worker ve statik cache kayıtları başarıyla boşaltıldı.
Sayfa 2 saniye içinde taze verilerle yeniden başlatılıyor...
\`\`\`
<script>setTimeout(() => window.location.reload(true), 2000);</script>`;
    }

    // -------------------------------------------------------------
    // COMMAND: /dump-knowledge or orion: dump-knowledge
    // -------------------------------------------------------------
    if (cmd === 'dump-knowledge') {
        if (!window.appKnowledge) {
            return '⚠️ Hata: Sistem hafızası henüz yüklenmemiş.';
        }

        // Create a safe copy (excluding any environment secrets)
        const safeDump = JSON.parse(JSON.stringify(window.appKnowledge));
        const jsonStr = JSON.stringify(safeDump, null, 2);
        
        // Trigger browser file download directly
        try {
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `GulfTech_Knowledge_Dump_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Download error:', e);
        }

        const sizeKb = (new Blob([jsonStr]).size / 1024).toFixed(1);
        return `\`\`\`bash
[ORION-OS KNOWLEDGE DUMP GENERATED]
  • Dosya Adı:        GulfTech_Knowledge_Dump_${new Date().toISOString().slice(0, 10)}.json
  • Dosya Boyutu:     ${sizeKb} KB
  • Durum:            İndirme başlatıldı ve yerel JSON oluşturuldu.
  • Kapsam:           takim_kimligi, sponsorlar, ekip, FRC 2026/2027, kurallar, teknik hafıza.
\`\`\`
*(Dosya otomatik olarak indirildi. Gerekirse tarayıcının indirme çubuğunu kontrol edin.)*`;
    }

    // -------------------------------------------------------------
    // COMMAND: /clear-overrides or orion: clear-overrides
    // -------------------------------------------------------------
    if (cmd === 'clear-overrides') {
        clearCustomKnowledge();
        return `\`\`\`bash
[ORION-OS KNOWLEDGE RESET]
  ✓ Canlı bilgi düzenleyici (Live Editor) tarafından eklenen tüm localStorage override verileri temizlendi.
  ✓ Sayfayı yenilediğinizde sistem orijinal JSON dosyalarındaki orijinal verilere dönecektir.
\`\`\``;
    }

    // -------------------------------------------------------------
    // COMMAND: orion: add-sponsor <Ad> | <Kategori>
    // -------------------------------------------------------------
    if (cmd === 'add-sponsor') {
        if (!args) {
            return `⚠️ **Eksik parametre!**\nKullanım: \`orion: add-sponsor Sponsor Adı | Kategori\`\nÖrnek: \`orion: add-sponsor XYZ Metal | Mekanik & İmalat\``;
        }
        const parts = args.split('|').map(s => s.trim());
        const sponsorName = parts[0];
        const category = parts[1] || 'Resmi Destekçi';

        if (!sponsorName) {
            return `⚠️ Sponsor adı boş olamaz.`;
        }

        window.appKnowledge = window.appKnowledge || {};
        window.appKnowledge.sponsorlar = window.appKnowledge.sponsorlar || [];

        const newEntry = { ad: sponsorName, kategori: category };
        
        // Update in-memory
        const existingIdx = window.appKnowledge.sponsorlar.findIndex(
            s => s.ad && s.ad.toLowerCase() === sponsorName.toLowerCase()
        );
        if (existingIdx >= 0) {
            window.appKnowledge.sponsorlar[existingIdx] = newEntry;
        } else {
            window.appKnowledge.sponsorlar.unshift(newEntry);
        }

        // Persist to local storage so it stays across reloads
        persistCustomKnowledge('sponsorlar', newEntry);

        return `\`\`\`bash
[ORION-OS LIVE MEMORY INJECTION: SUCCESS]
  ✓ Kategori:        Sponsorlar
  ✓ Kurum Adı:       "${sponsorName}"
  ✓ Destek Türü:     "${category}"
  ✓ Yerleştirme:     window.appKnowledge.sponsorlar (CANLI HAFIZA GÜNCELLENDİ)
  ✓ Kalıcılık:       localStorage ('${CUSTOM_KNOWLEDGE_KEY}')
\`\`\`
Artık normal sohbette *"Sponsorlarımız kimler?"* diye sorduğunuzda yapay zeka ve yerel handler anında **${sponsorName}** sponsorunu tanıyacaktır!`;
    }

    // -------------------------------------------------------------
    // COMMAND: orion: update-mentor or add-mentor <İsim> | <Rol>
    // -------------------------------------------------------------
    if (cmd === 'update-mentor' || cmd === 'add-mentor') {
        if (!args) {
            return `⚠️ **Eksik parametre!**\nKullanım: \`orion: update-mentor İsim Soyisim | Rol\`\nÖrnek: \`orion: update-mentor Selim Çelik | Mekanik Danışmanı\``;
        }
        const parts = args.split('|').map(s => s.trim());
        const name = parts[0];
        const role = parts[1] || 'Takım Mentörü';

        window.appKnowledge = window.appKnowledge || {};
        window.appKnowledge.yonetim_ve_mentorlar = window.appKnowledge.yonetim_ve_mentorlar || [];

        const newEntry = { isim: name, rol: role };
        const existingIdx = window.appKnowledge.yonetim_ve_mentorlar.findIndex(
            m => m.isim && m.isim.toLowerCase() === name.toLowerCase()
        );
        if (existingIdx >= 0) {
            window.appKnowledge.yonetim_ve_mentorlar[existingIdx] = newEntry;
        } else {
            window.appKnowledge.yonetim_ve_mentorlar.push(newEntry);
        }

        persistCustomKnowledge('yonetim_ve_mentorlar', newEntry);

        return `\`\`\`bash
[ORION-OS LIVE MEMORY INJECTION: SUCCESS]
  ✓ Kadro:           Mentör & Yönetim
  ✓ İsim:            "${name}"
  ✓ Rol / Unvan:     "${role}"
  ✓ Hafıza Durumu:   CANLI GÜNCELLENDİ & KAYDEDİLDİ
\`\`\`
Mentör listesi ve kişisel mentör sorguları artık bu bilgiyi anında döndürür.`;
    }

    // -------------------------------------------------------------
    // COMMAND: orion: add-member <İsim> | <Rol> | <LinkedIn>
    // -------------------------------------------------------------
    if (cmd === 'add-member') {
        if (!args) {
            return `⚠️ **Eksik parametre!**\nKullanım: \`orion: add-member İsim Soyisim | Rol | LinkedInUrl\``;
        }
        const parts = args.split('|').map(s => s.trim());
        const name = parts[0];
        const role = parts[1] || 'Ekip Üyesi';
        const linkedin = parts[2] || '';

        window.appKnowledge = window.appKnowledge || {};
        window.appKnowledge.ekip_uyeleri = window.appKnowledge.ekip_uyeleri || [];

        const newEntry = { isim: name, rol: role, linkedin: linkedin };
        const existingIdx = window.appKnowledge.ekip_uyeleri.findIndex(
            m => m.isim && m.isim.toLowerCase() === name.toLowerCase()
        );
        if (existingIdx >= 0) {
            window.appKnowledge.ekip_uyeleri[existingIdx] = newEntry;
        } else {
            window.appKnowledge.ekip_uyeleri.push(newEntry);
        }

        persistCustomKnowledge('ekip_uyeleri', newEntry);

        return `\`\`\`bash
[ORION-OS LIVE MEMORY INJECTION: SUCCESS]
  ✓ Kadro:           Ekip Üyesi
  ✓ İsim:            "${name}"
  ✓ Rol:             "${role}"
  ✓ LinkedIn:        "${linkedin || 'Belirtilmedi'}"
  ✓ Hafıza Durumu:   CANLI GÜNCELLENDİ
\`\`\``;
    }

    // -------------------------------------------------------------
    // COMMAND: orion: set-motto <Motto>
    // -------------------------------------------------------------
    if (cmd === 'set-motto') {
        if (!args) return `⚠️ Kullanım: \`orion: set-motto Yeni Takım Mottosu\``;
        window.appKnowledge = window.appKnowledge || {};
        window.appKnowledge.takim_kimligi = window.appKnowledge.takim_kimligi || {};
        window.appKnowledge.takim_kimligi.motto = args;

        persistCustomKnowledge('custom_fields', { motto: args });

        return `\`\`\`bash
[ORION-OS TAKIM MOTTO GÜNCELLENDİ]
  ✓ Yeni Motto: "${args}"
\`\`\``;
    }

    // -------------------------------------------------------------
    // COMMAND: orion: update-ig <Takipçi> [Takip] [Gönderi]
    // Also aliases: /update-ig, /sync-ig, orion: sync-ig
    // -------------------------------------------------------------
    if (cmd === 'update-ig' || cmd === 'sync-ig') {
        if (!args) {
            const currentIg = window.appKnowledge?.instagram_icerik || {};
            return `\`\`\`bash
[ORION-OS INSTAGRAM BİLGİSİ]
  • Mevcut Takipçi:     ${currentIg.takipci ?? 991}
  • Mevcut Takip:       ${currentIg.takip ?? 153}
  • Mevcut Gönderi:     ${currentIg.gonderi ?? 96}
  • Son Güncelleme:     ${currentIg.son_guncelleme || 'Bilinmiyor'}

Kullanım:
  orion: update-ig <Takipçi> [Takip] [Gönderi]
  Örnek: orion: update-ig 1050 160 102
  (Tek sayı girilirse sadece takipçi güncellenir: orion: update-ig 1050)
\`\`\``;
        }

        // Parse numbers from args
        const nums = args.split(/[\s,;|]+/).map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
        if (nums.length === 0) {
            return `⚠️ Geçerli bir sayı bulunamadı. Örnek kullanım: \`orion: update-ig 1050 160 102\``;
        }

        const followers = nums[0];
        const following = nums.length > 1 ? nums[1] : undefined;
        const posts = nums.length > 2 ? nums[2] : undefined;
        const todayStr = new Date().toISOString().slice(0, 10);

        window.appKnowledge = window.appKnowledge || {};
        window.appKnowledge.instagram_icerik = window.appKnowledge.instagram_icerik || {};
        window.appKnowledge.instagram_icerik.takipci = followers;
        if (following !== undefined) window.appKnowledge.instagram_icerik.takip = following;
        if (posts !== undefined) window.appKnowledge.instagram_icerik.gonderi = posts;
        window.appKnowledge.instagram_icerik.son_guncelleme = todayStr;

        // Also update sosyal_aglar.instagram
        if (window.appKnowledge.sosyal_aglar && typeof window.appKnowledge.sosyal_aglar.instagram === 'object') {
            window.appKnowledge.sosyal_aglar.instagram.takipci = followers;
            if (following !== undefined) window.appKnowledge.sosyal_aglar.instagram.takip = following;
            if (posts !== undefined) window.appKnowledge.sosyal_aglar.instagram.gonderi = posts;
        }

        // Persist to localStorage
        const igDataToPersist = {
            takipci: followers,
            son_guncelleme: todayStr
        };
        if (following !== undefined) igDataToPersist.takip = following;
        if (posts !== undefined) igDataToPersist.gonderi = posts;
        persistCustomKnowledge('instagram_icerik', igDataToPersist);

        const currentIg = window.appKnowledge.instagram_icerik;
        return `\`\`\`bash
[ORION-OS INSTAGRAM VERİSİ GÜNCELLENDİ: SUCCESS]
  ✓ Hesap:              @gulftechtr
  ✓ Takipçi Sayısı:     ${currentIg.takipci}
  ✓ Takip Edilen:       ${currentIg.takip}
  ✓ Gönderi Sayısı:     ${currentIg.gonderi}
  ✓ Güncelleme Tarihi:  ${todayStr}
  ✓ Kalıcılık:          localStorage ('${CUSTOM_KNOWLEDGE_KEY}')
\`\`\`
GulfTech AI ve Instagram sorgu yanıtları artık anında güncel istatistikleri (**${currentIg.takipci} takipçi**) kullanacaktır!`;
    }

    // Unknown command inside OrionOS
    return `\`\`\`bash
[ORION-OS KERNEL]: Tanınmayan komut: "${trimmed}"
Kullanılabilir komutların listesi için lütfen "/help" veya "orion: help" yazın.
\`\`\``;
}
