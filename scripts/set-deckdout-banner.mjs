import fs from 'fs'
import { neon } from '@neondatabase/serverless'

const raw = fs.readFileSync('/tmp/vercel-prod-env', 'utf8')
let DATABASE_URL = ''
for (const line of raw.split('\n')) {
  const eqIdx = line.indexOf('=')
  if (eqIdx === -1) continue
  if (line.slice(0, eqIdx).trim() === 'DATABASE_URL') {
    DATABASE_URL = line.slice(eqIdx + 1).trim().replace(/^"|"$/g, '')
    break
  }
}

const url = 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/events/da2e9a56-05c4-48f1-9aee-a2215df82564.jpg'
const sql = neon(DATABASE_URL, { fetchOptions: { cache: 'no-store' } })

const result = await sql`
  UPDATE events SET image_url = ${url}, banner_url = ${url}
  WHERE slug = 'deckd-out-2026-summer-season'
  RETURNING title, image_url
`
console.log('Updated:', result[0].title)
console.log('URL:', result[0].image_url)
