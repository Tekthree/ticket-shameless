// Uploads photos from E:\WORK\SHAMELESS\deck'd out 10\ to R2 as events/gallery/01.jpg–10.jpg
// Run: node scripts/upload-gallery.mjs

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const LOCAL_DIR = "/mnt/e/WORK/SHAMELESS/deck'd out 10"

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const files = readdirSync(LOCAL_DIR)
  .filter(f => IMAGE_EXTS.has(extname(f).toLowerCase()))
  .sort()

if (files.length === 0) {
  console.error('No image files found in', LOCAL_DIR)
  process.exit(1)
}

console.log(`Found ${files.length} image(s) — uploading as events/gallery/01.jpg–${String(files.length).padStart(2, '0')}.jpg\n`)

for (let i = 0; i < files.length; i++) {
  const src = join(LOCAL_DIR, files[i])
  const key = `events/gallery/${String(i + 1).padStart(2, '0')}.jpg`
  const body = readFileSync(src)

  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: 'image/jpeg',
  }))

  console.log(`  ✓ ${files[i]} → ${key}`)
}

console.log('\nDone! Run node scripts/seed-event-gallery.mjs to activate the strip.')
