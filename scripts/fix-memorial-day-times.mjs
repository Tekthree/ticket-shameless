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

// 2 PM PDT = 21:00 UTC, 10 PM PDT = 05:00 UTC May 26
const result = await sql`
  UPDATE events SET date = '2026-05-25T21:00:00.000Z', end_date = '2026-05-26T05:00:00.000Z'
  WHERE slug = 'memorial-day-hijinks-desert-hearts-2026'
  RETURNING id, title, date, end_date
`

if (result.length > 0) {
  const e = result[0]
  console.log('Updated:', e.title)
  console.log('  date:', e.date)
  console.log('  end:', e.end_date)
} else {
  console.log('No row found')
}
