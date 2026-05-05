/**
 * Link lineup entries to DJ profiles by matching name or aliases.
 * Also splits B2B / composite billings into separate lineup rows.
 *
 * Run after seed-dj-roster.mjs:
 *   node scripts/link-lineup-djs.mjs
 *
 * Safe to re-run — skips already-linked entries, uses ON CONFLICT for splits.
 */

import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnvConfig(join(__dirname, '..'))

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } })

// Load composite alias entries (B2B splits)
const aliasMap = JSON.parse(readFileSync(join(__dirname, 'data/dj-alias-map.json'), 'utf8'))
const composites = aliasMap.filter(e => e.is_composite)

// Build lookup: normalized alias string -> [{dj_id, slug, name}]
function normalize(str) {
  return str.toLowerCase().trim()
}

// Load all DJ profiles with their aliases
const allDJs = await sql`SELECT id, slug, name, aliases FROM djs`

const nameToId = new Map()
for (const dj of allDJs) {
  nameToId.set(normalize(dj.name), { id: dj.id, slug: dj.slug, name: dj.name })
  for (const alias of (dj.aliases || [])) {
    if (alias) nameToId.set(normalize(alias), { id: dj.id, slug: dj.slug, name: dj.name })
  }
}

// Add composite alias -> multiple DJs mapping
const compositeMap = new Map()
for (const entry of composites) {
  const key = normalize(entry.alias)
  compositeMap.set(key, entry.canonical_slugs)
}

// Fetch slug -> id map for composite resolution
const slugToId = new Map(allDJs.map(d => [d.slug, d.id]))

// Get all unlinked lineup entries
const unlinked = await sql`
  SELECT l.id, l.name, l.event_id, l.sort_order, l.stage, l.time_slot, l.is_headliner
  FROM lineup l
  WHERE l.dj_id IS NULL AND l.name IS NOT NULL AND l.name != ''
`

console.log(`Unlinked lineup entries: ${unlinked.length}\n`)

let linked = 0, split = 0, unmatched = 0

for (const row of unlinked) {
  const key = normalize(row.name)

  // Check composite (B2B) first
  if (compositeMap.has(key)) {
    const slugs = compositeMap.get(key)
    const djIds = slugs.map(s => slugToId.get(s)).filter(Boolean)

    if (djIds.length > 0) {
      // Replace this lineup entry with one entry per DJ
      // First DJ takes the original row's slot, rest get inserted
      await sql`
        UPDATE lineup SET dj_id = ${djIds[0]} WHERE id = ${row.id}
      `
      for (let i = 1; i < djIds.length; i++) {
        await sql`
          INSERT INTO lineup (event_id, name, dj_id, sort_order, stage, time_slot, is_headliner)
          SELECT event_id, ${allDJs.find(d => d.id === djIds[i])?.name || row.name},
            ${djIds[i]}, sort_order, stage, time_slot, is_headliner
          FROM lineup WHERE id = ${row.id}
          ON CONFLICT DO NOTHING
        `
      }
      console.log(`  Split: "${row.name}" -> ${slugs.join(', ')}`)
      split++
      continue
    }
  }

  // Single DJ match
  const match = nameToId.get(key)
  if (match) {
    await sql`UPDATE lineup SET dj_id = ${match.id} WHERE id = ${row.id}`
    linked++
  } else {
    unmatched++
  }
}

console.log(`\nDone.`)
console.log(`  Linked: ${linked} | Split (B2B): ${split} | Still unmatched: ${unmatched}`)

if (unmatched > 0) {
  console.log('\nUnmatched entries (top 20 by frequency):')
  const remaining = await sql`
    SELECT name, COUNT(*)::int as cnt
    FROM lineup
    WHERE dj_id IS NULL AND name IS NOT NULL AND name != ''
    GROUP BY name ORDER BY cnt DESC LIMIT 20
  `
  for (const r of remaining) console.log(`  ${r.cnt}x  ${r.name}`)
}
