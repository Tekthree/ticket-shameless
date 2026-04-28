import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnvConfig(join(__dirname, '..'))

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } })

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'
const R2_BUCKET     = process.env.R2_BUCKET || 'shameless-party-images'

// ── Upload flyer ────────────────────────────────────────────────────────────

const FLYER_PATH = '/mnt/e/WORK/Shameless/Reverie Society/May/May 24/JPEG/800by1000-instagram.jpg'

console.log('Uploading flyer to R2...')
const flyerBuffer = await readFile(FLYER_PATH)
const flyerKey = `events/${randomUUID()}.jpg`
await r2.send(new PutObjectCommand({
  Bucket: R2_BUCKET,
  Key: flyerKey,
  Body: flyerBuffer,
  ContentType: 'image/jpeg',
  ContentLength: flyerBuffer.byteLength,
}))
const imageUrl = `${R2_PUBLIC_URL}/${flyerKey}`
console.log(`  ✓ ${imageUrl}`)

// ── Insert event ────────────────────────────────────────────────────────────

const slug = 'reverie-society-diffusion-takeover-saand-may-24-2026'

const [event] = await sql`
  INSERT INTO events (
    slug, title, description, date, end_date,
    venue, address,
    image_url, banner_url,
    tags, payment_link,
    suggested_price, is_public, is_published
  ) VALUES (
    ${slug},
    ${'Reverie Society : Diffusion Takeover w/ SAAND'},
    ${'Sunday day party at Monkey Loft. Diffusion Productions takes over the Reverie Society series with special guest SAAND (MUSICIS4LOVERS, SATYA) headlining alongside Zeebo, Happy John, Brit Jean, and Taves. 21+, 3–8 PM.'},
    ${'2026-05-24T15:00:00-07:00'},
    ${'2026-05-24T20:00:00-07:00'},
    ${'Monkey Loft'},
    ${'2915 1st Avenue South, Seattle, WA 98134'},
    ${imageUrl},
    ${imageUrl},
    ${['house', 'techno', 'day party', 'diffusion', 'reverie society', 'monkey loft']},
    ${'https://www.eventbrite.com/e/reverie-society-diffusion-takeover-w-saand-may-24th-2026-tickets-1988001945334'},
    ${18.07},
    ${true},
    ${true}
  )
  ON CONFLICT (slug) DO UPDATE SET
    image_url  = EXCLUDED.image_url,
    banner_url = EXCLUDED.banner_url
  RETURNING id
`
console.log(`\n✓ Event inserted: ${event.id}`)

// ── Insert lineup ───────────────────────────────────────────────────────────

// Remove existing lineup for this event (idempotent)
await sql`DELETE FROM lineup WHERE event_id = ${event.id}`

const lineup = [
  { name: 'SAAND',      bio: 'MUSICIS4LOVERS, SATYA — Special Guest / Headliner', sort_order: 0 },
  { name: 'Zeebo',      bio: null, sort_order: 1 },
  { name: 'Happy John', bio: null, sort_order: 2 },
  { name: 'Brit Jean',  bio: null, sort_order: 3 },
  { name: 'Taves',      bio: null, sort_order: 4 },
]

for (const dj of lineup) {
  await sql`
    INSERT INTO lineup (event_id, name, bio, sort_order)
    VALUES (${event.id}, ${dj.name}, ${dj.bio}, ${dj.sort_order})
  `
  console.log(`  ✓ ${dj.name}`)
}

console.log('\nDone.')
