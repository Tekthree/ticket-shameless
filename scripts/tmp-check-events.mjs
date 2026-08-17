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

const rows = await sql`SELECT id, slug, title, description, payment_link, facebook_url FROM events WHERE slug IN ('reverie-society-sunday-82326-david-scuba','reverie-society-sunday-83026-diffusion-takeover')`
for (const r of rows) {
  console.log('=====', r.slug, '=====')
  console.log('id:', r.id)
  console.log('title:', r.title)
  console.log('payment_link:', r.payment_link)
  console.log('description:')
  console.log(r.description)
  console.log()
}
