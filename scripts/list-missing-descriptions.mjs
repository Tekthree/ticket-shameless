// Pull all events missing descriptions with their lineup data
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const sql = neon(process.env.DATABASE_URL)

const events = await sql`
  SELECT 
    e.id,
    e.slug,
    e.title,
    e.date,
    e.venue,
    e.address,
    e.tags,
    e.presented_by,
    e.suggested_price,
    e.description,
    coalesce(
      json_agg(
        json_build_object(
          'name', l.name,
          'stage', l.stage,
          'time_slot', l.time_slot,
          'is_headliner', coalesce(l.is_headliner, false)
        ) ORDER BY l.sort_order
      ) FILTER (WHERE l.id IS NOT NULL),
      '[]'
    ) AS lineup
  FROM events e
  LEFT JOIN lineup l ON l.event_id = e.id
  WHERE e.is_published = true
    AND (e.description IS NULL OR e.description = '')
  GROUP BY e.id
  ORDER BY e.date DESC
`

console.log(`\n📊 ${events.length} events missing descriptions\n`)
console.log('='.repeat(60))

for (const ev of events) {
  const date = new Date(ev.date).toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/Los_Angeles'
  })
  const lineup = ev.lineup.map(a => {
    const flags = a.is_headliner ? ' (HEADLINER)' : ''
    return `  • ${a.name}${a.stage ? ` [${a.stage}]` : ''}${a.time_slot ? ` @ ${a.time_slot}` : ''}${flags}`
  }).join('\n')

  console.log(`\n🎉 ${ev.title}`)
  console.log(`   ID: ${ev.id}`)
  console.log(`   Date: ${date}`)
  console.log(`   Venue: ${ev.venue ?? 'N/A'}${ev.address ? ` — ${ev.address}` : ''}`)
  if (ev.presented_by) console.log(`   Presented by: ${ev.presented_by}`)
  if (ev.tags?.length) console.log(`   Tags: ${ev.tags.join(', ')}`)
  if (ev.suggested_price) console.log(`   Price: $${ev.suggested_price}`)
  if (lineup) {
    console.log(`   Lineup:`)
    console.log(lineup)
  } else {
    console.log(`   Lineup: (none linked)`)
  }
}
