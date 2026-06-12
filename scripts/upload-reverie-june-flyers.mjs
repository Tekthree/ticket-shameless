// Upload June Reverie Society flyers to R2 and update event records
// Run: node scripts/upload-reverie-june-flyers.mjs

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import { join } from 'path'
import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'
const sql = neon(process.env.DATABASE_URL)

const BASE = "/mnt/e/WORK/SHAMELESS/Reverie Society/June"

const events = [
  {
    slug: 'reverie-society-wonder-twinz-spaceotter-kobalt-severa-2026-06-14',
    dir: join(BASE, 'June 14th/JPEG'),
    key: 'reverie-jun14',
  },
  {
    slug: 'reverie-society-music-is-for-lovers-showcase-yoga-2026-06-21',
    dir: join(BASE, 'June 21st/JPEG'),
    key: 'reverie-jun21',
  },
  {
    slug: 'reverie-society-pride-weekend-edition-2026-06-28',
    dir: join(BASE, 'June 28th/JPEG'),
    key: 'reverie-jun28',
  },
]

async function upload(localPath, r2Key) {
  const body = readFileSync(localPath)
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: r2Key,
    Body: body,
    ContentType: 'image/jpeg',
  }))
  return `${R2_PUBLIC_URL}/${r2Key}`
}

for (const e of events) {
  const bannerFile = join(e.dir, 'Branding_Banner - Copy.jpg')
  const portraitFile = join(e.dir, '800by1000-instagram - Copy.jpg')

  const bannerKey = `events/${e.key}-banner.jpg`
  const portraitKey = `events/${e.key}-800x1000.jpg`

  console.log(`\nUploading ${e.key}...`)
  const bannerUrl = await upload(bannerFile, bannerKey)
  console.log(`  banner → ${bannerUrl}`)
  const portraitUrl = await upload(portraitFile, portraitKey)
  console.log(`  portrait → ${portraitUrl}`)

  await sql`
    update events
    set image_url = ${portraitUrl}, banner_url = ${bannerUrl}
    where slug = ${e.slug}
  `
  console.log(`  DB updated`)
}

console.log('\nAll done.')
