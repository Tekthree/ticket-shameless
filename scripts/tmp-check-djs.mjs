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
const names = ['David Scuba','Jon Lee','DY3','Tek Jones','Zeebo','Shaun Whitcher','Sean Wood','Onyx Ocean','Hazelwood']
for (const n of names) {
  const rows = await sql`SELECT id, slug, name, aliases FROM djs WHERE lower(name) = lower(${n}) OR lower(${n}) = any(select lower(x) from unnest(aliases) as x)`
  console.log(n, '->', rows.length ? rows.map(r=>`${r.name} (${r.slug})`).join(', ') : 'NOT FOUND')
}
