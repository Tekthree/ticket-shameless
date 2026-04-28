import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const envContent = readFileSync('/tmp/vercel-prod-env', 'utf8')
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '')
}

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
const rows = await sql`SELECT slug, tags, banner_url FROM events WHERE slug = 'reverie-society-diffusion-takeover-saand-may-24-2026'`
console.log(JSON.stringify(rows[0], null, 2))
