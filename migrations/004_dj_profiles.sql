-- DJ Profiles
-- Run this against your Neon database

CREATE TABLE IF NOT EXISTS djs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  banner_image_url TEXT,
  location TEXT,
  genres TEXT[] DEFAULT '{}',
  soundcloud_url TEXT,
  instagram_url TEXT,
  spotify_url TEXT,
  youtube_url TEXT,
  mixcloud_url TEXT,
  website_url TEXT,
  seo_description TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link lineup entries to DJ profiles (optional — manual entries still work)
ALTER TABLE lineup ADD COLUMN IF NOT EXISTS dj_id UUID REFERENCES djs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_djs_slug ON djs(slug);
CREATE INDEX IF NOT EXISTS idx_djs_published ON djs(is_published);
CREATE INDEX IF NOT EXISTS idx_lineup_dj_id ON lineup(dj_id);
