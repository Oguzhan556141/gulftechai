import { delay } from './utils.js';

export const handlers = [
    {
        name: 'takim_kadrosu',
        match: /takım.*tanıt|ekib.*tanıt|tüm üyeler|kimler var|kadro/i,
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
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
            return divText + `\nHer divizyon, "The Blue Wave" inançlarımızı gerçeğe dönüştürmek için birlikte çalışır! 🦈`;
        }
    },
    {
        name: 'kisisel_sorgu',
        match: (msg, k) => {
            // Mentor check
            if (msg.includes('ensar') || msg.includes('ince') || 
                msg.includes('ümran') || msg.includes('umran') || msg.includes('kayaoğlu')) return true;
                
            // Member check
            const captains = k.kaptanlar || [];
            const members = k.ekip_uyeleri || [];
            const allPartners = [ ...captains, ...members ];
            
            return allPartners.some(p => {
                if (!p.isim) return false;
                const firstName = p.isim.split(' ')[0].toLowerCase();
                return msg.includes(p.isim.toLowerCase()) || (msg.length < 20 && msg.includes(firstName));
            });
        },
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            if (msg.includes('ensar') || msg.includes('ince')) {
                return `**Ensar İnce**, GulfTech #11392 takımımızın değerli **Takım Mentoru**'dur. 🦈 Takımımıza teknik ve stratejik konularda rehberlik etmektedir.`;
            }
            if (msg.includes('ümran') || msg.includes('umran') || msg.includes('kayaoğlu')) {
                return `**Ümran Kayaoğlu**, GulfTech #11392 takımımızın **Danışman Öğretmenidir**. 🌊 Takımımızın kurumsal ve eğitim süreçlerinde yanımızda yer almaktadır.`;
            }
            
            const captains = k.kaptanlar || [];
            const members = k.ekip_uyeleri || [];
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
        }
    },
    {
        name: 'tarihce',
        match: /geşmiş|tarih|mavi dalga|blue wave|neden|logo/i,
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            const la = k.logo_anlami || {};
            return `### 🌊 The Blue Wave: FLL'den FRC'ye Yolculuğumuz\n\n` +
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
                `Her maçta "The Blue Wave" fırtınası estirmeye hazırız! 🦈🖥️`;
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
        name: 'iletisim',
        match: /iletişim|sosyal|medya|instagram|site|link/i,
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            const sa = k.sosyal_aglar || {};
            return `### 🔗 GulfTech'e Ulaşın\n\n- 📸 [Instagram](${sa.instagram || ''})\n- 📺 [YouTube](${sa.youtube || ''})\n- 🌐 [Web Sitesi](${sa.website || ''})\n\nKocaeli'den yükselen teknoloji dalgasına katılın! 🦈🚀`;
        }
    },
    {
        name: 'sponsorlar',
        match: /sponsor/i,
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            const sponsors = k.sponsorlar || [];
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
            const scoring = yh.puanlama || [];
            return `### 🏗️ FRC 2026: REBUILT\n\n${yh.oyun_ozeti || ''}\n\n**🎯 Puanlama Anahtarı:**\n` +
                scoring.map(p => `- ${p}`).join('\n') +
                `\n\nBu sezon robotumuzu "REBUILT" görevini en verimli şekilde tamamlayacak şekilde optimize ediyoruz! 🦈🔋`;
        }
    },
    {
        name: 'frc_nedir',
        match: /frc.*nedir|first.*robotics/i,
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
            return `### 🌊 Çok Teşekkürler! 🦈\n\nBu güzel dileklerin ve desteğin bizim için çok değerli. **#GulfTechFamily** desteğiyle ${yh.sezon || ''} sezonuna ve "REBUILT" görevine son hızla hazırlanıyoruz! 🛠️💪\n\nBirlikte "Mavi Dalga"yı en yükseğe taşıyacağız! 🌊🚀`;
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
            return `Ben, GulfTech #11392 takımında bulunan **Orion** adında anonim bir ekip üyesi tarafından geliştirildim. 🦈💻\n\nTakımımızın "The Blue Wave" ruhunu dijital dünyaya taşımak için buradayım! 🌊✨`;
        }
    }
];
