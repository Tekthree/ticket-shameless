import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

// Parse the prod env file manually
const envContent = readFileSync('/tmp/vercel-prod-env', 'utf8')
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '')
}

console.log('DB host:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0])

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } })

const diffusionUrl = 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/events/reverie-diffusion-may24-banner.jpg'
const taurusUrl = 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/events/reverie-taurus-may3-banner.jpg'

const r1 = await sql`
  UPDATE events SET image_url = ${diffusionUrl}, banner_url = ${diffusionUrl}, tags = ${['house','techno','day party','deep house']}
  WHERE slug = 'reverie-society-diffusion-takeover-saand-may-24-2026'
  RETURNING slug, tags
`
console.log('Diffusion:', JSON.stringify(r1[0]))

const r2 = await sql`
  UPDATE events SET image_url = ${taurusUrl}, banner_url = ${taurusUrl}, tags = ${['House','Deep House','Day Party']}
  WHERE slug = 'reverie-society-taurus-party-2026'
  RETURNING slug, tags
`
console.log('Taurus:', JSON.stringify(r2[0]))
