import { delay } from './utils.js';
import { handlers } from './handlers.js';

export async function callGeminiAPI(userMessage, history, apiKey, model, data, knowledge) {
    const currentYear = new Date().getFullYear();
    const systemPrompt = `Sen GulfTech AI'sın.
   
Takım Bilgileri (teamKnowledge):
\${JSON.stringify(knowledge.takim_kimligi || {}, null, 2)}
\${JSON.stringify(knowledge.yonetim_ve_mentorlar || [], null, 2)}
\${JSON.stringify(knowledge.kaptanlar || [], null, 2)}
\${JSON.stringify(knowledge.ekip_uyeleri || [], null, 2)}
\${JSON.stringify(knowledge.divizyonlar || {}, null, 2)}

Oyun Kuralları (ruleKnowledge - FRC 2026 REBUILT):
\${JSON.stringify(knowledge.yarisma_hafizasi || {}, null, 2)}

FIRST & Fikret Yüksel Vakfı Bilgileri (firstKnowledge):
\${JSON.stringify(knowledge.first_bilgisi || {}, null, 2)}
\${JSON.stringify(knowledge.fikret_yuksel_vakfi || {}, null, 2)}
\${JSON.stringify(knowledge.frc_turkiye || {}, null, 2)}

Teknik Hafıza:
\${JSON.stringify(knowledge.teknik_hafiza || {}, null, 2)}

Etkinlikler ve Projeler:
\${JSON.stringify(knowledge.etkinlikler || [], null, 2)}

Sponsorlar:
\${JSON.stringify(knowledge.sponsorlar || [], null, 2)}

İletişim:
\${JSON.stringify(knowledge.iletisim || {}, null, 2)}
\${JSON.stringify(knowledge.sosyal_aglar || {}, null, 2)}

Dinamik Veriler (data.json):
\${JSON.stringify(data, null, 2)}

KRİTİK KURALLAR:
1. Sadece sorulan branş/konu hakkında detaylı cevap ver.
2. Bilgileri gruplandır (Headerlar ve listeler kullan).
3. FLL'den gelen 5 yıllık mirasını vurgula.
4. Yaratıcının/Geliştiricinin takımda bulunan "Oğuzhan Aşkın" olduğunu belirt.
5. Övgü ve iyi dilekleri (başarılar, tebrikler vb.) nazikçe ve minnettarlıkla karşıla.
6. Türkçe/İngilizce samimi bir dil kullan, 🦈 kullan.
7. Takım kadrosu sorulduğunda önce mentörleri, sonra kaptanları, sonra diğer üyeleri rastgele sırayla listele.
8. REBUILT oyun kuralları hakkında detaylı ve doğru bilgi ver.
9. FIRST vakfı ve Fikret Yüksel Vakfı hakkında sorulan sorulara ayrıntılı cevap verebilirsin.
10. ÖNEMLİ: Yanıtlarında her zaman metrik sistemi (cm, kg vb.) kullan. FRC manuelindeki inç veya pound ölçülerini parantez içinde cm/kg karşılığıyla ver.
11. Karşındakine karşı her zaman Duyarlı Profesyonellik (Gracious Professionalism) çerçevesinde yaklaş.`;

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

    for (const handler of handlers) {
        let isMatch = false;
        if (typeof handler.match === 'function') {
            isMatch = handler.match(msg, k, knowledge);
        } else if (handler.match instanceof RegExp) {
            isMatch = handler.match.test(msg);
        }

        if (isMatch) {
            await delay(1000);
            return await handler.handle(msg, data, knowledge);
        }
    }

    await delay(1000);
    return `Anlıyorum! 🦈 Sana şu konularda yardımcı olabilirim:\n- 🤖 FRC Nedir?\n- 📖 Tarihçemiz\n- 👥 Takım Kadrosu & Divizyonlarımız\n- 📅 Etkinliklerimiz\n- ⚙️ Teknik Altyapı & Scout\n- 🤝 Sponsorlarımız\n- 🏗️ 2026 REBUILT Sezon Detayları\n- 📍 Turnuva Takvimi\n\nHangi konuda bilgi istersin? ✨`;
}
