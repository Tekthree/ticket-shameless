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
const rows = await sql`SELECT id, slug, title, description FROM events WHERE title ILIKE '%rob paine%'`
for (const r of rows) {
  console.log('slug:', r.slug)
  console.log('desc:', r.description)
  const lineup = await sql`SELECT name, sort_order, stage FROM lineup WHERE event_id = ${r.id} ORDER BY sort_order`
  console.log('lineup:', JSON.stringify(lineup))
}
