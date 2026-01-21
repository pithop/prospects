import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let allCities = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        // Loop to fetch ALL cities (Supabase limit is 1000 per request)
        while (hasMore) {
            const { data, error } = await supabase
                .from('prospects')
                .select('city')
                .not('city', 'is', null)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) throw error;

            if (data.length > 0) {
                allCities = allCities.concat(data.map(item => item.city));
                if (data.length < pageSize) hasMore = false;
                page++;
            } else {
                hasMore = false;
            }
        }

        // Processing: Deduplicate, Clean, and Sort
        const uniqueCities = [...new Set(
            allCities
                .filter(Boolean)
                .map(c => {
                    // Start Cleaning Logic
                    // 1. Remove "邮政编码: 75014" etc. (Chinese characters + zip)
                    // 2. Remove ZIP codes at the end if redundant "Paris 75001" -> "Paris" (Optional but sometimes clean)
                    // Let's stick to user request: "Al Capri邮政编码..." needs cleaning.
                    let clean = c;

                    // Remove Chinese characters and following text
                    clean = clean.replace(/[\u4e00-\u9fa5].*/g, '').trim();

                    return clean;
                })
                .filter(c => c.length > 1) // Remove Garbage
        )].sort();

        return res.status(200).json(uniqueCities);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
