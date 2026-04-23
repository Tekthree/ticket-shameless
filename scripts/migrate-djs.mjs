import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { config } from 'node:process'

// Load DATABASE_URL from .env.local manually
const envFile = readFileSync('.env.local', 'utf8')
const dbMatch = envFile.match(/^DATABASE_URL=(.+)$/m)
if (!dbMatch) { console.error('DATABASE_URL not found in .env.local'); process.exit(1) }
const DATABASE_URL = dbMatch[1].trim().replace(/^["']|["']$/g, '')

const sql = neon(DATABASE_URL)

const statements = [
  `CREATE TABLE IF NOT EXISTS djs (
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
  )`,
  `ALTER TABLE lineup ADD COLUMN IF NOT EXISTS dj_id UUID REFERENCES djs(id) ON DELETE SET NULL`,
  `CREATE INDEX IF NOT EXISTS idx_djs_slug ON djs(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_djs_published ON djs(is_published)`,
  `CREATE INDEX IF NOT EXISTS idx_lineup_dj_id ON lineup(dj_id)`,
]

for (const stmt of statements) {
  try {
    await sql.query(stmt)
    console.log('OK:', stmt.trim().split('\n')[0].slice(0, 70))
  } catch (e) {
    console.error('ERR:', stmt.trim().slice(0, 70), '->', e.message)
  }
}
console.log('\nMigration complete.')
