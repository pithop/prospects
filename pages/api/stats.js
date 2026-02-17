import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const createTableSQL = `-- Run this SQL in Supabase SQL editor to create the \`prospects\` table\nCREATE TABLE prospects (\n  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,\n  name VARCHAR(255) NOT NULL,\n  phone VARCHAR(50),\n  website VARCHAR(512),\n  city VARCHAR(255),\n  category VARCHAR(100),\n  rating NUMERIC(3,1) DEFAULT 0,\n  reviews INTEGER DEFAULT 0,\n  notes TEXT,\n  is_third_party BOOLEAN DEFAULT FALSE,\n  has_website BOOLEAN DEFAULT FALSE,\n  is_prospect_to_contact BOOLEAN DEFAULT FALSE,\n  contacted BOOLEAN DEFAULT FALSE,\n  contact_date TIMESTAMP,\n  status VARCHAR(50) DEFAULT 'nouveau',\n  created_at TIMESTAMP DEFAULT NOW(),\n  updated_at TIMESTAMP DEFAULT NOW()\n);`;

    // Optimized: Use parallel COUNT queries instead of fetching 10k rows
    // Optimized: Use parallel COUNT queries and RPCs
    const [
      { count: total },
      { data: statusDist },
      { data: topCities },
      { count: avecSiteWeb },
      { count: prospectContacter }
    ] = await Promise.all([
      supabase.from('prospects').select('*', { count: 'exact', head: true }),
      supabase.rpc('get_status_distribution'),
      supabase.rpc('get_top_cities'),
      supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('has_website', true),
      supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('is_prospect_to_contact', true)
    ]);

    // Format Status Distribution
    const statusMap = {};
    if (statusDist) {
      statusDist.forEach(item => {
        statusMap[item.status] = item.count;
      });
    }

    const stats = {
      total: total || 0,
      prospectContacter: prospectContacter || 0,
      avecSiteWeb: avecSiteWeb || 0,
      statusDistribution: statusMap,
      topCities: topCities || []
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Stats Error:", error);
    // Fallback if RPCs missing
    return res.status(500).json({
      error: error.message,
      hint: "Ensure get_status_distribution and get_top_cities RPCs are created in Supabase."
    });
  }
}
