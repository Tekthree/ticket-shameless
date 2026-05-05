-- DJ aliases + resident flag
-- Run against Neon DB after 004_dj_profiles.sql

ALTER TABLE djs ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';
ALTER TABLE djs ADD COLUMN IF NOT EXISTS is_resident BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_djs_aliases ON djs USING GIN(aliases);
