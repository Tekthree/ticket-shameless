import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { resolve } from 'path'
import { writeFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })
const sql = neon(process.env.DATABASE_URL)

// Check raw char lengths and content of first 3 2026 descriptions
const rows = await sql`
  SELECT id, title, length(description) as len, description
  FROM events
  WHERE is_published = true
    AND date >= '2026-01-01' AND date < '2027-01-01'
    AND description IS NOT NULL AND description != ''
  ORDER BY date ASC
  LIMIT 3
`

let out = ''
for (const r of rows) {
  out += `\n--- ${r.title} ---\n`
  out += `DB length: ${r.len} chars\n`
  out += `Content:\n${r.description}\n`
  out += `[END]\n`
}

writeFileSync('/tmp/raw-check.txt', out, 'utf8')
console.log('done, total file size:', out.length)
