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

    // Fix 1000 row limit: Increase fetch limit for stats
    const { data, error } = await supabase.from('prospects').select('*').limit(100000);

    if (error) {
      const msg = error.message || '';
      if (/Could not find the table|relation .*prospects.* does not exist|does not exist/i.test(msg)) {
        return res.status(500).json({ error: 'Table `prospects` not found in your Supabase project. Create it using the provided SQL.', sql: createTableSQL });
      }
      throw error;
    }

    // Handle RLS policies that may return null
    if (!data) {
      return res.status(500).json({ error: 'RLS policies may be blocking SELECT. Run supabase_setup.sql to enable policies.' });
    }

    // Calculer les statistiques
    const stats = {
      total: data.length,
      prospectContacter: data.filter(p => p.is_prospect_to_contact).length,
      avecSiteWeb: data.filter(p => p.has_website).length,
      avecSiteTiers: data.filter(p => p.is_third_party).length,
      contactes: data.filter(p => p.contacted).length,
      nonContactes: data.filter(p => !p.contacted).length,
      ratingMoyen: data.length > 0
        ? (data.reduce((sum, p) => sum + (p.rating || 0), 0) / data.length).toFixed(1)
        : 0,
      totalAvis: data.reduce((sum, p) => sum + (p.reviews || 0), 0),
      categoriess: [...new Set(data.map(p => p.category))].length
    };

    return res.status(200).json(stats);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
