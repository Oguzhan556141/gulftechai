// Vercel Serverless Function: /api/instagram
// Automatically extracts public metrics for @gulftechtr without login credentials.

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const username = 'gulftechtr';

    // 1. Primary Strategy: Instagram Internal Web Profile Query
    try {
        const directUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
        const igRes = await fetch(directUrl, {
            headers: {
                'User-Agent': 'Instagram 219.0.0.12.117 Android',
                'X-IG-App-ID': '936619743392459',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            }
        });

        if (igRes.ok) {
            const data = await igRes.json();
            const user = data?.data?.user;
            if (user) {
                return res.status(200).json({
                    success: true,
                    source: 'instagram_direct',
                    username: username,
                    followers: user.edge_followed_by?.count ?? null,
                    following: user.edge_follow?.count ?? null,
                    posts: user.edge_owner_to_timeline_media?.count ?? null,
                    bio: user.biography ?? '',
                    updatedAt: new Date().toISOString()
                });
            }
        }
    } catch (e) {
        // Fallback to secondary strategies
    }

    // 2. Secondary Strategy: Public Web Scraping via Meta Tag parsing
    try {
        const pageUrl = `https://www.instagram.com/${username}/`;
        const pageRes = await fetch(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        if (pageRes.ok) {
            const html = await pageRes.text();
            // Regex match for: "991 Followers, 153 Following, 96 Posts"
            const descMatch = html.match(/content="([0-9.,KMkm]+)\s*Followers,\s*([0-9.,KMkm]+)\s*Following,\s*([0-9.,KMkm]+)\s*Posts/i);
            if (descMatch) {
                const parseNum = (str) => {
                    let s = str.trim().toUpperCase();
                    if (s.endsWith('K')) return Math.round(parseFloat(s.slice(0, -1).replace(',', '.')) * 1000);
                    if (s.endsWith('M')) return Math.round(parseFloat(s.slice(0, -1).replace(',', '.')) * 1000000);
                    return parseInt(s.replace(/[,.]/g, ''), 10);
                };

                return res.status(200).json({
                    success: true,
                    source: 'instagram_meta_tag',
                    username: username,
                    followers: parseNum(descMatch[1]),
                    following: parseNum(descMatch[2]),
                    posts: parseNum(descMatch[3]),
                    updatedAt: new Date().toISOString()
                });
            }
        }
    } catch (e) {}

    // 3. Fallback: Return structured fallback response indicating proxy wall status
    return res.status(200).json({
        success: false,
        source: 'fallback',
        username: username,
        message: 'Instagram doğrudan bot erişimini kısıtladı.',
        lastKnown: {
            followers: 991,
            following: 153,
            posts: 96
        },
        updatedAt: new Date().toISOString()
    });
}
