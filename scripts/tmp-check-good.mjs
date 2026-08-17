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
const rows = await sql`SELECT slug, title, description FROM events WHERE slug = 'reverie-society-diffusion-takeover-w-saand-may-24th-2026'`
console.log(JSON.stringify(rows, null, 2))
const lineup = await sql`SELECT e.slug, l.name, l.sort_order, l.stage FROM lineup l JOIN events e ON e.id = l.event_id WHERE e.slug = 'reverie-society-diffusion-takeover-w-saand-may-24th-2026' ORDER BY l.sort_order`
console.log(JSON.stringify(lineup, null, 2))
