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

// Add column (safe to run if already exists via IF NOT EXISTS workaround)
try {
  await sql`ALTER TABLE events ADD COLUMN presented_by TEXT`
  console.log('Column added')
} catch (e) {
  if (e.message.includes('already exists')) {
    console.log('Column already exists, skipping')
  } else {
    throw e
  }
}

// Set all Reverie Society events
const result = await sql`
  UPDATE events
  SET presented_by = 'Shameless, Uniting Souls and Viva'
  WHERE slug LIKE 'reverie-society-%'
  RETURNING slug, title, presented_by
`

console.log(`Updated ${result.length} events:`)
result.forEach(e => console.log(' ', e.slug))
