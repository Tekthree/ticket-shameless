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
const rows = await sql`
  SELECT l.id as lineup_id, l.name, l.dj_id, e.id as event_id, e.slug, e.title, e.date, e.is_published, e.is_public
  FROM lineup l
  JOIN events e ON e.id = l.event_id
  WHERE l.dj_id IN (
    SELECT id FROM djs WHERE lower(name) IN ('jon lee','david scuba','tek jones','dy3')
  )
  ORDER BY l.dj_id, e.date
`
console.log(JSON.stringify(rows, null, 2))
