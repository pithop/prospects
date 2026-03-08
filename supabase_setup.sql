-- ============================================================================
-- Supabase Setup for ProspectHub
-- Run this SQL in Supabase SQL Editor to:
--   1. Create the `prospects` table
--   2. Enable RLS and create permissive policies (for development)
-- ============================================================================

-- Drop table if exists (optional, only if re-creating)
-- DROP TABLE IF EXISTS prospects CASCADE;

-- 1. Create the prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website VARCHAR(512),
  city VARCHAR(255),
  category VARCHAR(100),
  address VARCHAR(512),
  latitude NUMERIC,
  longitude NUMERIC,
  google_maps_url TEXT,
  rating NUMERIC(3,1) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  notes TEXT,
  is_third_party BOOLEAN DEFAULT FALSE,
  has_website BOOLEAN DEFAULT FALSE,
  is_prospect_to_contact BOOLEAN DEFAULT FALSE,
  contacted BOOLEAN DEFAULT FALSE,
  contact_date TIMESTAMP,
  popular_times JSONB,
  best_time_to_call VARCHAR(255),
  status VARCHAR(50) DEFAULT 'nouveau',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- 3. Create permissive policies for development
-- These policies allow any authenticated OR unauthenticated user to perform operations
-- (For production, use more restrictive policies based on user roles/auth)

-- Policy: Allow SELECT for all users
DROP POLICY IF EXISTS "Allow SELECT for all users" ON prospects;
CREATE POLICY "Allow SELECT for all users" ON prospects
  FOR SELECT
  USING (true);

-- Policy: Allow INSERT for authenticated users only
DROP POLICY IF EXISTS "Allow INSERT for authenticated users only" ON prospects;
CREATE POLICY "Allow INSERT for authenticated users only" ON prospects
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Allow UPDATE for authenticated users only
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users only" ON prospects;
CREATE POLICY "Allow UPDATE for authenticated users only" ON prospects
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Allow DELETE for authenticated users only
DROP POLICY IF EXISTS "Allow DELETE for authenticated users only" ON prospects;
CREATE POLICY "Allow DELETE for authenticated users only" ON prospects
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 4. Create indexes for common queries (optional, improves performance)
CREATE INDEX IF NOT EXISTS idx_prospects_city ON prospects(city);
CREATE INDEX IF NOT EXISTS idx_prospects_is_prospect_to_contact ON prospects(is_prospect_to_contact);
CREATE INDEX IF NOT EXISTS idx_prospects_contacted ON prospects(contacted);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);

-- ============================================================================
-- Instructions:
-- 1. Go to Supabase Dashboard > Your Project > SQL Editor
-- 2. Create a new query and paste this entire file
-- 3. Click "Run"
-- 4. Verify: You should see the `prospects` table in Table Editor (left panel)
-- 5. In Supabase Console > Authentication > Policies, you should see 4 new policies
-- 6. Go back to your Next.js app and restart: npm run dev
-- 7. Try importing the JSON file again
-- ============================================================================
-- ============================================================================
-- 5. Performance Optimization: RPC for Cities
-- ============================================================================
CREATE OR REPLACE FUNCTION get_distinct_cities()
RETURNS TABLE (city text)
LANGUAGE sql
AS $$
  SELECT DISTINCT city
  FROM prospects
  WHERE city IS NOT NULL AND city != ''
  ORDER BY city;
$$;

-- ============================================================================
-- 6. Analytics: RPC for Dashboard Stats
-- ============================================================================
CREATE OR REPLACE FUNCTION get_status_distribution()
RETURNS TABLE (status text, count bigint)
LANGUAGE sql
AS $$
  SELECT status, COUNT(*) as count
  FROM prospects
  GROUP BY status;
$$;

CREATE OR REPLACE FUNCTION get_top_cities()
RETURNS TABLE (city text, count bigint)
LANGUAGE sql
AS $$
  SELECT city, COUNT(*) as count
  FROM prospects
  WHERE city IS NOT NULL
  GROUP BY city
  ORDER BY count DESC
  LIMIT 5;
$$;

-- Instructions: https://supabase.com/docs/guides/database/functions
-- Run this entire script in Supabase SQL Editor.

-- ============================================================================
-- 7. Geolocation: RPC for Nearby Prospects (Haversine Formula)
-- ============================================================================
-- NOTE: If the pg_trgm or postgis extension is available, those are better, 
-- but this SQL-only Haversine works fine for thousands of rows.
CREATE OR REPLACE FUNCTION get_nearby_prospects(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision,
  max_limit integer
)
RETURNS TABLE (
  id bigint,
  name text,
  phone text,
  website text,
  city text,
  category text,
  address text,
  latitude numeric,
  longitude numeric,
  rating numeric,
  reviews integer,
  has_website boolean,
  is_prospect_to_contact boolean,
  status text,
  distance_km double precision
)
LANGUAGE sql
AS $$
  SELECT 
    p.id, p.name::text, p.phone::text, p.website::text, p.city::text, p.category::text, p.address::text, p.latitude, p.longitude, p.rating, p.reviews, p.has_website, p.is_prospect_to_contact, p.status::text,
    -- Haversine formula for distance in kilometers
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.latitude::double precision)) *
        cos(radians(p.longitude::double precision) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(p.latitude::double precision))
      )
    ) AS distance_km
  FROM prospects p
  WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
  AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.latitude::double precision)) *
        cos(radians(p.longitude::double precision) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(p.latitude::double precision))
      )
  ) <= radius_km
  ORDER BY distance_km ASC
  LIMIT max_limit;
$$;
