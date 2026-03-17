const { handlers } = require('./js/handlers_cjs.js');

const mockKnowledge = {
    takim_kimligi: {
        isim: 'Gulf Tech #11392',
        frc_nedir: { tanim: 'Test FRC' },
        sosyal_aglar: { instagram: 'inst', youtube: 'yt', website: 'web' }
    }
};

const mockData = {};

function test(msg) {
    const lowMsg = msg.toLowerCase();
    const k = mockKnowledge.takim_kimligi;
    for (const h of handlers) {
        let match = false;
        if (typeof h.match === 'function') {
            match = h.match(lowMsg, k, mockKnowledge);
        } else if (h.match instanceof RegExp) {
            match = h.match.test(lowMsg);
        }
        if (match) {
            console.log(\`Matched: \${h.name} for "\${msg}"\`);
            return;
        }
    }
    console.log(\`No match for "\${msg}"\`);
}

test('İletişim');
test('iletişim');
test('FRC nedir?');
test('frc');
