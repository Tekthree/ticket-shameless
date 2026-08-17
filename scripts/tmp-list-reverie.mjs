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

const rows = await sql`SELECT title, date, facebook_url, is_published FROM events WHERE title ILIKE '%reverie%' ORDER BY date ASC`
for (const r of rows) {
  console.log(`${r.date?.toISOString?.().slice(0,10) ?? r.date} | pub=${r.is_published} | ${r.title} | ${r.facebook_url ?? '(no fb url)'}`)
}
console.log(`\nTotal: ${rows.length}`)
