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
const events = await sql`SELECT id, slug, title, date, end_date FROM events ORDER BY date`
events.forEach(e => console.log(e.slug, '|', e.title, '|', e.date, '| end:', e.end_date))
