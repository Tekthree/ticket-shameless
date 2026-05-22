// Fix Deck'd Out 2026 lineups:
// - Publish headliner DJs
// - Add missing social links + bio
// - Add missing lineup entries (Event #2: Brandon Keys, Event #4: all DJs)
import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)

function makeSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function upsertDJ(slug, name, extra = {}) {
  const rows = await sql`
    INSERT INTO djs (slug, name, bio, soundcloud_url, instagram_url, website_url, is_published)
    VALUES (${slug}, ${name}, ${extra.bio ?? null}, ${extra.soundcloud_url ?? null}, ${extra.instagram_url ?? null}, ${extra.website_url ?? null}, true)
    ON CONFLICT (slug) DO UPDATE SET
      is_published = true,
      bio = COALESCE(EXCLUDED.bio, djs.bio),
      soundcloud_url = COALESCE(EXCLUDED.soundcloud_url, djs.soundcloud_url),
      instagram_url = COALESCE(EXCLUDED.instagram_url, djs.instagram_url),
      website_url = COALESCE(EXCLUDED.website_url, djs.website_url)
    RETURNING id, slug, name, (xmax = 0) AS is_new
  `
  return rows[0]
}

async function addLineup(eventId, djId, name) {
  // Check if already in lineup
  const existing = await sql`
    SELECT id FROM lineup WHERE event_id = ${eventId} AND name ILIKE ${name}
  `
  if (existing.length > 0) {
    console.log(`  [skip] ${name} already in lineup`)
    return
  }
  await sql`
    INSERT INTO lineup (event_id, dj_id, name)
    VALUES (${eventId}, ${djId ?? null}, ${name})
    ON CONFLICT DO NOTHING
  `
  console.log(`  [added] ${name} to lineup`)
}

async function run() {
  // Event IDs
  const EVENT2 = '93dd13ba-e558-45a4-9dc4-7a3e58dacb6c' // Deck'd Out #2
  const EVENT4 = '9cc736c2-3f81-4f36-8c74-0c0fad0c7581' // Deck'd Out #4

  // ── 1. Publish all headliner DJs + update missing social links ────────────
  console.log('\n── Publishing headliner DJs ──')

  await sql`UPDATE djs SET is_published = true WHERE slug = 'shvili'`
  console.log('  published: Shvili')

  await sql`UPDATE djs SET is_published = true WHERE slug = 'sky-rivers'`
  console.log('  published: Sky Rivers')

  await sql`
    UPDATE djs SET
      is_published = true,
      soundcloud_url = COALESCE(soundcloud_url, 'https://soundcloud.com/fatsouls-records')
    WHERE slug = 'dj-said'
  `
  console.log('  published + SC: DJ Said')

  await sql`UPDATE djs SET is_published = true WHERE slug = 'jason-peters'`
  console.log('  published: Jason Peters')

  await sql`UPDATE djs SET is_published = true WHERE slug = 'garth'`
  console.log('  published: Garth')

  await sql`UPDATE djs SET is_published = true WHERE slug = 'gene-hunt'`
  console.log('  published: Gene Hunt')

  await sql`UPDATE djs SET is_published = true WHERE slug = 'cami-jones'`
  console.log('  published: Cami Jones')

  await sql`
    UPDATE djs SET
      is_published = true,
      bio = COALESCE(NULLIF(bio, ''), 'Brazilian DJ selecta duo KA and MATA, bringing global sounds and deep grooves to the dancefloor.')
    WHERE slug = 'mango-ginger'
  `
  console.log('  published + bio: Mango & Ginger')

  // ── 2. Event #2 — add BRANDON KEYS ───────────────────────────────────────
  console.log('\n── Event #2 — adding missing DJs ──')

  const brandonKeys = await upsertDJ('brandon-keys', 'BRANDON KEYS')
  await addLineup(EVENT2, brandonKeys.id, 'BRANDON KEYS')

  // ── 3. Event #4 — create missing DJs and add full lineup ─────────────────
  console.log('\n── Event #4 — adding full lineup ──')

  // Get existing DJ IDs
  const [parkerMills] = await sql`SELECT id FROM djs WHERE slug = 'parker-mills'`
  const [fouadMasoud] = await sql`SELECT id FROM djs WHERE slug = 'fouad-masoud'`
  const [jackiWhy] = await sql`SELECT id FROM djs WHERE slug = 'jacki-why'`

  // Create new DJs for event #4
  const bex = await upsertDJ('bexfromchicago', 'BEXFROMCHICAGO')
  const ska = await upsertDJ('ska', 'SKA')
  const harmonySoleil = await upsertDJ('harmony-soleil', 'HARMONY SOLEIL')
  const tootsie = await upsertDJ('tootsie', 'TOOTSIE')

  // Add headliner TBA (no DJ profile, just a placeholder entry)
  await addLineup(EVENT4, null, 'Headliner TBA (France)')
  await addLineup(EVENT4, parkerMills?.id ?? null, 'Parker Mills')
  await addLineup(EVENT4, fouadMasoud?.id ?? null, 'Fouad Masoud')
  await addLineup(EVENT4, bex.id, 'BEXFROMCHICAGO')
  await addLineup(EVENT4, ska.id, 'SKA')
  await addLineup(EVENT4, harmonySoleil.id, 'HARMONY SOLEIL')
  await addLineup(EVENT4, jackiWhy?.id ?? null, 'JACKI WHY')
  await addLineup(EVENT4, tootsie.id, 'TOOTSIE')

  console.log('\nDone!')
}

run().catch(e => { console.error(e); process.exit(1) })
