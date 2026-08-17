import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
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
const rows = await sql`SELECT slug, title, image_url, banner_url, square_image_url FROM events WHERE title ILIKE '%reverie%' AND date > '2026-04-01' ORDER BY date DESC LIMIT 8`
for (const r of rows) console.log(JSON.stringify(r, null, 2))
