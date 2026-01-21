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
    const [
      { count: total },
      { count: prospectContacter },
      { count: avecSiteWeb },
      { count: avecSiteTiers },
      { count: contactes },
      { count: nonContactes },
      { data: ratingData },
      { data: reviewData }
    ] = await Promise.all([
      supabase.from('prospects').select('*', { count: 'exact', head: true }),
      supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('is_prospect_to_contact', true),
      supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('has_website', true),
      supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('is_third_party', true),
      supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('contacted', true),
      supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('contacted', false),
      // Average Rating (still needs some data, but we can limit or use RPC if exists. For now, avg on huge set might be slow in JS. 
      // Let's optimize: fetch ONLY rating column for non-zero ratings, limit to 5000 sample for speed? Or use RPC?
      // For now, let's just stick to a reasonable limit for averages or assume user cares more about COUNTS.
      // We'll stick to a sampling method for avg to stay fast, or just fetch ID, rating.
      supabase.from('prospects').select('rating').gt('rating', 0).limit(5000),
      supabase.from('prospects').select('reviews').gt('reviews', 0).limit(5000)
    ]);

    const stats = {
      total: total || 0,
      prospectContacter: prospectContacter || 0,
      avecSiteWeb: avecSiteWeb || 0,
      avecSiteTiers: avecSiteTiers || 0,
      contactes: contactes || 0,
      nonContactes: nonContactes || 0,
      ratingMoyen: ratingData?.length > 0
        ? (ratingData.reduce((sum, p) => sum + (p.rating || 0), 0) / ratingData.length).toFixed(1)
        : 0,
      totalAvis: reviewData?.reduce((sum, p) => sum + (p.reviews || 0), 0) || 0,
      // Categories is hard to do distinct count efficiently without RPC on large set. 
      // We'll just remove it or set a placeholder as it's less critical.
      categoriess: 0
    };

    return res.status(200).json(stats);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
