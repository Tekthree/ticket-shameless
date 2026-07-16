// Count events missing descriptions by year + how many have lineup data
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const sql = neon(process.env.DATABASE_URL)

const rows = await sql`
  SELECT 
    EXTRACT(year FROM e.date)::int as year,
    COUNT(*) as missing_desc,
    SUM(CASE WHEN l.count > 0 THEN 1 ELSE 0 END)::int as has_lineup
  FROM events e
  LEFT JOIN (
    SELECT event_id, COUNT(*) as count FROM lineup GROUP BY event_id
  ) l ON l.event_id = e.id
  WHERE e.is_published = true
    AND (e.description IS NULL OR e.description = '')
  GROUP BY year
  ORDER BY year DESC
`

console.log('\n📊 Missing descriptions by year:\n')
console.log('Year  | Missing | Has lineup')
console.log('------|---------|----------')
for (const r of rows) {
  console.log(`${r.year}  |   ${String(r.missing_desc).padStart(3)}   |    ${r.has_lineup}`)
}

// Also show the 2026 events specifically  
const recent = await sql`
  SELECT e.id, e.title, e.date, e.venue, e.tags, e.presented_by,
    coalesce(json_agg(l.name ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL), '[]') as lineup_names
  FROM events e
  LEFT JOIN lineup l ON l.event_id = e.id
  WHERE e.is_published = true
    AND (e.description IS NULL OR e.description = '')
    AND e.date >= '2026-01-01'
  GROUP BY e.id
  ORDER BY e.date DESC
`

console.log(`\n\n🆕 2026 events missing descriptions (${recent.length}):\n`)
for (const ev of recent) {
  const date = new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })
  const names = ev.lineup_names.join(', ') || '(no lineup linked)'
  console.log(`  ${date.padEnd(14)} ${ev.title}`)
  console.log(`               Lineup: ${names}`)
  console.log(`               Venue: ${ev.venue ?? 'N/A'}`)
  if (ev.tags?.length) console.log(`               Tags: ${ev.tags.join(', ')}`)
  console.log()
}
