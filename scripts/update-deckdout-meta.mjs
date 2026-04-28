import fs from 'fs'
import { neon } from '@neondatabase/serverless'

const raw = fs.readFileSync('/tmp/vercel-prod-env', 'utf8')
let DATABASE_URL = ''
for (const line of raw.split('\n')) {
  const eqIdx = line.indexOf('=')
  if (eqIdx === -1) continue
  if (line.slice(0, eqIdx).trim() === 'DATABASE_URL') {
    DATABASE_URL = line.slice(eqIdx + 1).trim().replace(/^"|"$/g, '')
    break
  }
}

const sql = neon(DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
const result = await sql`
  UPDATE events
  SET tags = ARRAY['rooftop','house','techno','deep house'],
      presented_by = 'Shameless & Friends'
  WHERE slug = 'deckd-out-2026-summer-season'
  RETURNING title, tags, presented_by
`
console.log('Updated:', result[0].title)
console.log('Tags:', result[0].tags)
console.log('Presented by:', result[0].presented_by)
