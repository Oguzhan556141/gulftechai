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
        name: 'genel_kultur',
        match: (msg) => {
            const norm = trNorm(msg);
            // FIRST, FRC, FYV, Robotik, BIOCORE veya Takım soruları asla genel kültür radarına girmemeli
            if (norm.includes('first') || norm.includes('frc') || norm.includes('ftc') || norm.includes('fll') ||
                norm.includes('fikret') || norm.includes('yuksel') || norm.includes('vakif') || 
                norm.includes('biocore') || norm.includes('canopy') || norm.includes('rebuilt') ||
                norm.includes('robot') || norm.includes('gulftech') || norm.includes('kickoff')) {
                return false;
            }
            return trMatch(msg, /\b(bilgi|kultur|kimdir|cografya|tarih|bilim|sanat|edebiyat|spor|mitoloji|felsefe|psikoloji|ekonomi|saglik|mutfak|fizik|biyoloji|astronomi|einstein|foton|kuantum|mona lisa|periyodik|ataturk|everest|nil|nehir|dag|gol|deniz|kitai|asya|avrupa|afrika|amerika|tablo|eser|ressam|yazar|kitap|klasik|olimpiyat|dunya kupasi|enflasyon|vitamin|protein|karbonhidrat|dna|evrim|blokzincir)\b/i);
        },
        handle: async (msg, data, knowledge) => {
            const gk = knowledge.genel_kultur || {};
            const normMsg = trNorm(msg);

            const findMatch = (obj) => {
                for (const [key, val] of Object.entries(obj)) {
                    const normKey = trNorm(key);
                    const keyParts = normKey.split('_');

                    // 1. Match against partial keys (e.g. "einstein" matches "albert_einstein")
                    const isKeyMatch = normMsg.includes(normKey) || (keyParts.length > 1 && keyParts.some(p => p.length > 3 && normMsg.includes(p)));

                    if (isKeyMatch && typeof val === 'string' && val.length > 10) {
                        return { title: key, body: val };
                    }
                    
                    // 2. Match in arrays (objects with olay, eser, ad, isim, etc.)
                    if (Array.isArray(val)) {
                        const match = val.find(item => {
                            const name = item.olay || item.eser || item.ad || item.isim || item.sanatci;
                            if (!name) return false;
                            const normName = trNorm(name);
                            return normMsg.includes(normName) || (normName.split(' ').some(p => p.length > 3 && normMsg.includes(p)));
                        });
                        if (match) {
                            return { 
                                title: match.olay || match.eser || match.ad || match.isim || match.sanatci, 
                                body: (match.yil ? `**Yıl:** ${match.yil}\n` : '') + 
                                      (match.sanatci ? `**Sanatçı:** ${match.sanatci}\n` : '') + 
                                      (match.onem || match.aciklama || match.tanim || '')
                            };
                        }
                    }

                    // 3. Recursive search in objects
                    if (typeof val === 'object' && val !== null) {
                        if (isKeyMatch && (val.aciklama || val.tanim || val.ozet)) {
                            return { title: key, body: val.aciklama || val.tanim || val.ozet };
                        }
                        const subMatch = findMatch(val);
                        if (subMatch) return subMatch;
                    }
                }
                return null;
            };

            const result = findMatch(gk);
            if (result) {
                return `### 🧠 ${result.title.charAt(0).toUpperCase() + result.title.slice(1).replace(/_/g, ' ')}\n\n${result.body}`;
            }

            // Eğer lokal genel kültür verisinde tam eşleşme yoksa null dön ki Gemini API cevaplasın!
            return null;
        }
    },
    {
        name: 'iletisim',
        match: (msg) => trMatch(msg, /iletisim|sosyal|medya|instagram|site|link|ulasim|irtibat/),
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            const sa = knowledge.sosyal_aglar || k.sosyal_aglar || {};
            const iletisim = knowledge.iletisim || {};
            const igInfo = knowledge.instagram_icerik || {};
            const igUrl = typeof sa.instagram === 'object' ? sa.instagram.url : (sa.instagram || '');
            const ytUrl = typeof sa.youtube === 'object' ? sa.youtube.url : (sa.youtube || '');
            const webUrl = sa.website || '';
            const liUrl = typeof sa.linkedin === 'object' ? sa.linkedin.url : '';
            
            const followerStr = (igInfo.takipci || sa.instagram?.takipci) ? ` *(${igInfo.takipci || sa.instagram.takipci} takipçi / ${igInfo.gonderi || sa.instagram.gonderi || 96} gönderi)*` : '';
            
            let response = `### 🔗 GulfTech'e Ulaşın & Sosyal Medya\n\n- 📸 [Instagram (@gulftechtr)](${igUrl})${followerStr}\n- 📺 [YouTube](${ytUrl})\n- 🌐 [Web Sitesi](${webUrl})`;
            if (liUrl) response += `\n- 💼 [LinkedIn](${liUrl})`;
            if (iletisim.email) response += `\n- 📧 ${iletisim.email}`;
            if (iletisim.telefon_1) response += `\n- 📞 ${iletisim.telefon_1}`;
            response += `\n\nKocaeli'den yükselen teknoloji dalgasına katılın! 🦈`;
            return response;
        }
    },
    {
        name: 'frc_nedir',
        match: (msg) => trMatch(msg, /frc|first.*robotics/),
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            const frc = k.frc_nedir || {};
            const wp = knowledge.web_sitesi_sayfalari || {};

            return `### 🤖 FRC (FIRST Robotics Competition) Nedir?\n\n` +
                `**${frc.tanim || 'Zeka için Spor: Gençlerin bilim ve teknoloji ile ilgilenmeleri için tasarlanmış dünyanın en prestijli robotik yarışması.'}**\n\n` +
                `FRC, lise öğrencilerinin kısıtlı zaman ve kaynaklarla endüstriyel standartlarda robotlar tasarlayıp inşa ettikleri uluslararası bir organizasyondur.\n\n` +
                `--- \n\n` +
                `#### 🌟 Öne Çıkan Değerler ve Kazanımlar:\n` +
                `- 🇹🇷 **Türkiye Serüveni:** ${frc.tarihce_turkiye || 'Türkiye\'de her yıl binlerce gence ilham veren bölgesel turnuvalarla büyüyen büyük bir ekosistem.'}\n` +
                `- 💡 **More Than Robots (Robotlardan Fazlası):** ${frc.more_than_robots || 'Sadece bir yarışma değil; markalaşma, takım çalışması ve toplumsal etki oluşturma platformu.'}\n` +
                `- ⚙️ **İleri Mühendislik:** ${frc.ileri_muhendislik || 'Java, C++, CAD tasarımı, CNC/3D üretim ve otonom vizyon işleme gibi endüstriyel beceriler.'}\n` +
                `- 🤝 **Duyarlı Profesyonellik (Gracious Professionalism):** Saygı, rekabetçi iş birliği ve bilgi paylaşımı ilkeleriyle geleceği inşa etmek.\n\n` +
                `📌 **Daha Fazlası İçin:**\n` +
                `- 🌐 Web sitemizdeki FRC rehberine göz atın: [GulfTech FRC Nedir Sayfası](${wp.frc_nedir || 'https://gulftechrobotic.com.tr/frcnedir.html'})\n` +
                `- 📸 Sezon hikayelerimizi [Instagram Hesabımızda (@gulftechtr)](https://www.instagram.com/gulftechtr/) takip edin!`;
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
            const wp = knowledge.web_sitesi_sayfalari || {};

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

            // Format captains with LinkedIn
            const captainLines = captains.map(c => {
                let line = `- **${c.isim}**: ${c.rol}`;
                if (c.linkedin) line += ` — [LinkedIn Profili](${c.linkedin})`;
                return line;
            }).join('\n');

            // Format members with LinkedIn
            const memberLines = members.map(m => {
                let line = `- **${m.isim}**: ${m.rol}`;
                if (m.linkedin) line += ` — [LinkedIn Profili](${m.linkedin})`;
                return line;
            }).join('\n');

            return `### 🔱 ${k.isim || 'GulfTech #11392'} Takım Kadromuz\n\n` +
                `GulfTech #11392; Kocaeli Gölcük BİLSEM çatısı altında yetişen gençlerin liderlik, mekanik, elektronik, yazılım ve PR alanlarında disiplinler arası bir sinerjiyle oluşturduğu güçlü bir FRC takımıdır.\n\n` +
                `**🎓 Mentörlerimiz:**\n` +
                mentorText + `\n\n` +
                `**⭐ Kaptanlarımız:**\n` +
                captainLines + `\n\n` +
                `**👥 Ekip Üyelerimiz:**\n` +
                memberLines + `\n\n` +
                `**💡 Divizyon Yapımız:**\n` +
                `- **Mekanik:** Robot şasesi, yürüyen aksam ve mekanizmaların CAD ortamında tasarımı ve üretimi.\n` +
                `- **Elektronik:** RoboRIO 2.0, CAN veri hattı, motor sürücüler ve sensör entegrasyonu.\n` +
                `- **Yazılım:** Otonom rotaları, vizyon işleme (AprilTag) ve sürücü kontrol sistemleri.\n` +
                `- **PR & Kurumsal:** Sponsorluk ilişkileri, marka yönetimi, sosyal sorumluluk projeleri ve topluluk iletişimi.\n\n` +
                `📌 **Detaylı Takım İncelemesi ve Bağlantılar:**\n` +
                `- 🌐 [GulfTech Takım Sayfası](${wp.takim_uyeleri || 'https://gulftechrobotic.com.tr/team.html'})\n` +
                `- 📸 Ekibimizin günlük çalışmalarını ve hikayelerini [Instagram Hesabımızda (@gulftechtr)](https://www.instagram.com/gulftechtr/) takip edebilirsiniz!\n\n` +
                `*${k.miras || ''}*`;
        }
    },
    {
        name: 'divizyonlar',
        match: (msg) => trMatch(msg, /divizyon|departman|bolum|\bpr\b|mekanik|elektronik|yazilim|tasarim/),
        handle: async (msg, data, knowledge) => {
            const k = knowledge.takim_kimligi;
            const divizyonlar = k.divizyonlar || {};
            let divText = `### ⚙️ Takım Divizyonlarımız\n\n`;
            for (const [ad, aciklama] of Object.entries(divizyonlar)) {
                divText += `- **${ad}:** ${aciklama}\n`;
            }
            return divText + `\nHer divizyon, hedeflerimizi gerçeğe dönüştürmek için birlikte çalışır!`;
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
                return `**Ensar İnce**, GulfTech #11392 takımımızın değerli **Takım Mentörü**'dür. Takımımıza teknik ve stratejik konularda rehberlik etmektedir.`;
            }
            if (msg.includes('ümran') || msg.includes('umran') || msg.includes('kayaoğlu')) {
                return `**Ümran Kayaoğlu**, GulfTech #11392 takımımızın **Takım Mentörü**. Takımımızın kurumsal ve eğitim süreçlerinde yanımızda yer almaktadır.`;
            }

            const captains = knowledge.kaptanlar || k.kaptanlar || [];
            const members = knowledge.ekip_uyeleri || k.ekip_uyeleri || [];
            const allPartners = [
                ...captains.map(c => ({ name: c.isim, role: c.rol, type: 'captain', linkedin: c.linkedin })),
                ...members.map(m => ({ name: m.isim, role: m.rol, type: 'member', linkedin: m.linkedin }))
            ];

            for (const p of allPartners) {
                if (!p.name) continue;
                const firstName = p.name.split(' ')[0].toLowerCase();
                if (msg.includes(p.name.toLowerCase()) || (msg.length < 20 && msg.includes(firstName))) {
                    const flavor = p.type === 'captain'
                        ? `Ekibimize liderlik etmektedir.`
                        : `Takımımızın hedeflerine ulaşmasında aktif rol oynamaktadır.`;
                    let response = `**${p.name}**, GulfTech #11392 takımımızda **${p.role}** görevini üstlenmektedir. ${flavor}`;
                    if (p.linkedin) response += `\n\n🔗 [LinkedIn Profili](${p.linkedin})`;
                    return response;
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
                `Gulf Tech'in temelleri, Yücel Koyuncu BİLSEM çatısı altında **'Robogobi'** takımıyla 5 yıl süren başarılı bir FLL serüvenine dayanıyor.\n\n` +
                `**📍 Yolculuğumuz:**\n` +
                `- **Başlangıç:** Her şey Eskişehir'de büyük bir tutkuyla başladı.\n` +
                `- **Uluslararası Başarı:** Kıtaları aşarak Avustralya'ya kadar uzanan bir FLL ruhu inşa ettik.\n` +
                `- **Hedef:** FLL'de edindiğimiz deneyimleri, liderlik ve strateji becerilerini daha karmaşık projelere dökmek için FRC arenasına adım attık.\n\n` +
                `**Logo Anlamı:**\n` +
                `- 🦈 **Köpek Balığı:** ${la.kopek_baligi || ''}\n` +
                `- 💙 **Mavi:** ${la.mavi_tonlari || ''}\n` +
                `- 💛 **Sarı:** ${la.sarı_tonlar || ''}\n\n` +
                `FRC bizim için yalnızca bir yarışma değil, çevremize ilham olduğumuz bir gelişim yolculuğudur!`;
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
                `Her maçta fırtınalar estirmeye hazırız! 🦈`;
        }
    },
    {
        name: 'turnuva',
        match: (msg) => trMatch(msg, /bolge|turnuva|takvim|ne zaman/),
        handle: async (msg, data, knowledge) => {
            const yh = knowledge.yarisma_hafizasi || {};
            let table = `### 📍 ${yh.sezon || '2026'} Turnuva Takvimi\n\n| Turnuva | Tarih | Mekan |\n|---------|-------|-------|\n`;
            const list = yh.bolgesel_turnuvalar || [];
            list.forEach(r => {
                table += `| ${r.ad} | ${r.tarih} | ${r.mekan} |\n`;
            });
            
            // Also include data.json regionals
            if (data && data.regionals) {
                data.regionals.forEach(r => {
                    // Skip if already in the list
                    const exists = list.some(l => l.ad === r.name);
                    if (!exists) {
                        const d = new Date(r.date);
                        const dateStr = `${d.getDate()}-${d.getDate()+2} ${['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'][d.getMonth()]} ${d.getFullYear()}`;
                        table += `| ${r.name} | ${dateStr} | ${r.location} |\n`;
                    }
                });
            }

            return table + `\n🏆 **Hedefimiz:** Bu turnuvalarda en iyi performansı gösterip ödül kazanmak!`;
        }
    },
    {
        name: 'pit_alani',
        match: (msg) => trMatch(msg, /pit|alan.*yarisma|yarisma.*alan|pit.*alan|hazirlik/),
        handle: async (msg, data, knowledge) => {
            const pit = knowledge.yarisma_hafizasi?.pit_alani || {};
            return `### 🔧 Pit Alanı ve Yarışma İşleyişi\n\n` +
                `**Pit Alanı Nedir?**\n` +
                `${pit.tanim || 'Pit alanı, yarışma süresince takımların robotlarını hazırladığı, tamir ettiği ve stratejilerini planladığı çalışma alanıdır.'}\n\n` +
                `**Pit Alanı Kuralları:**\n` +
                (pit.kurallar || [
                    'Güvenlik gözlüğü zorunludur.',
                    'Çalışma alanı düzenli tutulmalıdır.',
                    'Robot bataryaları güvenli şekilde depolanmalıdır.',
                    'Elektrikli aletlerin kullanımında dikkatli olunmalıdır.',
                    'Pit alanı en fazla 10x10 feet (3x3m) olabilir.'
                ]).map(k => `- ${k}`).join('\n') + `\n\n` +
                `**Yarışma Günü Akışı:**\n` +
                (pit.yarisma_akisi || [
                    '1. Robot muayenesi (Inspection)',
                    '2. Practice maçları',
                    '3. Eleme (Qualification) maçları',
                    '4. İttifak seçimi (Alliance Selection)',
                    '5. Playoff maçları',
                    '6. Ödül töreni'
                ]).map(a => `- ${a}`).join('\n') + `\n\n` +
                `**Takım Hiyerarşisi (Yarışma Günü):**\n` +
                `- **Drive Team (Sürücü Ekibi):** Saha içinde robotu kontrol eden 4-5 kişilik ekip\n` +
                `- **Pit Crew:** Pit alanında robotu tamir ve bakım yapan ekip\n` +
                `- **Scout Ekibi:** Diğer takımların performansını izleyen ve veri toplayan ekip\n` +
                `- **Strateji Ekibi:** Maç stratejileri ve ittifak kararları veren ekip\n\n` +
                `Organizasyon ve hazırlık, sahadaki başarının anahtarıdır!`;
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
                `\n\nBirlikte daha güçlüyüz!`;
        }
    },
    {
        name: 'biocore',
        match: (msg) => trMatch(msg, /biocore|canopy|2027.*sezon|2027.*tema|2027.*oyun|bioglow|biobuzz/),
        handle: async (msg, data, knowledge) => {
            const fi = knowledge.first_bilgisi || {};
            const bc = fi.sezon_2027_biocore || {};
            return `### 🌿 FRC 2027 Sezonu: BIOCORE™ (FIRST® CANOPY™)\n\n` +
                `**Tema & Konsept:** ${bc.ust_tema || 'FIRST® CANOPY™ (Biyoçeşitlilik, Doğa ve Yaşamı Destekleyen Sistemler)'}\n` +
                `**Destekçi / Sponsor:** ${bc.destekci || 'Gene Haas Foundation'}\n` +
                `**Dünya Kickoff Tarihi:** 📅 **${bc.kickoff_tarihi || '9 Ocak 2027'}**\n\n` +
                `---\n\n` +
                `#### 🌱 BIOCORE İsminin Anlamı ve Amacı\n` +
                `${bc.anlam_ve_amac || 'BIOCORE; "Bio" (yaşam/biyoloji) ve "Core" (merkez/çekirdek) kelimelerinin birleşiminden oluşur. FIRST CANOPY sezonunun lise düzeyindeki (FRC) ana meydan okumasıdır. Gezegendeki biyoçeşitliliği, ekosistemleri ve yaşamı sürdürülebilir kılan temel mekanizmaları mühendislik bakış açısıyla anlamayı ve korumayı hedefler.'}\n\n` +
                `---\n\n` +
                `#### 🌐 FIRST® CANOPY™ Sezonunun Diğer Programları:\n` +
                `- 🧱 **FIRST LEGO League (FLL):** *BIOGLOW™*\n` +
                `- ⚙️ **FIRST Tech Challenge (FTC):** *BIOBUZZ™*\n` +
                `- 🤖 **FIRST Robotics Competition (FRC):** *BIOCORE™*\n\n` +
                `📌 **Detaylı Kaynak ve Resmi Bağlantılar:**\n` +
                `- 🌐 FIRST Resmi FRC Portalı: [firstinspires.org/programs/frc](https://www.firstinspires.org/programs/frc/)\n` +
                `- 🇹🇷 FRC Türkiye Resmi Sitesi: [frcturkiye.org](https://frcturkiye.org/)\n` +
                `- ⏱️ Kickoff geri sayımımızı ana sayfamızdaki özel saatten canlı olarak takip edebilirsiniz! 🦈`;
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
            const wp = knowledge.web_sitesi_sayfalari || {};

            return `### 🏗️ FRC 2026 Sezonu: REBUILT Detaylı Oyun Analizi\n\n` +
                `**Tema & Konsept:** ${ob.tema || 'Geleceği ve Toplumu Yeniden İnşa Etme'}\n\n` +
                `${ob.ozet || 'REBUILT oyununda takımlar, sahada bulunan dinamik Hub yapılarını besleyerek ve yüksek Kule tırmanışları yaparak puan toplarlar.'}\n\n` +
                `--- \n\n` +
                `#### ⏱️ Maç Akışı ve Zaman Çizelgesi\n` +
                `- **Toplam Süre:** ${ob.sure || '2 dakika 40 saniye'}\n` +
                `- **🤖 Otonom Periyot (${otonom.sure || '20 saniye'}):** ${otonom.aciklama || 'Robotlar önceden kodlanmış otonom rotaları ve vizyon işleme (AprilTag) sistemlerini kullanarak hareket eder, sahadaki ilk yakıt yüklemelerini tamamlar.'}\n` +
                `- **🎮 Sürücü Kontrollü Periyot (2 dakika 20 saniye):** Sürücüler ve operatörler robotu doğrudan kontrol ederek Hub hedeflerini besler ve stratejik savunma/hücum manevraları yapar.\n` +
                `- **🏁 Endgame (${endgame.sure || 'Son 30 saniye'}):** ${endgame.aciklama || 'Takımlar kuleye tırmanış yaparak yüksek seviye puanlama elde etmeye çalışır.'}\n\n` +
                `--- \n\n` +
                `#### 🎯 Puanlama Mantığı ve Hedefler\n` +
                `- **🛢️ Hub Puanları:** ${ps.hub_puanlari ? ps.hub_puanlari.aktif_hub : 'Aktif Hub bölgelerine aktarılan her yakıt parçası takıma doğrudan puan kazandırır.'}\n` +
                `- **🗼 Kule Tırmanış Seviyeleri:**\n` +
                `  - **Level 1:** ${tp.level_1 || '10 Puan'}\n` +
                `  - **Level 2:** ${tp.level_2 || '20 Puan'}\n` +
                `  - **Level 3 (Zirve Tırmanış):** ${tp.level_3 || '30 Puan'}\n\n` +
                `📌 **Daha Fazla Bilgi ve İnteraktif Oyun Simülasyonu:**\n` +
                `- 🌐 Web sitemizin oyun portalını ziyaret edin: [GulfTech Oyun Sayfası](${wp.oyun || 'https://gulftechrobotic.com.tr/game.html'})\n` +
                `- 📊 Strateji ve Scout takip detaylarımız için: [GulfTech Scout Portalı](${wp.scout || 'https://gulftechrobotic.com.tr/scout.html'})\n` +
                `- 📸 Antrenman ve test videolarımızı [Instagram Hesabımızda (@gulftechtr)](https://www.instagram.com/gulftechtr/) inceleyebilirsiniz!`;
        }
    },
    {
        name: 'etkinlikler',
        match: (msg) => trMatch(msg, /etkinlik|proje|zamanin mekani|huzurevi|stem|yeşil vatan|devotion|green alliance|izaydas|pollution|egitim portali/),
        handle: async (msg, data, knowledge) => {
            const list = knowledge.etkinlikler || [];
            const wp = knowledge.web_sitesi_sayfalari || {};
            const normMsg = trNorm(msg);
            
            // Check if user is asking about ONE specific single project
            const specificMap = [
                { keywords: ['zamanin mekani'], field: 'zamanın mekaniği' },
                { keywords: ['huzurevi', 'bayramlasma'], field: 'huzurevi' },
                { keywords: ['yesil vatan'], field: 'yeşil vatan' },
                { keywords: ['devotion'], field: 'devotion' },
                { keywords: ['green alliance', 'gfl'], field: 'green alliance' },
                { keywords: ['izaydas'], field: 'izaydaş' },
                { keywords: ['pollution', 'oyun'], field: 'pollution' },
                { keywords: ['egitim portali'], field: 'eğitim portalı' },
                { keywords: ['scout sistemi'], field: 'scout' },
                { keywords: ['kick-off roportaj', 'kickoff roportaj'], field: 'kick-off' },
            ];
            
            for (const sp of specificMap) {
                if (sp.keywords.some(k => normMsg.includes(k))) {
                    const e = list.find(item => trNorm(item.ad).includes(trNorm(sp.field)));
                    if (e) {
                        let resp = `### 🚀 ${e.ad}\n\n${e.aciklama}\n\n`;
                        if (e.konular) {
                            resp += `**Öne Çıkan Başlıklar:**\n` + e.konular.map(t => `- ${t}`).join('\n') + `\n\n`;
                        }
                        if (e.gelistirici) {
                            resp += `👨‍💻 **Geliştirici:** ${e.gelistirici}\n\n`;
                        }
                        if (e.url) resp += `🔗 **Detaylı İncele:** [${e.ad}](${e.url})\n\n`;
                        resp += `🌐 Tüm projelerimizi [GulfTech Etkinlik Portalı](${wp.projeler_etkinlikler || 'https://gulftechrobotic.com.tr/etkinlik.html'}) üzerinden görüntüleyebilirsiniz.`;
                        return resp;
                    }
                }
            }

            return `### 📅 GulfTech #11392 Projelerimiz ve Etkinliklerimiz\n\n` +
                `GulfTech ailesi olarak yalnızca rekabetçi bir robot üretmekle yetinmiyor; FIRST değerlerini, bilim ve teknoloji sevgisini, çevre bilincini ve toplumsal dayanışmayı toplumun her kesimine ulaştırmak için çok yönlü projeler yürütüyoruz. [GulfTech Etkinlik Portalı](https://gulftechrobotic.com.tr/etkinlik.html) üzerinde yer alan tüm temel proje ve etkinliklerimiz:\n\n` +
                `---\n\n` +
                `#### 💻 1. Dijital Projeler ve Yazılım Araçlarımız\n\n` +
                `- 🤖 **Gulf Tech AI:** FRC dökümanlarını anlamlandırmayı kolaylaştıran, takım ve yarışma kuralları hakkında anlık yanıtlar sunan yapay zeka asistanımız (Geliştirici: *Oğuzhan Aşkın*). — [Asistanı Kullan](https://oguzhan556141.github.io/gulftechai/)\n` +
                `- 📚 **FRC Eğitim Portalı:** Robotik ve mühendislik alanında bilgi paylaşımını artırmak amacıyla kurduğumuz platform. Çark oranları (Gear Ratio), RPM, tork, aktüatörler, temel elektronik ve 3D CAD modelleme konularında açık kaynaklı eğitim sunar. — [Eğitim Portalına Git](https://gulftechrobotic.com.tr/egitim.html)\n` +
                `- 🎮 **Pollution at Gulf (Oyun):** Su altındaki köpekbalığını kontrol ederek denizlerdeki plastik atıklardan kaçılan çevre farkındalık oyunu. Oyunculara deniz kirliliğinin ciddiyetini eğlenceli bir macera ile hissettirir. — [Oyunu Oyna](https://gulftechrobotic.com.tr/game.html)\n` +
                `- 📊 **Scout Sistemi (REBUILT 2026):** Maç sırasında canlı veri toplayıp analiz eden strateji aracımız. Rakip ve ittifak robotlarının performanslarını, taktiklerini ve saha verilerini sayısal olarak işleyerek bilinçli kararlar almamızı sağlar. — [Scout Sistemini İncele](https://gulftechrobotic.com.tr/scout.html)\n\n` +
                `---\n\n` +
                `#### 🔬 2. STEM ve FIRST Yaygınlaştırma Etkinliklerimiz\n\n` +
                `- 🏫 **Gölcük Piyalepaşa İlkokulu STEM Etkinliği:** Küçük yaştaki öğrencileri bilim ve robotikle buluşturduğumuz, REBUILT sezonunda sadece robotumuzu değil genç zihinleri de inşa etme vizyonumuzun bir parçası. — [İncele](https://www.instagram.com/p/DV3zTA-iOSh/)\n` +
                `- 🧩 **Çocuk Kasabası STEM Etkinliği:** 5 yıllık FLL mirasımızı yeni zihinlere aktarmak, FIRST kültürünü ve mühendislik disiplinini erken yaşta aşılamak amacıyla gerçekleştirdiğimiz atölye çalışması. — [İncele](https://www.instagram.com/reel/DVofbpBCFNk/)\n` +
                `- 💡 **Yücel Koyuncu BİLSEM STEM Etkinliği:** FRC ve FTC dünyasının heyecanını paylaştığımız, yeni bir FTC takımı kurulmasına öncülük ve mentorluk ettiğimiz kapsamlı tanıtım buluşması. — [İncele](https://www.instagram.com/p/DV53uDfiFBe/)\n\n` +
                `---\n\n` +
                `#### 🌱 3. Sosyal Sorumluluk ve Çevre Projelerimiz\n\n` +
                `- 🧓 **Huzurevi Bayramlaşması (Gölcük Prof. Dr. İsmail Barış Huzurevi):** Robotikten öte, asıl motivasyonumuzun insanlarla bir arada olmak ve sevgiyle yardımlaşmak olduğunu hissettiren anlamlı bayram ziyaretimiz. — [İncele](https://www.instagram.com/p/DWMEQScCAno/)\n` +
                `- 💧 **Gulf Tech X Yeşil Vatan (Su Sebili Projesi):** Kurumumuzda tek kullanımlık pet şişeleri kaldırıp yerine su sebili kurarak plastik atık oluşumunu önlediğimiz çevre hareketi.\n` +
                `- 🌿 **Gulf Tech X GFL Robotics Green Alliance:** FRC takımları arasında sürdürülebilirlik, çevre kirliliğiyle mücadele ve ortak yeşil projeler geliştirme amacıyla kurulan iş birliği platformu. — [İncele](https://www.instagram.com/p/DWKJVB2DGk6/)\n` +
                `- ❤️ **Devotion Projesi:** *"Her şey bir hayalle başladı..."* diyerek yola çıktığımız, başkalarının hayatına değer katmak ve gönüllülük bilincini yükseltmek için başlattığımız sosyal sorumluluk projesi. — [İncele](https://www.instagram.com/p/DUqzahTiBG6/)\n` +
                `- ♻️ **İZAYDAŞ Gezisi:** Kocaeli Atık ve Artıkları Arıtma, Yakma ve Değerlendirme A.Ş. tesislerine yaptığımız teknik gezi ile endüstriyel atık yönetimi ve geri dönüşüm süreçlerini yerinde inceledik. — [İncele](https://www.instagram.com/p/DR4xufmCImI/)\n\n` +
                `---\n\n` +
                `#### 🤝 4. Topluluk ve İçerik Üretimi\n\n` +
                `- ⏳ **Zamanın Mekaniği Serisi:** Sadece robot yapmakla kalmayıp bilim ve mekanik tarihinden ilham verici bilgileri aktardığımız Instagram video serimiz. — [İzle](https://www.instagram.com/reel/DVQoa6biIMF/)\n` +
                `- 🎙️ **Kick-off Röportajları:** FIRST topluluğunu yakından tanımak ve farklı takımların bakış açılarını kayıt altına almak için hazırladığımız söyleşi serisi. — [YouTube'da İzle](https://www.youtube.com/watch?v=gNPLx_AMXqE)\n` +
                `- 🤝 **FRC Takımlarıyla Ortak Toplantılar:** Bilgi ve tecrübe paylaşımı amacıyla FRC takımlarıyla düzenli gerçekleştirdiğimiz çevrim içi ve yüz yüze oturumlar.\n` +
                `- 🥐 **Takım Kahvaltısı & Birlik Buluşmaları:** Takım ruhunu, motivasyonu ve aile bağlarımızı diri tutan sosyal etkinliklerimiz.\n\n` +
                `📌 **Tüm İçerik ve Güncel Detaylar:**\n` +
                `- 🌐 **Etkinlik Sayfamız:** [gulftechrobotic.com.tr/etkinlik.html](${wp.projeler_etkinlikler || 'https://gulftechrobotic.com.tr/etkinlik.html'})\n` +
                `- 📸 **Resmi Instagram Hesabımız:** [@gulftechtr](https://www.instagram.com/gulftechtr/)\n` +
                `- 🎥 **YouTube:** [@gulftechtr](https://www.youtube.com/@gulftechtr)`;
        }
    },
    {
        name: 'ovgu',
        match: /başarılar|tebrik|helal|harika|güzel|iyi şanslar|maşallah/i,
        handle: async (msg, data, knowledge) => {
            const yh = knowledge.yarisma_hafizasi || {};
            return `### Çok Teşekkürler! 🦈\n\nBu güzel dileklerin ve desteğin bizim için çok değerli. **#GulfTechFamily** desteğiyle ${yh.sezon || ''} sezonuna ve \"REBUILT\" görevine son hızla hazırlanıyoruz!\n\nBirlikte GulfTech'i en yükseğe taşıyacağız! 🌊`;
        }
    },
    {
        name: 'oduller',
        match: /ödül|award|başarı/i,
        handle: async (msg, data, knowledge) => {
            const awards = data.awards || [];
            const frcAwards = knowledge.frc_turkiye?.oduller?.kategoriler || [];
            
            // Merge awards (frcAwards has more detail)
            const allAwards = frcAwards.length > 0 ? frcAwards : awards;
            
            let response = `### 🏆 FRC Ödülleri\n\nFRC yarışmalarında takımlara verilen prestijli ödüller:\n\n`;
            
            response += `**Takım Performansı Ödülleri:**\n`;
            response += `- **FIRST Impact Award (eski adıyla Chairman's Award):** FRC'nin en prestijli ödülü. FIRST misyonunu en iyi temsil eden, toplumda bilim ve teknoloji kültürünü yayan takıma verilir. Kazanan takım doğrudan FIRST Championship'e davet edilir.\n`;
            response += `- **Engineering Inspiration Award:** Mühendislik kültürünü toplumda yaygınlaştıran, çevresine ilham veren takıma verilir. Kazanan takım FIRST Championship'e davet edilir.\n`;
            response += `- **Rookie All-Star Award:** Yılın en başarılı çaylak (rookie) takımına verilir. İlk yılında ortaya koyduğu performans, robot tasarımı ve topluluk etkisi değerlendirilir.\n`;
            response += `- **Rookie Inspiration Award:** Çaylak takımlar arasında FIRST ruhunu ve ilhamı en iyi yansıtana verilir.\n\n`;
            
            response += `**Robot Performansı Ödülleri:**\n`;
            response += `- **Autonomous Award:** En iyi otonom periyot performansını gösteren takıma verilir.\n`;
            response += `- **Quality Award:** Sağlam, güvenilir ve kaliteli robot tasarımı ile öne çıkan takıma verilir.\n`;
            response += `- **Industrial Design Award:** Endüstriyel tasarım mükemmelliği, estetik ve işlevsellik dengesiyle ödüllendirilir.\n`;
            response += `- **Innovation in Control Award:** Kontrol sisteminde yenilikçi ve yaratıcı çözümler sunan takıma verilir.\n`;
            response += `- **Creativity Award:** Yaratıcı tasarım veya benzersiz strateji kullanan takıma verilir.\n\n`;
            
            response += `**Ruh ve Değer Ödülleri:**\n`;
            response += `- **Gracious Professionalism Award:** FIRST'ün "Duyarlı Profesyonellik" değerini en iyi temsil eden takıma verilir.\n`;
            response += `- **Team Spirit Award:** Büyük coşku, takım ruhu ve sportmenlik sergileyen takıma verilir.\n`;
            response += `- **Imagery Award:** Marka imajı, takım kimliği ve görsel sunumda üstün başarı gösteren takıma verilir.\n`;
            response += `- **Judges Award:** Jüri tarafından özel olarak seçilen, diğer kategorilere girmeyen benzersiz başarıyı ödüllendiren ödül.\n\n`;
            
            response += `**Yarışma Ödülleri:**\n`;
            response += `- **Winner:** Turnuva finalini kazanan ittifak üyelerine verilir.\n`;
            response += `- **Finalist:** Turnuva finalinde ikinci olan ittifak üyelerine verilir.\n\n`;
            
            response += `GulfTech olarak hedefimiz bu ödülleri takımımıza kazandırmak! 🏆`;
            
            return response;
        }
    },
    {
        name: 'yaratan',
        match: (msg) => trMatch(msg, /seni kim.*yapti|yaraticin.*kim|kim.*gelistirdi|seni kim.*kodladi/),
        handle: async (msg, data, knowledge) => {
            return `Ben, GulfTech #11392 takımında bulunan **Oğuzhan Aşkın** tarafından geliştirildim. 🦈\n\nTakımımızı dijital dünyaya taşımak için buradayım!`;
        }
    },
    {
        name: 'first_vakfi',
        match: (msg) => trMatch(msg, /first|fikret|fyv|vakif|yuksel|frcturkiye/),
        handle: async (msg, data, knowledge) => {
            const fi = knowledge.first_bilgisi || {};
            const progs = fi.programlar || {};
            const fyk = knowledge.fikret_yuksel_vakfi || {};
            const kh = fyk.kurucu_hakkinda || {};
            const wp = knowledge.web_sitesi_sayfalari || {};

            return `### 🌐 FIRST Vakfı & Fikret Yüksel Vakfı (FYV)\n\n` +
                `#### 1. FIRST Vakfı (For Inspiration and Recognition of Science and Technology)\n` +
                `**Kurucu:** ${fi.kurucu || 'Dean Kamen'} (1989, Manchester, ABD)\n` +
                `**Misyon:** Gençlere STEM (Bilim, Teknoloji, Mühendislik, Matematik) sevgisini, liderlik becerilerini ve özgüveni kazandırmak.\n` +
                `**Slogan:** *"More Than Robots" (Robotlardan Fazlası)*\n\n` +
                `**Temel Değerler & Programlar:**\n` +
                `- 🤝 **Duyarlı Profesyonellik (Gracious Professionalism):** Saygı, yardımseverlik ve yüksek etik değerlerle yarışma felsefesi.\n` +
                `- 🏆 **Rekabetçi İş Birliği (Coopertition):** Rakiplerle bilgi paylaşıp birlikte gelişme anlayışı.\n` +
                `- 🤖 **FRC (FIRST Robotics Competition):** 14-18 yaş lise öğrencilerinin endüstriyel boyutlarda robot geliştirdiği dünyanın en prestijli ligi.\n` +
                `- ⚙️ **FTC (FIRST Tech Challenge):** 12-18 yaş esnek robotik ligi.\n` +
                `- 🧱 **FLL (FIRST LEGO League):** 4-16 yaş çocuklara yönelik araştırma ve LEGO ligi.\n\n` +
                `---\n\n` +
                `#### 2. Fikret Yüksel Vakfı (FYV) & FRC Türkiye\n` +
                `**Kurucu:** Darüşşafaka ve İTÜ/MIT/Harvard mezunu vizyoner mühendis **${kh.isim || 'Fikret Yüksel'}** (1998)\n` +
                `**Misyon:** Türk gençlerinin eğitimini desteklemek ve onları FIRST robotik programları vasıtasıyla 21. yüzyıl becerileriyle buluşturmak.\n\n` +
                `**Türkiye'deki Etkisi & Faaliyetleri:**\n` +
                `- **Öncü Adım:** 2008'de Darüşşafaka'da Türkiye'nin ilk FRC takımı kurulmasını destekleyerek kıvılcımı başlattı.\n` +
                `- **Resmi Turnuvalar:** 2015'teki ilk Off-Season'ın ardından 2018'den beri İstanbul, Ankara ve İzmir Bölgesel (Regional) turnuvalarını organize etmektedir.\n` +
                `- **Büyüme:** Türkiye, %37'lik yıllık büyüme oranıyla dünya genelinde en hızlı büyüyen FRC ülkesidir.\n` +
                `- **Destekler:** Takımlara burs, malzeme/kit desteği, eğitim panelleri, yarışma organizasyonu ve mentorluk sunar.\n\n` +
                `---\n\n` +
                `#### 🚀 Güncel & Gelecek Sezonlar:\n` +
                `- **2026 Sezonu:** REBUILT (Fuel yakıtları ve kule tırmanışı)\n` +
                `- **2027 Sezonu:** **BIOCORE™ (FIRST® CANOPY™)** — Biyoçeşitlilik ve yaşamı destekleyen sistemler odaklı yeni FRC sezonu (Kickoff: 9 Ocak 2027)\n\n` +
                `📌 **Resmi Kaynaklar ve İnceleme:**\n` +
                `- 🌐 FIRST Global Resmi Portalı: [firstinspires.org/programs/frc](https://www.firstinspires.org/programs/frc/)\n` +
                `- 🇹🇷 FRC Türkiye Resmi Sitesi: [frcturkiye.org](https://frcturkiye.org/)\n` +
                `- 🏢 Fikret Yüksel Vakfı: [fikretyukselfoundation.org](https://fikretyukselfoundation.org)\n` +
                `- 🌐 GulfTech FRC Rehberi: [GulfTech FRC Portalı](${wp.frc_nedir || 'https://gulftechrobotic.com.tr/frcnedir.html'})`;
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
                gk.map(k => `- ${k}`).join('\n') + `\n\n🔧`;
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
                `*Strateji masasında kazanılır, sahada yürütülür!*`;
        }
    }
];
