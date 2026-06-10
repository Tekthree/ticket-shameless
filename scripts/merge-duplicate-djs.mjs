/**
 * Merge duplicate DJ profiles where the same artist appears under two slugs.
 * Repoints all lineup entries from the duplicate to the canonical profile, then deletes the duplicate.
 *
 * Run: node scripts/merge-duplicate-djs.mjs [--apply]
 */

import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const envPath = new URL('../.env.local', import.meta.url).pathname
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')] })
)
const sql = neon(envVars.DATABASE_URL)
const APPLY = process.argv.includes('--apply')

// [canonical-slug, duplicate-slug] — canonical is the one to keep
const MERGES = [
  ['ethical-drugs',  'ethicaldrugs'],
  ['future-wife',    'futurewife'],
  ['j-justice',      'jjustice'],
  ['just-beef',      'justbeef'],
  ['matt-g',         'mattg'],
  ['the-love-virus', 'the-lovevirus'],
  ['jenn-green',     'jenngreen'],    // jenn-green has the profile image
]

// Flagged for manual review — could be same or different people
const UNCERTAIN = [
  ['shaun-whitcher', 'whitcher'],
  ['dj-raine',       'raine'],
  ['david-dewey',    'dewey'],
  ['deejay-hershe',  'hershe'],
  ['carlos-r',       'carlos-ruiz'],
]

console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`)

for (const [canonSlug, dupeSlug] of MERGES) {
  const rows = await sql`
    SELECT d.id, d.slug, d.name, d.aliases,
           COALESCE(l.cnt, 0)::int as lineup_count
    FROM djs d
    LEFT JOIN (SELECT dj_id, COUNT(*)::int as cnt FROM lineup GROUP BY dj_id) l ON l.dj_id = d.id
    WHERE d.slug = ANY(ARRAY[${canonSlug}, ${dupeSlug}])
  `
  const canon = rows.find(r => r.slug === canonSlug)
  const dupe  = rows.find(r => r.slug === dupeSlug)

  if (!canon || !dupe) {
    console.log(`SKIP ${canonSlug}/${dupeSlug} — one or both not found`)
    continue
  }

  // Safety: check if both appear in the same event (would mean different people)
  const sameEvent = await sql`
    SELECT COUNT(*)::int as cnt
    FROM lineup a
    JOIN lineup b ON b.event_id = a.event_id
    WHERE a.dj_id = ${canon.id} AND b.dj_id = ${dupe.id}
  `
  if (sameEvent[0].cnt > 0) {
    console.log(`CONFLICT ${canonSlug}/${dupeSlug} — both appear on same event lineup, skipping`)
    continue
  }

  console.log(`MERGE: "${dupe.name}" (${dupeSlug}, ${dupe.lineup_count} entries) → "${canon.name}" (${canonSlug}, ${canon.lineup_count} entries)`)

  if (APPLY) {
    await sql`UPDATE lineup SET dj_id = ${canon.id} WHERE dj_id = ${dupe.id}`
    const newAliases = [...new Set([...(canon.aliases || []), dupe.name])]
    await sql`UPDATE djs SET aliases = ${newAliases} WHERE id = ${canon.id}`
    await sql`DELETE FROM djs WHERE id = ${dupe.id}`
    console.log(`  Done — repointed ${dupe.lineup_count} entries, alias added, deleted dupe`)
  }
}

console.log('\n── Uncertain (needs manual review) ──')
for (const [s1, s2] of UNCERTAIN) {
  const rows = await sql`
    SELECT d.slug, d.name, COALESCE(l.cnt, 0)::int as cnt
    FROM djs d
    LEFT JOIN (SELECT dj_id, COUNT(*)::int as cnt FROM lineup GROUP BY dj_id) l ON l.dj_id = d.id
    WHERE d.slug = ANY(ARRAY[${s1}, ${s2}])
  `
  const sameEvent = await sql`
    SELECT COUNT(*)::int as cnt
    FROM lineup a
    JOIN lineup b ON b.event_id = a.event_id
    WHERE a.dj_id = (SELECT id FROM djs WHERE slug = ${s1})
      AND b.dj_id = (SELECT id FROM djs WHERE slug = ${s2})
  `
  const conflict = sameEvent[0].cnt > 0
  const info = rows.map(r => `${r.slug}(${r.cnt})`).join(' vs ')
  console.log(`  ${conflict ? 'DIFFERENT PEOPLE:' : 'POSSIBLE DUPE:   '} ${info}`)
}

if (!APPLY) console.log('\nDry run complete. Pass --apply to execute merges.')
