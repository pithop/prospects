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
        // Fetch unique cities efficiently
        // Note: Supabase/PostgREST doesn't support "DISTINCT" directly in the JS client easily 
        // without a stored procedure or raw SQL, but we can standard select and filter in code 
        // OR us rpc if we had one. 
        // A lighter approach for now: select city from prospects (head=false) to avoid heavy payload, 
        // but distinct is tricky. 
        // Alternative: Use a .csv() export or similar if huge, but for <100k rows, 
        // selecting just the city column is manageable if cached.

        // Better Approach: Use specific column selection
        const { data, error } = await supabase
            .from('prospects')
            .select('city')
            .not('city', 'is', null)
            .neq('city', '')
            .order('city', { ascending: true }); // We'll dedupe in JS for now as Supabase JS .distinct() is flaky

        if (error) throw error;

        // Deduplicate on server side to save bandwidth
        const uniqueCities = [...new Set(data.map(p => p.city))].sort();

        return res.status(200).json(uniqueCities);
    } catch (err) {
        console.error("Cities API Error:", err);
        return res.status(500).json({ error: err.message });
    }
}
