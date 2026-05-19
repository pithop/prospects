import { createClient } from '@supabase/supabase-js';
import { thirdPartyDomains } from '../../../utils/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * V2 API — Works ONLY with the `prospects_v2` table (Montpellier enriched data).
 * Completely independent from the legacy `/api/prospects` endpoint.
 *
 * Frontend receives a normalised shape so existing components (ProspectList,
 * CRMCard, ProspectDossier, etc.) can consume V2 data without adaptation.
 */
export default async function handler(req, res) {
  const TABLE = 'prospects_v2';

  // ─── GET ───────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const limit  = parseInt(req.query.limit)  || 100;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';

    let query = supabase.from(TABLE).select('*', { count: 'exact' });

    // City filter
    if (req.query.city && req.query.city !== 'All') {
      query = query.eq('city', req.query.city);
    }

    // Status / delivery filters
    if (req.query.delivery === 'true') {
      // All V2 rows come from Uber Eats — filter those without their own site
      query = query.eq('has_independent_website', false);
    } else if (req.query.status) {
      switch (req.query.status) {
        case 'nouveau':
          query = query.eq('contact_status', 'new');
          break;
        case 'contacter':
          query = query.eq('has_independent_website', false).eq('contact_status', 'new');
          break;
        case 'contactes':
          query = query.neq('contact_status', 'new');
          break;
        default:
          query = query.eq('contact_status', req.query.status);
      }
    }

    // Text search
    if (search) {
      query = query.or(
        `restaurant_name.ilike.%${search}%,city.ilike.%${search}%,category.ilike.%${search}%`
      );
    }

    // Ordering & pagination
    query = query
      .order('has_independent_website', { ascending: true })   // opportunities first
      .order('rating', { ascending: false, nullsFirst: false }) // best‑rated first
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // Normalise to the shape the frontend expects
    const normalised = (data || []).map(normaliseRow);
    return res.status(200).json(normalised);
  }

  // ─── POST ──────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { name, phone, website, category, rating, reviews, notes, city, address, google_maps_url } = req.body;
    const uuid = 'custom-' + Math.random().toString(36).substr(2, 9);
    const isThirdParty = website ? thirdPartyDomains.some(d => website.includes(d)) : false;
    const hasRealWebsite = !!website && !isThirdParty;

    const { data, error } = await supabase.from(TABLE).insert([{
      uber_store_uuid: uuid,
      restaurant_name: name,
      phone_number: phone || null,
      website_url_found: website || null,
      has_independent_website: hasRealWebsite,
      city: city || null,
      address: address || null,
      category: category || 'Non spécifié',
      rating: rating || 0,
      reviews_count: reviews || 0,
      notes: notes || '',
      contact_status: 'new',
      google_maps_url: google_maps_url || null,
    }]);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // ─── PUT ───────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id (uber_store_uuid)' });

    // Map frontend field names back to V2 column names
    const v2Updates = {};
    if (updates.status !== undefined) {
      v2Updates.contact_status = updates.status === 'nouveau' ? 'new' : updates.status;
    }
    if (updates.notes    !== undefined) v2Updates.notes        = updates.notes;
    if (updates.phone    !== undefined) v2Updates.phone_number = updates.phone;
    if (updates.email    !== undefined) v2Updates.email        = updates.email;
    if (updates.contacted !== undefined && updates.contacted) {
      v2Updates.contact_status = 'contacted';
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(v2Updates)
      .eq('uber_store_uuid', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // ─── DELETE ────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const { error } = await supabase.from(TABLE).delete().eq('uber_store_uuid', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}

// ─── Normaliser une row V2 en shape frontend ────────────────────────────
function normaliseRow(row) {
  let status = row.contact_status || 'nouveau';
  if (status === 'new') status = 'nouveau';

  return {
    id:                    row.uber_store_uuid,
    name:                  row.restaurant_name,
    phone:                 row.phone_number || '',
    email:                 row.email || '',
    website:               row.website_url_found || row.uber_eats_url || '',
    website_url_found:     row.website_url_found || '',
    city:                  row.city || '',
    address:               row.address || '',
    category:              row.category || '',
    rating:                row.rating ? parseFloat(row.rating) : 0,
    reviews:               row.reviews_count || 0,
    reviews_count:         row.reviews_count || 0,
    notes:                 row.notes || '',
    is_third_party:        !row.has_independent_website,
    has_website:           row.has_independent_website,
    is_prospect_to_contact:!row.has_independent_website,
    contacted:             row.contact_status !== 'new',
    status,
    latitude:              row.latitude,
    longitude:             row.longitude,
    google_maps_url:       row.google_maps_url || '',
    uber_eats_url:         row.uber_eats_url || '',
    opening_hours:         row.opening_hours || '',
    best_time_to_call:     row.opening_hours ? '10h - 11h30' : null,
    has_delivery_app:      true,           // all V2 rows originate from Uber Eats
    uber_eats_rating:      row.uber_eats_rating ? parseFloat(row.uber_eats_rating) : null,
    price_range:           row.price_range || '',
  };
}
