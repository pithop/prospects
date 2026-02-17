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
        // PERFORMANCE: Use RPC instead of fetching all rows
        // Requires 'get_distinct_cities' function in Supabase (see supabase_setup.sql)
        const { data, error } = await supabase.rpc('get_distinct_cities');

        if (error) {
            console.error('RPC Error:', error);
            // Fallback for development if function doesn't exist yet
            // This is the old slow method, kept just in case, but ideally we rely on RPC
            // For now, let's just error out or return empty to force the optimization
            // Actually, better to throw to see the issue
            throw error;
        }

        // Optional post-processing if needed (the SQL does most of it)
        // SQL handles distinct and not null.
        // We might still want to clean garbage if not done in SQL (SQL did basic check)

        const cleanCities = data
            .map(item => item.city)
            .filter(c => c && c.length > 1)
            // Clean Chinese chars if any slipped through (though SQL could do regex)
            .map(c => c.replace(/[\u4e00-\u9fa5].*/g, '').trim())
            .filter(Boolean)
            // Dedupe again just in case cleanup made them identical
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort();

        return res.status(200).json(cleanCities);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
