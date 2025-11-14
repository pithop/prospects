import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Same thirdPartyDomains list as prospects.js
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { items, city } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Aucun item JSON fourni' });
  }

  try {
    const extractCityFromAddress = (address) => {
      if (!address) return null;
      // Try to find "postalcode City" pattern or take last comma segment
      try {
        // If address contains a 5-digit postal code followed by city
        const postalMatch = address.match(/(\d{5})\s+([A-Za-zÀ-ÖØ-öø-ÿ \-']+)/);
        if (postalMatch && postalMatch[2]) return postalMatch[2].trim();

        const parts = address.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 1) {
          // often last part contains postal code + city or city
          const last = parts[parts.length - 1];
          // remove leading postal if exists
          const lastClean = last.replace(/^(\d{2,5})\s*/,'').trim();
          return lastClean || null;
        }
      } catch (e) {
        return null;
      }
      return null;
    };

    const toInsert = items.map((it) => {
      const name = it.name || it.title || it.nom || it.place || it.place_id || '';
      const phone = it.phone || it.telephone || it.tel || it.phone_number || null;
      const website = it.website || it.site || it.url || null;
      // category: prefer main_category, then first of categories if comma-separated, then generic
      let category = 'Non spécifié';
      if (it.main_category) category = it.main_category;
      else if (it.category) category = it.category;
      else if (it.categories) {
        if (Array.isArray(it.categories) && it.categories.length) category = it.categories[0];
        else if (typeof it.categories === 'string') category = it.categories.split(',')[0].trim();
      }
      const rating = Number(it.rating || it.note || 0) || 0;
      const reviews = parseInt(it.reviews || it.avis || it.reviews_count || 0) || 0;
      const notes = it.description || it.notes || it.comment || '';
      // Determine city from several possible fields (city, ville, address, query)
      let itemCity = it.city || it.ville || city || null;
      if (!itemCity && it.address) itemCity = extractCityFromAddress(it.address);
      if (!itemCity && it.query) {
        // try to extract tokens after last space or hyphen (e.g., "restaurant aix-en-provence")
        const q = String(it.query || '').replace(/_/g,' ').trim();
        const tokens = q.split(/[\s,-]+/).filter(Boolean);
        if (tokens.length >= 2) {
          // take last two tokens to handle multi-word cities
          itemCity = tokens.slice(-2).join(' ');
        } else if (tokens.length === 1) itemCity = tokens[0];
      }

      const isThirdParty = website ? thirdPartyDomains.some(domain => website.includes(domain)) : false;
      const hasRealWebsite = website && !isThirdParty;
      const isProspect = !hasRealWebsite;

      return {
        name,
        phone,
        website: website || null,
        city: itemCity || null,
        category,
        rating,
        reviews,
        is_third_party: isThirdParty,
        has_website: hasRealWebsite,
        is_prospect_to_contact: isProspect,
        notes,
        contacted: false,
        contact_date: null,
        status: 'nouveau'
      };
    });

    const { data, error } = await supabase.from('prospects').insert(toInsert);
    if (error) {
      const msg = error.message || '';
      const createTableSQL = `-- Run this SQL in Supabase SQL editor to create the \`prospects\` table\nCREATE TABLE prospects (\n  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,\n  name VARCHAR(255) NOT NULL,\n  phone VARCHAR(50),\n  website VARCHAR(512),\n  city VARCHAR(255),\n  category VARCHAR(100),\n  rating NUMERIC(3,1) DEFAULT 0,\n  reviews INTEGER DEFAULT 0,\n  notes TEXT,\n  is_third_party BOOLEAN DEFAULT FALSE,\n  has_website BOOLEAN DEFAULT FALSE,\n  is_prospect_to_contact BOOLEAN DEFAULT FALSE,\n  contacted BOOLEAN DEFAULT FALSE,\n  contact_date TIMESTAMP,\n  status VARCHAR(50) DEFAULT 'nouveau',\n  created_at TIMESTAMP DEFAULT NOW(),\n  updated_at TIMESTAMP DEFAULT NOW()\n);`;
      if (/Could not find the table|relation .*prospects.* does not exist|does not exist/i.test(msg)) {
        return res.status(500).json({ error: 'Table `prospects` not found in your Supabase project. Create it using the provided SQL.', sql: createTableSQL });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ inserted: data.length, data });
  } catch (err) {
    console.error('Import error', err);
    return res.status(500).json({ error: err.message });
  }
}

// Allow larger payloads (the JSON file can be several MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};
