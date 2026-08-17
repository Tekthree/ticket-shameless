import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const sql = neon(process.env.DATABASE_URL)

const events = await sql`
  SELECT title, date, description
  FROM events
  WHERE is_published = true
    AND date >= '2026-01-01'
    AND date < '2027-01-01'
    AND description IS NOT NULL
    AND description != ''
  ORDER BY date ASC
  LIMIT 18
`

for (const ev of events) {
  const d = new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`🎉 ${ev.title} — ${d}`)
  console.log(`${'─'.repeat(60)}`)
  console.log(ev.description)
}
