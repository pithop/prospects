-- ============================================================================
-- ProspectHub V2 — Schema ENRICHI
-- Run this script in the Supabase SQL Editor
-- ⚠️ ATTENTION: Ce script SUPPRIME et RECREE la table prospects_v2
-- ============================================================================

-- 1. Purge complète
DROP TABLE IF EXISTS prospects_v2 CASCADE;

-- 2. Création de la table enrichie
CREATE TABLE prospects_v2 (
    -- Identifiant unique Uber Eats (TEXT car pas toujours un vrai UUID PostgreSQL)
    uber_store_uuid TEXT PRIMARY KEY,
    
    -- Informations de base
    restaurant_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    city VARCHAR(255),
    address TEXT,
    
    -- Contact (les données les plus importantes pour la prospection)
    phone_number VARCHAR(50),
    email VARCHAR(255),
    
    -- Présence en ligne
    uber_eats_url TEXT,
    website_url_found TEXT,
    has_independent_website BOOLEAN DEFAULT FALSE,
    google_maps_url TEXT,
    
    -- Géolocalisation
    latitude FLOAT,
    longitude FLOAT,
    
    -- Réputation & Popularité
    rating NUMERIC(2,1),           -- Rating Google Maps (ex: 4.5)
    reviews_count INTEGER,          -- Nombre d'avis Google
    uber_eats_rating NUMERIC(2,1), -- Rating Uber Eats (ex: 4.7)
    price_range VARCHAR(10),        -- Gamme de prix Uber (€, €€, €€€)
    
    -- Informations opérationnelles
    opening_hours TEXT,             -- Horaires d'ouverture (format texte)
    
    -- CRM / Suivi commercial
    contact_status VARCHAR(50) DEFAULT 'new',  -- new, contacted, interested, not_interested, client
    notes TEXT,                     -- Notes libres du commercial
    
    -- Métadonnées
    last_enriched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    audit_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Index pour les requêtes fréquentes
CREATE INDEX idx_pv2_city ON prospects_v2(city);
CREATE INDEX idx_pv2_contact_status ON prospects_v2(contact_status);
CREATE INDEX idx_pv2_has_website ON prospects_v2(has_independent_website);
CREATE INDEX idx_pv2_rating ON prospects_v2(rating);

-- 4. Row Level Security
ALTER TABLE prospects_v2 ENABLE ROW LEVEL SECURITY;

-- Policies permissives (pour le développement)
CREATE POLICY "Allow anonymous read access" ON prospects_v2 FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON prospects_v2 FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON prospects_v2 FOR UPDATE USING (true);

-- ============================================================================
-- Instructions:
-- 1. Aller dans Supabase Dashboard > SQL Editor
-- 2. Coller ce script et cliquer "Run"
-- 3. Vérifier la table dans Table Editor (les anciens 47 prospects seront supprimés)
-- ============================================================================
