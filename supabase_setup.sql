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
  rating NUMERIC(3,1) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  notes TEXT,
  is_third_party BOOLEAN DEFAULT FALSE,
  has_website BOOLEAN DEFAULT FALSE,
  is_prospect_to_contact BOOLEAN DEFAULT FALSE,
  contacted BOOLEAN DEFAULT FALSE,
  contact_date TIMESTAMP,
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
CREATE POLICY "Allow SELECT for all users" ON prospects
  FOR SELECT
  USING (true);

-- Policy: Allow INSERT for all users
CREATE POLICY "Allow INSERT for all users" ON prospects
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow UPDATE for all users
CREATE POLICY "Allow UPDATE for all users" ON prospects
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow DELETE for all users
CREATE POLICY "Allow DELETE for all users" ON prospects
  FOR DELETE
  USING (true);

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
