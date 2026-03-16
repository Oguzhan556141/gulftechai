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
4. Türkçe/İngilizce samimi bir dil kullan, 🦈 kullan.`;

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
    const { team, regionals } = data;
    const { takim_kimligi, teknik_hafiza, yarisma_hafizasi, sosyal_aglar } = knowledge;

    if (/takım.*tanıt|ekib.*tanıt|tüm üyeler|kimler var|kadro/i.test(msg)) {
        await delay(1200);
        return `### 🔱 ${takim_kimligi.isim} — ${takim_kimligi.motto}\n\n` +
            `**📖 Vizyonumuz:** ${takim_kimligi.vizyon}\n\n` +
            `**🏛️ Kurum:** ${takim_kimligi.kurum}\n\n` +
            `**🦈 Takım Yapısı:**\n` +
            `- **Mentor:** ${team.departments.mentor}\n` +
            `- **Kaptanlar:** ${team.departments.captains}\n` +
            `- **Yazılım:** ${team.departments.software.captain}\n` +
            `- **Mekanik:** ${team.departments.mechanical.captain}\n\n` +
            `*${takim_kimligi.miras}* ⚡`;
    }

    if (/geşmiş|tarih|mavi dalga|blue wave|neden/i.test(msg)) {
        await delay(1000);
        return `### 🌊 The Blue Wave Hikayesi\n\n${takim_kimligi.miras}\n\n**Logo Anlamı:**\n` +
            `- 🦈 **Köpek Balığı:** ${takim_kimligi.logo_anlami.kopek_baligi}\n` +
            `- 💙 **Mavi:** ${takim_kimligi.logo_anlami.mavi_tonlari}\n` +
            `- 💛 **Sarı:** ${takim_kimligi.logo_anlami.sari_tonlar}\n\n` +
            `Bizim için FRC yalnızca bir yarışma değil, teknik ve sosyal bir gelişim yolculuğudur. 🚀`;
    }

    if (/teknik|yazılım|donanım|scout|robot/i.test(msg)) {
        await delay(1000);
        return `### ⚙️ Teknik Altyapımız\n\n` +
            `- **Yazılım:** ${teknik_hafiza.yazilim_stack}\n` +
            `- **Donanım:** ${teknik_hafiza.donanim}\n` +
            `- **Strateji:** ${teknik_hafiza.strateji}\n` +
            `- **Scout:** ${teknik_hafiza.scout_sistemi}\n\n` +
            `Her maçta "The Blue Wave" fırtınası estirmeye hazırız! 🦈🖥️`;
    }
    
    if (/bölge|regional|turnuva|takvim|ne zaman/i.test(msg)) {
        await delay(1000);
        let table = `### 📍 ${yarisma_hafizasi.sezon} Takvimi\n\n| Turnuva | Tarih | Mekan |\n|---------|-------|-------|\n`;
        yarisma_hafizasi.bolgesel_turnuvalar.forEach(r => {
            table += `| ${r.ad} | ${r.tarih} | ${r.mekan} |\n`;
        });
        return table + `\n\nHedeflerimiz: **${yarisma_hafizasi.hedefler.join(', ')}** 🦈🏆`;
    }

    if (/iletişim|sosyal|medya|instagram|site|link/i.test(msg)) {
        await delay(800);
        return `### 🔗 GulfTech'e Ulaşın\n\n- 📸 [Instagram](${sosyal_aglar.instagram})\n- 📺 [YouTube](${sosyal_aglar.youtube})\n- 🌐 [Web Sitesi](${sosyal_aglar.website})\n\nKocaeli'den yükselen teknoloji dalgasına katılın! 🦈🚀`;
    }

    await delay(1000);
    return `Anlıyorum! 🦈 Sana şu konularda yardımcı olabilirim:\n- 📖 Takım Tarihçesi & "The Blue Wave" hikayesi\n- ⚙️ Teknik Altyapı (Yazılım/Donanım)\n- 📍 2026 Turnuva Takvimi\n- 🏆 Sezon Hedefleri\n\nHangi konuda bilgi istersin? ✨`;
}
