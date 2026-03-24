import { delay } from './utils.js';

export const handlers = [
    {
        name: 'iletisim',
        match: /iletişim|sosyal|medya|instagram|site|link|ulaşım|irtibat/i,
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
        match: /frc|first.*robotics/i,
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
        match: /takım.*tanıt|ekib.*tanıt|tüm üyeler|kimler var|kadro/i,
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
        match: /divizyon|departman|bölüm|pr|mekanik|elektronik|yazılım|tasarım/i,
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
            // Mentor check
            if (msg.includes('ensar') || msg.includes('ince') ||
                msg.includes('ümran') || msg.includes('umran') || msg.includes('kayaoğlu')) return true;

            // Member check
            const captains = (knowledge && knowledge.kaptanlar) || k.kaptanlar || [];
            const members = (knowledge && knowledge.ekip_uyeleri) || k.ekip_uyeleri || [];
            const allPartners = [...captains, ...members];

            return allPartners.some(p => {
                if (!p.isim) return false;
                const firstName = p.isim.split(' ')[0].toLowerCase();
                return msg.includes(p.isim.toLowerCase()) || (msg.length < 20 && msg.includes(firstName));
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
        match: /teknik|yazılım|donanım|scout|robot/i,
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
        match: /bölge|turnuva|takvim|ne zaman/i,
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
        match: /sponsor/i,
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
        match: /2026|rebuilt|oyun|maç/i,
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
        match: /etkinlik|yapıyorsunuz|neler.*yaptınız/i,
        handle: async (msg, data, knowledge) => {
            const etkinlikler = knowledge.etkinlikler || [];
            return `### 📅 Etkinliklerimiz\n\nEkip olarak sadece robot yapmıyor, çevremizi de aydınlatıyoruz:\n\n` +
                etkinlikler.map(e => `- **${e.ad}**: ${e.aciklama}`).join('\n') +
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
        match: /seni kim.*yaptı|yaratıcın.*kim|kim.*geliştirdi|seni kim.*kodladı/i,
        handle: async (msg, data, knowledge) => {
            return `Ben, GulfTech #11392 takımında bulunan **Oğuzhan Aşkın** tarafından geliştirildim. 🦈💻\n\nTakımımızı dijital dünyaya taşımak için buradayım! 🌊✨`;
        }
    }
];
