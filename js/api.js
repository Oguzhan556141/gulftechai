import { delay } from './utils.js';

export async function callGeminiAPI(userMessage, history, apiKey, model, data) {
    const currentYear = new Date().getFullYear();
    const systemPrompt = `Sen GulfTech AI'sın — FRC Takımı #11392 için geliştirilmiş bir yapay zeka asistanısın. Şu an ${currentYear} yılındayız.
    
Dinamik Veriler:
${JSON.stringify(data, null, 2)}

KRİTİK KURALLAR:
1. Sadece sorulan branş/konu hakkında cevap ver. Sormadıkça diğer branşları karıştırma.
2. "Yazılım ekibini anlat" denince SADECE yazılım ekibini yaz, diğerlerini katma.
3. Türkçe/İngilizce yanıt ver, samimi ol, 🦈 kullan.
4. Markdown formatı kullan.`;

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

export async function simulateResponse(userMessage, data) {
    const msg = userMessage.toLowerCase();
    const { team, frc2026, regionals, awards } = data;

    if (/takım.*tanıt|ekib.*tanıt|tüm üyeler|kimler var|kadro/i.test(msg)) {
        await delay(1200);
        return `### 🦈 GulfTech Departmanları\n\n` +
            `**🎓 Baş Mentor:** ${team.departments.mentor}\n\n` +
            `**🔱 Kaptanlar:** ${team.departments.captains}\n\n` +
            `**💻 Yazılım:** ${team.departments.software.captain}, ${team.departments.software.members.join(', ')}\n\n` +
            `**⚙️ Mekanik:** ${team.departments.mechanical.captain}, ${team.departments.mechanical.members.join(', ')}\n\n` +
            `**🎨 PR:** ${team.departments.pr.captain}, ${team.departments.pr.members.join(', ')}\n\n` +
            `**📐 Tasarım:** ${team.departments.design.members.join(', ')}\n\n` +
            `**⚡ Elektronik:** ${team.departments.electronics.description}\n\n` +
            `2026 **REBUILT** sezonunda hep birlikte sahaya çıkıyoruz! 🚀`;
    }

    if (/yazılım|software|kod/i.test(msg) && !/takım|tüm|hep/i.test(msg)) {
        await delay(800);
        return `### 💻 Yazılım Ekibi\n- ${team.departments.software.captain} (Kaptan)\n- ${team.departments.software.members.join('\n- ')}\n\nJava/WPILib, PathPlanner otonom ve Command-based programming kullanıyoruz. 🤖`;
    }
    
    // ... add more simulated logic based on data object
    if (/bölge|regional|turnuva|takvim|ne zaman/i.test(msg)) {
        await delay(1000);
        let table = `### 📍 2026 Türkiye Regionalleri\n\n| Turnuva | Tarih | Konum |\n|---------|-------|-------|\n`;
        regionals.forEach(r => {
            const dateStr = new Date(r.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
            table += `| ${r.name} | ${dateStr} | ${r.location} |\n`;
        });
        return table + `\n Tüm turnuvalara giriş **ücretsizdir**. Ziyaret saatleri: 10:00 – 18:00. 🦈🏟️`;
    }

    if (/ödül|award/i.test(msg)) {
        await delay(1000);
        let list = `### 🏆 FRC Ödülleri\n\n`;
        awards.forEach(a => { list += `- **${a.name}:** ${a.desc}\n`; });
        return list + `\nBiz GulfTech olarak ilk sezonumuzda **Rookie All-Star** ödülünü hedefliyoruz! 🦈🏆`;
    }

    // History
    if (/tarih|geçmiş|hikaye|ne zaman kuruldu|kuruluş/i.test(msg)) {
        await delay(1000);
        return `### 📖 Tarihçemiz\n\n${team.history}\n\nTakımımızı sosyal medyada takip etmeyi unutmayın: 
- [Instagram](${team.social.instagram})
- [YouTube](${team.social.youtube})
- [Web Sitesi](${team.social.website})
\n🦈✨`;
    }

    // Contact / Social
    if (/iletişim|ulaş|sosyal|medya|instagram|link/i.test(msg)) {
        await delay(800);
        return `### 🔗 Sosyal Medya & İletişim\n\nBize her zaman ulaşabilirsiniz:\n- 📸 **Instagram:** [gulftechtr](${team.social.instagram})\n- 📺 **YouTube:** [@gulftechtr](${team.social.youtube})\n- 🌐 **Web:** [gulftechrobotic.com.tr](${team.social.website})\n\nBizimle "The Blue Wave" dalgasına katılın! 🦈🚀`;
    }

    await delay(1000);
    return `Anlıyorum! 🦈 Sana şu konularda yardımcı olabilirim:\n- 🏗️ FRC 2026 REBUILT kuralları\n- 🏆 FRC ödülleri\n- 📍 Turnuva takvimi\n- 🦈 GulfTech takım bilgileri\n- 💻 Yazılım / ⚙️ Mekanik / 🎨 PR / 📐 Tasarım ekipleri\n\nHangi konuda yardımcı olayım? ✨`;
}
