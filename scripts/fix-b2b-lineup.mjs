/**
 * fix-b2b-lineup.mjs
 * Splits "Artist A b2b Artist B" lineup entries into two separate rows.
 * Run once after importing events that had b2b pairs.
 *
 * Usage: node scripts/fix-b2b-lineup.mjs [--dry-run]
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const DRY_RUN = process.argv.includes('--dry-run')

const prodEnv = readFileSync('/tmp/vercel-prod-env', 'utf8')
function getProd(key) {
  for (const line of prodEnv.split('\n')) {
    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue
    if (line.slice(0, eqIdx).trim() === key) return line.slice(eqIdx + 1).trim().replace(/^"|"$/g, '')
  }
  return ''
}
const sql = neon(getProd('DATABASE_URL'), { fetchOptions: { cache: 'no-store' } })

function cleanArtistName(name) {
  return name
    .replace(/\s*\([^)]+\)/g, '')  // strip (Open to Close), (NYC), etc.
    .replace(/\s+/g, ' ')
    .trim()
}

const rows = await sql`
  SELECT id, event_id, name, sort_order, stage
  FROM lineup
  WHERE name ILIKE '% b2b %'
  ORDER BY event_id, sort_order
`

console.log(`Found ${rows.length} b2b lineup entries\n`)

let fixed = 0
for (const row of rows) {
  const parts = row.name.split(/\s+b2b\s+/i).map(cleanArtistName).filter(Boolean)
  if (parts.length < 2) continue

  console.log(`  "${row.name}"`)
  parts.forEach((p, i) => console.log(`    ${i === 0 ? '→' : '+'} ${p} [${row.stage ?? 'no stage'}]`))

  if (!DRY_RUN) {
    // Update original row to first artist
    await sql`UPDATE lineup SET name = ${parts[0]} WHERE id = ${row.id}`

    // Insert remaining artists with same event/stage/sort_order
    for (let i = 1; i < parts.length; i++) {
      await sql`
        INSERT INTO lineup (event_id, name, dj_id, sort_order, stage)
        VALUES (${row.event_id}, ${parts[i]}, null, ${row.sort_order}, ${row.stage})
      `
    }
  }

  fixed++
}

console.log(`\n${DRY_RUN ? '[DRY RUN] Would fix' : 'Fixed'} ${fixed} entries`)
