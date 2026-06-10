/**
 * 1. Link ALESSANDRO CARRABBA -> Alex Carrabba (approved)
 * 2. Upsert "Shameless Residents" DJ profile
 * 3. Link all "Shameless Residents" + "Residents" lineup entries to it
 */

import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const envPath = new URL('../.env.local', import.meta.url).pathname
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')] })
)
const sql = neon(envVars.DATABASE_URL)

// 1. Link Alessandro -> Alex Carrabba
await sql`
  UPDATE lineup
  SET dj_id = '0e19ccba-279d-4abb-a6c1-568c626844e7'
  WHERE id = '4773c5fd-28e5-4825-941d-5792123b3b50'
`
console.log('Linked ALESSANDRO CARRABBA -> alex-carrabba')

// 2. Upsert Shameless Residents profile
const existing = await sql`SELECT id FROM djs WHERE slug = 'shameless-residents' LIMIT 1`

let residentsId
if (existing.length > 0) {
  residentsId = existing[0].id
  console.log(`Shameless Residents profile already exists: ${residentsId}`)
} else {
  const [row] = await sql`
    INSERT INTO djs (slug, name, bio, location, genres, aliases, is_resident, is_published)
    VALUES (
      'shameless-residents',
      'Shameless Residents',
      'The resident DJs of Simply Shameless — the crew that holds down the dance floor at every party.',
      'Seattle, WA',
      ARRAY['House', 'Techno', 'Electronic'],
      ARRAY['Residents', 'Shameless DJs', 'Shameless Crew'],
      true,
      true
    )
    RETURNING id
  `
  residentsId = row.id
  console.log(`Created Shameless Residents profile: ${residentsId}`)
}

// 3. Link all Residents-type lineup entries
const result = await sql`
  UPDATE lineup
  SET dj_id = ${residentsId}
  WHERE dj_id IS NULL
    AND (
      name ILIKE '%shameless residents%'
      OR name ILIKE '%shameless djs%'
      OR name = 'Residents'
      OR name = 'Grounded Records crew'
    )
  RETURNING name
`
console.log(`Linked ${result.length} Residents entries:`)
result.forEach(r => console.log(`  "${r.name}"`))

console.log('\nDone.')
