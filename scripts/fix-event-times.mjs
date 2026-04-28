import fs from 'fs'
import { neon } from '@neondatabase/serverless'

const raw = fs.readFileSync('/tmp/vercel-prod-env', 'utf8')
let DATABASE_URL = ''
for (const line of raw.split('\n')) {
  const eqIdx = line.indexOf('=')
  if (eqIdx === -1) continue
  const key = line.slice(0, eqIdx).trim()
  if (key === 'DATABASE_URL') {
    DATABASE_URL = line.slice(eqIdx + 1).trim().replace(/^"|"$/g, '')
    break
  }
}

const sql = neon(DATABASE_URL, { fetchOptions: { cache: 'no-store' } })

// 3 PM PDT = 22:00 UTC, 8 PM PDT = 03:00 UTC next day
const fixes = [
  { slug: 'reverie-society-taurus-party-2026', date: '2026-05-03T22:00:00.000Z', end_date: '2026-05-04T03:00:00.000Z' },
  { slug: 'reverie-society-viva-la-soul-2026', date: '2026-05-10T22:00:00.000Z', end_date: '2026-05-11T03:00:00.000Z' },
]

for (const fix of fixes) {
  const result = await sql`
    UPDATE events SET date = ${fix.date}, end_date = ${fix.end_date}
    WHERE slug = ${fix.slug}
    RETURNING id, title, date, end_date
  `
  if (result.length > 0) {
    const e = result[0]
    console.log('Updated:', e.title)
    console.log('  date:', e.date)
    console.log('  end:', e.end_date)
  } else {
    console.log('No row found:', fix.slug)
  }
}
