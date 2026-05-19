import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * V2 Cities — Distinct cities from `prospects_v2` only.
 * Completely independent from the legacy `/api/cities`.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase.from('prospects_v2').select('city');

    if (error) return res.status(500).json({ error: error.message });

    const cities = (data || [])
      .map(r => r.city)
      .filter(Boolean)
      .map(c => c.trim())
      .filter(c => c.length > 1)
      .filter((v, i, a) => a.indexOf(v) === i) // dedupe
      .sort();

    return res.status(200).json(cities);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
