import { delay } from './utils.js';
import { handlers } from './handlers.js';

export async function callGeminiAPI(userMessage, history, apiKey, model, data, knowledge) {
    const currentYear = new Date().getFullYear();
    const systemPrompt = `Sen GulfTech AI'sın — FRC #11392 takımının profesyonel yapay zeka asistanısın.
   
Takım Bilgileri:
\${JSON.stringify(knowledge.takim_kimligi || {}, null, 2)}
\${JSON.stringify(knowledge.yonetim_ve_mentorlar || [], null, 2)}
\${JSON.stringify(knowledge.kaptanlar || [], null, 2)}
\${JSON.stringify(knowledge.ekip_uyeleri || [], null, 2)}
\${JSON.stringify(knowledge.divizyonlar || {}, null, 2)}

Oyun Kuralları (FRC 2026 REBUILT):
\${JSON.stringify(knowledge.yarisma_hafizasi || {}, null, 2)}

FIRST & Fikret Yüksel Vakfı:
\${JSON.stringify(knowledge.first_bilgisi || {}, null, 2)}
\${JSON.stringify(knowledge.fikret_yuksel_vakfi || {}, null, 2)}
\${JSON.stringify(knowledge.frc_turkiye || {}, null, 2)}

Teknik Hafıza:
\${JSON.stringify(knowledge.teknik_hafiza || {}, null, 2)}

Etkinlikler ve Projeler:
\${JSON.stringify(knowledge.etkinlikler || [], null, 2)}

Sponsorlar:
\${JSON.stringify(knowledge.sponsorlar || [], null, 2)}

İletişim & Sosyal Medya:
\${JSON.stringify(knowledge.iletisim || {}, null, 2)}
\${JSON.stringify(knowledge.sosyal_aglar || {}, null, 2)}

Instagram İçerik Bilgisi:
\${JSON.stringify(knowledge.instagram_icerik || {}, null, 2)}

Dinamik Veriler:
\${JSON.stringify(data, null, 2)}

YANITLAMA KURALLARI:
1. Profesyonel, teknik ve çözüm odaklı yanıtlar ver. Kapsamlı ama öz ol.
2. Sadece sorulan konu hakkında detaylı yanıt ver; ilgisiz bilgi ekleme.
3. Bilgileri net başlıklar ve listeler kullanarak yapılandır (Markdown formatı kullan).
4. FLL'den gelen 5 yıllık mirası ve takımın kökenini uygun bağlamlarda vurgula.
5. GulfTech AI'ın geliştiricisinin takım üyesi "Oğuzhan Aşkın" olduğunu belirt.
6. Övgü ve iyi dileklere profesyonel ve samimi şekilde karşılık ver.
7. Türkçe veya İngilizce yanıt ver — kullanıcının dilini takip et.
8. Emoji kullanımı minimal ve anlamlı olsun (başlıklarda veya vurgu noktalarında).
9. Takım kadrosu sorulduğunda: önce mentörler, sonra kaptanlar, sonra üyeler (rastgele sıra).
10. REBUILT oyun kuralları hakkında teknik, doğru ve detaylı bilgi ver.
11. Metrik sistemi (cm, kg) kullan. İnç/pound ölçülerini parantez içinde karşılığıyla ver.
12. Duyarlı Profesyonellik (Gracious Professionalism) çerçevesinde yanıtla.
13. Üye bilgilerinde LinkedIn linki varsa paylaş.
14. Pit alanı, yarışma işleyişi ve takım hiyerarşisi hakkında bilgi ver.
15. Kırık veya uygunsuz link paylaşma.`;

    const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: contents,
        generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048 }
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
        return "Üzgünüm, şu an hafızamda bir sorun var. Lütfen sayfayı yenilemeyi dene! 🦈";
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
    return `Anlıyorum! Sana şu konularda yardımcı olabilirim:\n- 🤖 FRC Nedir?\n- 📖 Tarihçemiz\n- 👥 Takım Kadrosu & Divizyonlarımız\n- 📅 Etkinliklerimiz\n- ⚙️ Teknik Altyapı & Scout\n- 🤝 Sponsorlarımız\n- 🏗️ 2026 REBUILT Sezon Detayları\n- 📍 Turnuva Takvimi\n- 🔧 Pit Alanı İşleyişi\n- 🏆 FRC Ödülleri\n\nHangi konuda bilgi istersin?`;
}
