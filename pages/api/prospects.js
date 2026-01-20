import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Domaines tiers (pour identifier prospects à contacter)
const thirdPartyDomains = [
  'facebook.com', 'instagram.com', 'linktr.ee', 'eatbu.com', 'wafflefactory.com',
  'ubereats.com', 'deliveroo.fr', 'tripadvisor.fr', 'pagesjaunes.fr', 'crepetouch.com',
  'just-eat.fr', 'thefork.fr', 'snapchat.com', 'tiktok.com', 'amorino.com',
  'goo.gle', 'bit.ly', 'tastycloud.menu', 'octotable.com', 'm.facebook.com',
  'webshop.fulleapps.io', 'surge.sh', 'jimdofree.com',
  'byclickeat.fr', 'dood.com', 'delicity.com', 'belorder.com', 'e-monsite.com',
  'commander1.com', 'wordpress.com', 'blogspot.com', 'sumupstore.com',
  'bento.me', 'wixsite.com', 'google.com', 'zenchef.com'
];

export default async function handler(req, res) {
  const createTableSQL = `-- Run this SQL in Supabase SQL editor to create the \`prospects\` table\nCREATE TABLE prospects (\n  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,\n  name VARCHAR(255) NOT NULL,\n  phone VARCHAR(50),\n  website VARCHAR(512),\n  city VARCHAR(255),\n  category VARCHAR(100),\n  rating NUMERIC(3,1) DEFAULT 0,\n  reviews INTEGER DEFAULT 0,\n  notes TEXT,\n  is_third_party BOOLEAN DEFAULT FALSE,\n  has_website BOOLEAN DEFAULT FALSE,\n  is_prospect_to_contact BOOLEAN DEFAULT FALSE,\n  contacted BOOLEAN DEFAULT FALSE,\n  contact_date TIMESTAMP,\n  status VARCHAR(50) DEFAULT 'nouveau',\n  created_at TIMESTAMP DEFAULT NOW(),\n  updated_at TIMESTAMP DEFAULT NOW()\n);`;
  if (req.method === 'GET') {
    // Récupérer tous les prospects avec pagination
    const limit = req.query.limit ? parseInt(req.query.limit) : 1000;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;

    const search = req.query.search || '';

    console.log(`API Fetch: Limit=${limit}, Offset=${offset}, Search="${search}"`); // DEBUG LOG

    // IMPORTANT: Sort by Hot Leads first, then ID for stable pagination
    let query = supabase
      .from('prospects')
      .select('*', { count: 'exact' });

    // 1. City Filter (Exact Match) - PRIORITIZED for performance
    if (req.query.city && req.query.city !== 'All') {
      query = query.eq('city', req.query.city);
    }

    // 2. Generic Search
    if (search) {
      // Search in name, city, or category
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,category.ilike.%${search}%`);
    }

    query = query
      .order('is_prospect_to_contact', { ascending: false })
      .order('id', { ascending: true });

    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;
    if (error) {
      // Help user if table is missing
      const msg = error.message || '';
      if (/Could not find the table|relation .*prospects.* does not exist|does not exist/i.test(msg)) {
        return res.status(500).json({ error: 'Table `prospects` not found in your Supabase project. Create it using the provided SQL.', sql: createTableSQL });
      }
      return res.status(500).json({ error: error.message });
    }
    // Handle RLS policies that may return null
    if (!data) {
      return res.status(500).json({ error: 'RLS policies may be blocking SELECT. Run supabase_setup.sql to enable policies.' });
    }
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    // Créer un prospect
    const { name, phone, website, category, rating, reviews, notes, city, address, google_maps_url, popular_times, best_time_to_call } = req.body;

    // Déterminer si c'est un prospect à contacter
    const isThirdParty = website ? thirdPartyDomains.some(domain => website.includes(domain)) : false;
    const hasRealWebsite = website && !isThirdParty;
    const isProspect = !hasRealWebsite; // À contacter pour site web

    const { data, error } = await supabase.from('prospects').insert([
      {
        name,
        phone,
        website: website || null,
        city: city || null,
        address: address || null,
        google_maps_url: google_maps_url || null,
        popular_times: popular_times || null,
        best_time_to_call: best_time_to_call || null,
        category: category || 'Non spécifié',
        rating: rating || 0,
        reviews: reviews || 0,
        is_third_party: isThirdParty,
        has_website: hasRealWebsite,
        is_prospect_to_contact: isProspect, // Clé: c'est un prospect à contacter!
        notes: notes || '',
        contacted: false,
        contact_date: null,
        status: 'nouveau'
      }
    ]);

    if (error) {
      const msg = error.message || '';
      if (/Could not find the table|relation .*prospects.* does not exist|does not exist/i.test(msg)) {
        return res.status(500).json({ error: 'Table `prospects` not found in your Supabase project. Create it using the provided SQL.', sql: createTableSQL });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    // Mettre à jour un prospect
    const { id, ...updates } = req.body;
    const { data, error } = await supabase
      .from('prospects')
      .update(updates)
      .eq('id', id);

    if (error) {
      const msg = error.message || '';
      if (/Could not find the table|relation .*prospects.* does not exist|does not exist/i.test(msg)) {
        return res.status(500).json({ error: 'Table `prospects` not found in your Supabase project. Create it using the provided SQL.', sql: createTableSQL });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    // Supprimer un prospect
    const { id } = req.body;
    const { error } = await supabase.from('prospects').delete().eq('id', id);

    if (error) {
      const msg = error.message || '';
      if (/Could not find the table|relation .*prospects.* does not exist|does not exist/i.test(msg)) {
        return res.status(500).json({ error: 'Table `prospects` not found in your Supabase project. Create it using the provided SQL.', sql: createTableSQL });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Méthode non autorisée' });
}
