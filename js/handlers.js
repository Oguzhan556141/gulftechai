import { delay } from './utils.js';

// Turkish-aware string normalization
function trNorm(str) {
    if (!str) return '';
    return str
        .replace(/İ/g, 'i').replace(/ı/g, 'i')
        .replace(/Ü/g, 'u').replace(/ü/g, 'u')
        .replace(/Ö/g, 'o').replace(/ö/g, 'o')
        .replace(/Ş/g, 's').replace(/ş/g, 's')
        .replace(/Ç/g, 'c').replace(/ç/g, 'c')
        .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
        .toLowerCase();
}

// Turkish-aware regex test
function trMatch(msg, pattern) {
    const normalized = trNorm(msg);
    const normPattern = new RegExp(trNorm(pattern.source || pattern), pattern.flags || 'i');
    return normPattern.test(normalized);
}

export const handlers = [
    {
        name: 'iletisim',
        match: (msg) => trMatch(msg, /iletisim|sosyal|medya|instagram|site|link|ulasim|irtibat/),
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            const sa = knowledge.sosyal_aglar || k.sosyal_aglar || {};
            const iletisim = knowledge.iletisim || {};
            const igUrl = typeof sa.instagram === 'object' ? sa.instagram.url : (sa.instagram || '');
            const ytUrl = typeof sa.youtube === 'object' ? sa.youtube.url : (sa.youtube || '');
            const webUrl = sa.website || '';
            const liUrl = typeof sa.linkedin === 'object' ? sa.linkedin.url : '';
            let response = `### 🔗 GulfTech'e Ulaşın\n\n- 📸 [Instagram](${igUrl})\n- 📺 [YouTube](${ytUrl})\n- 🌐 [Web Sitesi](${webUrl})`;
            if (liUrl) response += `\n- 💼 [LinkedIn](${liUrl})`;
            if (iletisim.email) response += `\n- 📧 ${iletisim.email}`;
            if (iletisim.telefon_1) response += `\n- 📞 ${iletisim.telefon_1}`;
            response += `\n\nKocaeli'den yükselen teknoloji dalgasına katılın! 🦈🚀`;
            return response;
        }
    },
    {
        name: 'frc_nedir',
        match: (msg) => trMatch(msg, /frc|first.*robotics/),
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            const frc = k.frc_nedir || {};
            return `### 🤖 FRC (FIRST Robotics Competition) Nedir?\n\n` +
                `**${frc.tanim || ''}**\n\n` +
                `- 🇹🇷 **Türkiye Serüveni:** ${frc.tarihce_turkiye || ''}\n` +
                `- 💡 **More Than Robots:** ${frc.more_than_robots || ''}\n` +
                `- ⚙️ **İleri Mühendislik:** ${frc.ileri_muhendislik || ''}\n` +
                `- 🤝 **Takım Ruhu:** ${frc.takim_ruhu || ''}\n\n` +
                `*Duyarlı Profesyonellik* ile geleceği inşa ediyoruz! 🦈`;
        }
    },
    {
        name: 'takim_kadrosu',
        match: (msg) => trMatch(msg, /takim.*tanit|ekib.*tanit|tum uyeler|kimler var|kadro/),
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            const mentors = knowledge.yonetim_ve_mentorlar || [];
            const captains = knowledge.kaptanlar || k.kaptanlar || [];
            const members = [...(knowledge.ekip_uyeleri || k.ekip_uyeleri || [])];

            // Shuffle members randomly
            for (let i = members.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [members[i], members[j]] = [members[j], members[i]];
            }

            let mentorText = '';
            if (mentors.length > 0) {
                mentorText = mentors.map(m => `- **${m.isim}**: ${m.rol}`).join('\n');
            } else {
                const ym = k.yonetim_ve_mentorlar || {};
                mentorText = `- **${ym.takim_mentoru1 || 'Ümran Kayaoğlu'}**: Takım Mentörü\n- **${ym.takim_mentoru2 || 'Ensar İnce'}**: Takım Mentörü`;
            }

            return `### 🔱 ${k.isim || 'GulfTech'}\n\n` +
                `**🦈 Mentörlerimiz:**\n` +
                mentorText + `\n\n` +
                `**⭐ Kaptanlarımız:**\n` +
                captains.map(c => `- **${c.isim}**: ${c.rol}`).join('\n') + `\n\n` +
                `**👥 Ekibimiz:**\n` +
                members.map(m => `- **${m.isim}**: ${m.rol}`).join('\n') + `\n\n` +
                `*${k.miras || ''}* 🌊`;
        }
    },
    {
        name: 'divizyonlar',
        match: (msg) => trMatch(msg, /divizyon|departman|bolum|pr|mekanik|elektronik|yazilim|tasarim/),
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            const divizyonlar = k.divizyonlar || {};
            let divText = `### ⚙️ Takım Divizyonlarımız\n\n`;
            for (const [ad, aciklama] of Object.entries(divizyonlar)) {
                divText += `- **${ad}:** ${aciklama}\n`;
            }
            return divText + `\nHer divizyon, hedeflerimizi gerçeğe dönüştürmek için birlikte çalışır! 🦈`;
        }
    },
    {
        name: 'kisisel_sorgu',
        match: (msg, k, knowledge) => {
            const normMsg = trNorm(msg);
            // Mentor check
            if (normMsg.includes('ensar') || normMsg.includes('ince') ||
                normMsg.includes('umran') || normMsg.includes('kayaoglu')) return true;

            // Member check
            const captains = (knowledge && knowledge.kaptanlar) || k.kaptanlar || [];
            const members = (knowledge && knowledge.ekip_uyeleri) || k.ekip_uyeleri || [];
            const allPartners = [...captains, ...members];

            return allPartners.some(p => {
                if (!p.isim) return false;
                const normName = trNorm(p.isim);
                const firstName = normName.split(' ')[0];
                return normMsg.includes(normName) || (normMsg.length < 20 && normMsg.includes(firstName));
            });
        },
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            if (msg.includes('ensar') || msg.includes('ince')) {
                return `**Ensar İnce**, GulfTech #11392 takımımızın değerli **Takım Mentörü**'dür. 🦈 Takımımıza teknik ve stratejik konularda rehberlik etmektedir.`;
            }
            if (msg.includes('ümran') || msg.includes('umran') || msg.includes('kayaoğlu')) {
                return `**Ümran Kayaoğlu**, GulfTech #11392 takımımızın **Takım Mentörü**. 🌊 Takımımızın kurumsal ve eğitim süreçlerinde yanımızda yer almaktadır.`;
            }

            const captains = knowledge.kaptanlar || k.kaptanlar || [];
            const members = knowledge.ekip_uyeleri || k.ekip_uyeleri || [];
            const allPartners = [
                ...captains.map(c => ({ name: c.isim, role: c.rol, type: 'captain' })),
                ...members.map(m => ({ name: m.isim, role: m.rol, type: 'member' }))
            ];

            for (const p of allPartners) {
                if (!p.name) continue;
                const firstName = p.name.split(' ')[0].toLowerCase();
                if (msg.includes(p.name.toLowerCase()) || (msg.length < 20 && msg.includes(firstName))) {
                    const flavor = p.type === 'captain'
                        ? `🦈 Ekibimize liderlik etmektedir!`
                        : `🌊 Takımımızın hedeflerine ulaşmasında aktif rol oynamaktadır.`;
                    return `**${p.name}**, GulfTech #11392 takımımızda **${p.role}** görevini üstlenmektedir. ${flavor}`;
                }
            }
        }
    },
    {
        name: 'tarihce',
        match: /geçmiş|tarih|logo/i,
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            const la = k.logo_anlami || {};
            return `### 🌊 FLL'den FRC'ye Yolculuğumuz\n\n` +
                `Gulf Tech'in temelleri, Yücel Koyuncu BİLSEM çatısı altında **'Robogobi'** takımıyla 5 yıl süren başarılı bir FLL serüvenine dayanıyor. 🚀\n\n` +
                `**📍 Yolculuğumuz:**\n` +
                `- **Başlangıç:** Her şey Eskişehir'de büyük bir tutkuyla başladı.\n` +
                `- **Uluslararası Başarı:** Kıtaları aşarak Avustralya'ya kadar uzanan bir FLL ruhu inşa ettik.\n` +
                `- **Hedef:** FLL'de edindiğimiz deneyimleri, liderlik ve strateji becerilerini daha karmaşık projelere dökmek için FRC arenasına adım attık.\n\n` +
                `**Logo Anlamı:**\n` +
                `- 🦈 **Köpek Balığı:** ${la.kopek_baligi || ''}\n` +
                `- 💙 **Mavi:** ${la.mavi_tonlari || ''}\n` +
                `- 💛 **Sarı:** ${la.sarı_tonlar || ''}\n\n` +
                `FRC bizim için yalnızca bir yarışma değil, çevremize ilham olduğumuz bir gelişim yolculuğudur! 🌊💙`;
        }
    },
    {
        name: 'teknik',
        match: (msg) => trMatch(msg, /teknik|yazilim|donanim|scout|robot/),
        handle: async (msg, data, knowledge) => {
            const th = knowledge.teknik_hafiza || {};
            return `### ⚙️ Teknik Altyapımız\n\n` +
                `- **Yazılım:** ${th.yazilim_stack || 'Java'}\n` +
                `- **Donanım:** ${th.donanim || 'RoboRIO 2.0'}\n` +
                `- **Strateji:** ${th.strateji || ''}\n` +
                `- **Scout:** ${th.scout_sistemi || ''}\n\n` +
                `Her maçta fırtınalar estirmeye hazırız! 🦈🖥️`;
        }
    },
    {
        name: 'turnuva',
        match: (msg) => trMatch(msg, /bolge|turnuva|takvim|ne zaman/),
        handle: async (msg, data, knowledge) => {
            const yh = knowledge.yarisma_hafizasi || {};
            let table = `### 📍 ${yh.sezon || '2026'} Takvimi\n\n| Turnuva | Tarih | Mekan |\n|---------|-------|-------|\n`;
            const list = yh.bolgesel_turnuvalar || [];
            list.forEach(r => {
                table += `| ${r.ad} | ${r.tarih} | ${r.mekan} |\n`;
            });
            const goals = yh.hedefler ? yh.hedefler.join(', ') : '';
            return table + `\n\nHedeflerimiz: **${goals}** 🦈🏆`;
        }
    },
    {
        name: 'sponsorlar',
        match: (msg) => trMatch(msg, /sponsor|destekci/),
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            const sponsors = knowledge.sponsorlar || k.sponsorlar || [];
            return `### 🤝 Destekçilerimiz (Sponsorlar)\n\nGulfTech #11392 olarak yolculuğumuza destek olan değerli kurumlar:\n\n` +
                sponsors.map(s => `- **${s.ad}**: ${s.kategori}`).join('\n') +
                `\n\nBirlikte daha güçlüyüz! 🌊🚀`;
        }
    },
    {
        name: 'sezon',
        match: (msg) => trMatch(msg, /2026|rebuilt|oyun|mac|hub|fuel|yakit|kule|tower/),
        handle: async (msg, data, knowledge) => {
            const yh = knowledge.yarisma_hafizasi || {};
            const ob = yh.oyun_bilgisi || {};
            const ps = yh.puanlama_sistemi || {};
            const ms = yh.mac_yapisi || {};
            const otonom = ms.otonom_periyodu || {};
            const endgame = ms.endgame || {};
            const tp = ps.tower_puanlari || {};
            return `### 🏗️ FRC 2026: REBUILT\n\n` +
                `**${ob.tema || ''}**\n\n` +
                `${ob.ozet || ''}\n\n` +
                `**⏱️ Maç Süresi:** ${ob.sure || '2 dk 40 sn'}\n\n` +
                `**🤖 Otonom Periyodu (${otonom.sure || '20sn'}):** ${otonom.aciklama || ''}\n\n` +
                `**🎯 Hub Puanları:** ${ps.hub_puanlari ? ps.hub_puanlari.aktif_hub : 'Her yakıt = 1 puan'}\n\n` +
                `**🗼 Kule Puanları:**\n` +
                `- Level 1: ${tp.level_1 || '10 puan'}\n` +
                `- Level 2: ${tp.level_2 || '20 puan'}\n` +
                `- Level 3: ${tp.level_3 || '30 puan'}\n\n` +
                `**🏁 Endgame (${endgame.sure || 'Son 30sn'}):** ${endgame.aciklama || ''}\n\n` +
                `Bu sezon robotumuzu REBUILT görevini en verimli şekilde tamamlayacak şekilde optimize ediyoruz! 🦈🔋`;
        }
    },
    {
        name: 'etkinlikler',
        match: (msg) => trMatch(msg, /etkinlik|proje|zamanın mekaniği|huzurevi|stem|scout|yeşil vatan|devotion/),
        handle: async (msg, data, knowledge) => {
            const list = knowledge.etkinlikler || [];
            
            // Check if user is asking about a specific project
            for (const e of list) {
                if (trMatch(msg, new RegExp(e.ad, 'i'))) {
                    let resp = `### 🚀 ${e.ad}\n\n${e.aciklama}\n\n`;
                    if (e.url) resp += `🔗 **Detaylar:** [Buraya Tıklayın](${e.url})\n\n`;
                    return resp + `Başka hangi projemizi merak ediyorsun? 🦈`;
                }
            }

            return `### 📅 Etkinliklerimiz ve Projelerimiz\n\nEkip olarak sadece robot yapmıyor, çevremizi de aydınlatıyoruz:\n\n` +
                list.map(e => `- **${e.ad}**: ${e.aciklama}${e.url ? ` ([Link](${e.url}))` : ''}`).join('\n') +
                `\n\nFaaliyetlerimiz hız kesmeden devam ediyor! 🚀`;
        }
    },
    {
        name: 'ovgu',
        match: /başarılar|tebrik|helal|harika|güzel|iyi şanslar|maşallah/i,
        handle: async (msg, data, knowledge) => {
            const yh = knowledge.yarisma_hafizasi || {};
            return `### 🌊 Çok Teşekkürler! 🦈\n\nBu güzel dileklerin ve desteğin bizim için çok değerli. **#GulfTechFamily** desteğiyle ${yh.sezon || ''} sezonuna ve "REBUILT" görevine son hızla hazırlanıyoruz! 🛠️💪\n\nBirlikte GulfTech'i en yükseğe taşıyacağız! 🌊🚀`;
        }
    },
    {
        name: 'oduller',
        match: /ödül|başarı/i,
        handle: async (msg, data, knowledge) => {
            const awards = data.awards || [];
            return `### 🏆 FRC Ödülleri\n\nFRC dünyasındaki önemli ödüllerden bazıları:\n\n` +
                awards.map(a => `- **${a.name}**: ${a.desc}`).join('\n') +
                `\n\nGulfTech olarak hedefimiz bu prestijli ödülleri müzemize taşımak! 🦈✨`;
        }
    },
    {
        name: 'yaratan',
        match: (msg) => trMatch(msg, /seni kim.*yapti|yaraticin.*kim|kim.*gelistirdi|seni kim.*kodladi/),
        handle: async (msg, data, knowledge) => {
            return `Ben, GulfTech #11392 takımında bulunan **Oğuzhan Aşkın** tarafından geliştirildim. 🦈💻\n\nTakımımızı dijital dünyaya taşımak için buradayım! 🌊✨`;
        }
    },
    {
        name: 'first_vakfi',
        match: (msg) => trMatch(msg, /first vak|first.*vakif|dean kamen|first.*inspired|first.*kurulus/),
        handle: async (msg, data, knowledge) => {
            const fi = knowledge.first_bilgisi || {};
            const progs = fi.programlar || {};
            return `### 🌐 FIRST Vakfı (For Inspiration and Recognition of Science and Technology)\n\n` +
                `**Kurucu:** ${fi.kurucu || 'Dean Kamen'} (${fi.kurulus_yili || 1989})\n` +
                `**Misyon:** ${fi.misyon || ''}\n\n` +
                `**Temel Değerler:**\n` +
                `- 🤝 **GP:** ${fi.degerler?.gracious_professionalism || 'Duyarlı Profesyonellik'}\n` +
                `- 🏆 **Coopertition:** ${fi.degerler?.coopertition || 'Rekabetçi İşbirliği'}\n\n` +
                `**Programlar:**\n` +
                `- 🤖 **FRC** (${progs.frc?.baslangic || 1992}): ${progs.frc?.aciklama || 'Lise robotik yarışması'}\n` +
                `- ⚙️ **FTC** (${progs.ftc?.baslangic || 2005}): ${progs.ftc?.aciklama || 'Orta-lise robotik'}\n` +
                `- 🧱 **FLL** (${progs.fll?.baslangic || 1998}): ${progs.fll?.aciklama || 'LEGO robotik programı'}\n\n` +
                `*"More Than Robots" - Robotlardan Fazlası!* 🦈🌐`;
        }
    },
    {
        name: 'fikret_yuksel',
        match: (msg) => trMatch(msg, /fikret yuksel|fikret vak|fyv|darussfaka|yuksel vak/),
        handle: async (msg, data, knowledge) => {
            const fyk = knowledge.fikret_yuksel_vakfi || {};
            const kh = fyk.kurucu_hakkinda || {};
            return `### 🏢 Fikret Yüksel Vakfı\n\n` +
                `**Kurucu:** ${kh.isim || 'Fikret Yüksel'} (${fyk.kurulus_yili || 1998})\n` +
                `**Misyon:** ${fyk.misyon || ''}\n\n` +
                `**Kurucu Hakkında:**\n` +
                `- 🎓 ${kh.egitim || ''}\n` +
                `- 💼 ${kh.kariyer || ''}\n\n` +
                `**Türkiye'deki Etki:**\n` +
                `- ${fyk.turkiye_etkisi?.buyume || ''}\n` +
                (fyk.turkiye_etkisi?.destek_alanlari ? fyk.turkiye_etkisi.destek_alanlari.map(d => `- ${d}`).join('\n') : '') +
                `\n\n*Türk gençlerinin teknoloji liderliğine yöneliminde öncü rol!* 🦈🇹🇷`;
        }
    },
    {
        name: 'robot_kurallari',
        match: (msg) => trMatch(msg, /robot.*kural|boyut.*sinir|boyut.*limit|cevre.*sinir|yukseklik.*sinir|genisleme|bumper|tampon/),
        handle: async (msg, data, knowledge) => {
            const rk = knowledge.yarisma_hafizasi?.robot_kurallari || {};
            const bs = rk.boyut_sınırlari || {};
            const tk = rk.tampon_kurallari || {};
            const gk = rk.genel_kurallar || [];
            return `### 📏 Robot Kuralları (REBUILT 2026)\n\n` +
                `**Boyut Sınırları:**\n` +
                `- 📐 **Çevre:** ${bs.cevre || '110 inç (279,4 cm)'}\n` +
                `- 📐 **Yükseklik:** ${bs.yukseklik || '30 inç (76,2 cm)'}\n` +
                `- 📐 **Genişleme:** ${bs.genisleme || '12 inç (30,5 cm)'}\n\n` +
                `**Tampon Kuralları:** ${tk.aciklama || ''} Takım numarası: ${tk.takim_numarasi || ''}\n\n` +
                `**Genel Kurallar:**\n` +
                gk.map(k => `- ${k}`).join('\n') + `\n\n🦈🔧`;
        }
    },
    {
        name: 'strateji',
        match: (msg) => trMatch(msg, /strateji|taktik|nasil.*oyna|nasil.*kazan/),
        handle: async (msg, data, knowledge) => {
            const sn = knowledge.yarisma_hafizasi?.strateji_notlari || {};
            return `### 🎯 REBUILT Strateji Notları\n\n` +
                `- **Yakıt Yönetimi:** ${sn.yakit_yonetimi || ''}\n` +
                `- **Hub Rotasyonu:** ${sn.hub_rotasyonu_stratejisi || ''}\n` +
                `- **Tırmanma:** ${sn.tirmanma_stratejisi || ''}\n` +
                `- **İnsan Oyuncusu:** ${sn.insan_oyuncusu || ''}\n` +
                `- **Savunma:** ${sn.savunma || ''}\n` +
                `- **İşbirliği:** ${sn.isbirligi || ''}\n\n` +
                `*Strateji masasında kazanılır, sahada yürütülür!* 🦈⚽`;
        }
    }
];
