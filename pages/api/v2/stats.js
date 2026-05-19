import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * V2 Stats — Reads ONLY from `prospects_v2`.
 * Completely independent from the legacy `/api/stats`.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Parallel lightweight count queries
    const [
      { count: total },
      { count: avecSiteWeb },
      { count: sansWebsite },
      { data: allRows }
    ] = await Promise.all([
      supabase.from('prospects_v2').select('*', { count: 'exact', head: true }),
      supabase.from('prospects_v2').select('*', { count: 'exact', head: true }).eq('has_independent_website', true),
      supabase.from('prospects_v2').select('*', { count: 'exact', head: true }).eq('has_independent_website', false),
      supabase.from('prospects_v2').select('contact_status, city, rating, has_independent_website')
    ]);

    // Build status distribution
    const statusMap = {};
    const citiesMap = {};
    let withPhone = 0;
    let withEmail = 0;

    if (allRows) {
      allRows.forEach(row => {
        let status = row.contact_status || 'new';
        if (status === 'new') status = 'nouveau';
        statusMap[status] = (statusMap[status] || 0) + 1;

        if (row.city) {
          citiesMap[row.city] = (citiesMap[row.city] || 0) + 1;
        }
      });
    }

    // Top cities sorted by count
    const topCities = Object.entries(citiesMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.status(200).json({
      total:              total || 0,
      avecSiteWeb:        avecSiteWeb || 0,
      prospectContacter:  sansWebsite || 0,   // "hot leads" = no independent website
      contactes:          (statusMap['contacted'] || 0) + (statusMap['interested'] || 0) + (statusMap['signed'] || 0),
      statusDistribution: statusMap,
      topCities
    });
  } catch (error) {
    console.error('V2 Stats Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
