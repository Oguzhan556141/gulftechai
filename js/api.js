import { delay } from './utils.js';

export async function callGeminiAPI(userMessage, history, apiKey, model, data, knowledge) {
    const currentYear = new Date().getFullYear();
    const systemPrompt = `Sen GulfTech AI'sın.
    
Grup Hafızan (knowledge.json):
${JSON.stringify(knowledge, null, 2)}

Dinamik Veriler (data.json):
${JSON.stringify(data, null, 2)}

KRİTİK KURALLAR:
1. Sadece sorulan branş/konu hakkında detaylı cevap ver.
2. Bilgileri gruplandır (Headerlar ve listeler kullan).
3. "The Blue Wave" ruhunu ve FLL'den gelen 5 yıllık mirasını vurgula.
4. Övgü ve iyi dilekleri (başarılar, tebrikler vb.) Mavi Dalga ruhuyla, nazikçe ve minnettarlıkla karşıla.
5. Türkçe/İngilizce samimi bir dil kullan, 🦈 kullan.`;

    const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: contents,
        generationConfig: { temperature: 0.8, topP: 0.95, maxOutputTokens: 2048 }
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

    const resData = await res.json();
    return resData.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function simulateResponse(userMessage, data, knowledge) {
    const msg = userMessage.toLowerCase();

    // Safety check for knowledge object
    if (!knowledge || !knowledge.takim_kimligi) {
        return "Üzgünüm, şu an hafızamda bir sorun var. Lütfen sayfayı yenilemeyi dene! 🦈🌊";
    }

    const k = knowledge.takim_kimligi;
    const th = knowledge.teknik_hafiza || {};
    const yh = knowledge.yarisma_hafizasi || {};

    // 1. Takım Kadrosu
    if (/takım.*tanıt|ekib.*tanıt|tüm üyeler|kimler var|kadro/i.test(msg)) {
        await delay(1200);

        // Safety check for roster info
        const ym = k.yonetim_ve_mentorlar || {};
        const captains = k.kaptanlar || [];
        const members = k.ekip_uyeleri || [];

        return `### 🔱 ${k.isim || 'GulfTech'} — ${k.motto || 'The Blue Wave'}\n\n` +
            `**🦈 Takım Kadromuz:**\n` +
            `- **Mentor:** ${ym.takim_mentoru || 'Ensar İnce'}\n` +
            `- **Danışman Öğretmen:** ${ym.ogretmen_ve_danisman || 'Ümran Hoca'}\n\n` +
            `**⭐ Kaptanlarımız:**\n` +
            captains.map(c => `- **${c.isim}**: ${c.rol}`).join('\n') + `\n\n` +
            `**👥 Ekibimiz:**\n` +
            members.map(m => `- **${m.isim}**: ${m.rol}`).join('\n') + `\n\n` +
            `*${k.miras || ''}* 🌊`;
    }

    // 1.5. Divizyonlar
    if (/divizyon|departman|bölüm|pr|mekanik|elektronik|yazılım|tasarım/i.test(msg)) {
        await delay(1000);
        const divizyonlar = k.divizyonlar || {};
        let divText = `### ⚙️ Takım Divizyonlarımız\n\n`;
        for (const [ad, aciklama] of Object.entries(divizyonlar)) {
            divText += `- **${ad}:** ${aciklama}\n`;
        }
        return divText + `\nHer divizyon, "The Blue Wave" inançlarımızı gerçeğe dönüştürmek için birlikte çalışır! 🦈`;
    }

    // Individual Member Queries
    const ym = k.yonetim_ve_mentorlar || {};
    const captains = k.kaptanlar || [];
    const members = k.ekip_uyeleri || [];

    // Check mentors
    if (msg.includes('ensar') || msg.includes('ince')) {
        return `**Ensar İnce**, GulfTech #11392 takımımızın değerli **Takım Mentoru**'dur. 🦈 Takımımıza teknik ve stratejik konularda rehberlik etmektedir.`;
    }
    if (msg.includes('ümran') || msg.includes('umran') || msg.includes('kayaoğlu')) {
        return `**Ümran Kayaoğlu**, GulfTech #11392 takımımızın **Danışman Öğretmenidir**. 🌊 Takımımızın kurumsal ve eğitim süreçlerinde yanımızda yer almaktadır.`;
    }

    // Check captains & members with partial matching
    const allPartners = [
        ...captains.map(c => ({ name: c.isim, role: c.rol, type: 'captain' })),
        ...members.map(m => ({ name: m.isim, role: m.rol, type: 'member' }))
    ];

    for (const p of allPartners) {
        if (!p.name) continue;
        const firstName = p.name.split(' ')[0].toLowerCase();
        if (msg.includes(p.name.toLowerCase()) || (msg.length < 20 && msg.includes(firstName))) {
            const flavor = p.type === 'captain'
                ? `🦈 Mavi Dalga ruhuyla ekibimize liderlik etmektedir!`
                : `🌊 Takımımızın hedeflerine ulaşmasında aktif rol oynamaktadır.`;
            return `**${p.name}**, GulfTech #11392 takımımızda **${p.role}** görevini üstlenmektedir. ${flavor}`;
        }
    }

    // 2. Tarihçe & Logo
    if (/geşmiş|tarih|mavi dalga|blue wave|neden|logo/i.test(msg)) {
        await delay(1000);
        const la = k.logo_anlami || {};
        return `### 🌊 The Blue Wave Hikayesi\n\n${k.miras || ''}\n\n**Logo Anlamı:**\n` +
            `- 🦈 **Köpek Balığı:** ${la.kopek_baligi || ''}\n` +
            `- 💙 **Mavi:** ${la.mavi_tonlari || ''}\n` +
            `- 💛 **Sarı:** ${la.sari_tonlar || ''}\n\n` +
            `Bizim için FRC yalnızca bir yarışma değil, teknik ve sosyal bir gelişim yolculuğudur. 🚀`;
    }

    // 3. Teknik Hafıza
    if (/teknik|yazılım|donanım|scout|robot/i.test(msg)) {
        await delay(1000);
        return `### ⚙️ Teknik Altyapımız\n\n` +
            `- **Yazılım:** ${th.yazilim_stack || 'Java'}\n` +
            `- **Donanım:** ${th.donanim || 'RoboRIO 2.0'}\n` +
            `- **Strateji:** ${th.strateji || ''}\n` +
            `- **Scout:** ${th.scout_sistemi || ''}\n\n` +
            `Her maçta "The Blue Wave" fırtınası estirmeye hazırız! 🦈🖥️`;
    }

    // 4. Turnuva Takvimi
    if (/bölge|turnuva|takvim|ne zaman/i.test(msg)) {
        await delay(1000);
        let table = `### 📍 ${yh.sezon || '2026'} Takvimi\n\n| Turnuva | Tarih | Mekan |\n|---------|-------|-------|\n`;
        const list = yh.bolgesel_turnuvalar || [];
        list.forEach(r => {
            table += `| ${r.ad} | ${r.tarih} | ${r.mekan} |\n`;
        });
        const goals = yh.hedefler ? yh.hedefler.join(', ') : '';
        return table + `\n\nHedeflerimiz: **${goals}** 🦈🏆`;
    }

    // 5. İletişim & Sosyal Medya
    if (/iletişim|sosyal|medya|instagram|site|link/i.test(msg)) {
        await delay(800);
        const sa = k.sosyal_aglar || {};
        return `### 🔗 GulfTech'e Ulaşın\n\n- 📸 [Instagram](${sa.instagram || ''})\n- 📺 [YouTube](${sa.youtube || ''})\n- 🌐 [Web Sitesi](${sa.website || ''})\n\nKocaeli'den yükselen teknoloji dalgasına katılın! 🦈🚀`;
    }

    // 6. Sponsorlar
    if (/sponsor/i.test(msg)) {
        await delay(1000);
        const sponsors = k.sponsorlar || [];
        return `### 🤝 Destekçilerimiz (Sponsorlar)\n\nGulfTech #11392 olarak yolculuğumuza destek olan değerli kurumlar:\n\n` +
            sponsors.map(s => `- **${s.ad}**: ${s.kategori}`).join('\n') +
            `\n\nBirlikte daha güçlüyüz! 🌊🚀`;
    }

    // 7. 2026 Sezon Detayları
    if (/2026|rebuilt|oyun|maç/i.test(msg)) {
        await delay(1200);
        const scoring = yh.puanlama || [];
        return `### 🏗️ FRC 2026: REBUILT\n\n${yh.oyun_ozeti || ''}\n\n**🎯 Puanlama Anahtarı:**\n` +
            scoring.map(p => `- ${p}`).join('\n') +
            `\n\nBu sezon robotumuzu "REBUILT" görevini en verimli şekilde tamamlayacak şekilde optimize ediyoruz! 🦈🔋`;
    }

    // 8. Övgü & Tebrik
    if (/başarılar|tebrik|helal|harika|güzel|iyi şanslar|maşallah/i.test(msg)) {
        await delay(800);
        return `### 🌊 Çok Teşekkürler! 🦈\n\nBu güzel dileklerin ve desteğin bizim için çok değerli. **#GulfTechFamily** desteğiyle ${yh.sezon || ''} sezonuna ve "REBUILT" görevine son hızla hazırlanıyoruz! 🛠️💪\n\nBirlikte "Mavi Dalga"yı en yükseğe taşıyacağız! 🌊🚀`;
    }

    await delay(1000);
    return `Anlıyorum! 🦈 Sana şu konularda yardımcı olabilirim:\n- 📖 Takım Tarihçesi & "The Blue Wave" hikayesi\n- 👥 Takım Kadrosu & Mentorlar\n- ⚙️ Teknik Altyapı (Yazılım/Donanım)\n- 🤝 Sponsorlarımız\n- 🏗️ 2026 REBUILT Sezon Detayları\n- 📍 Turnuva Takvimi\n\nHangi konuda bilgi istersin? ✨`;
}
