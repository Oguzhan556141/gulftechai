// Vercel Serverless Gateway for Gemini API
// Bu fonksiyon API anahtarınızı (GEMINI_API_KEY) güvenli bir şekilde sunucuda saklar.
// Ziyaretçiler asla API anahtarınızı göremez.

export default async function handler(req, res) {
    // CORS Başlıkları (GitHub Pages veya özel domainlerden gelen isteklere izin ver)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ 
            error: 'Sunucuda GEMINI_API_KEY ortam değişkeni tanımlanmamış. Lütfen Vercel / Cloudflare paneline ekleyin.' 
        });
    }

    try {
        const { model = 'gemini-2.0-flash', contents, system_instruction, generationConfig } = req.body;

        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction,
                contents,
                generationConfig: generationConfig || { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048 }
            })
        });

        const data = await geminiResponse.json();

        if (!geminiResponse.ok) {
            return res.status(geminiResponse.status).json(data);
        }

        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Gateway hatası: ' + err.message });
    }
}
