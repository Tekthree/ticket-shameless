// Uploads the Shameless hero promo video to R2
// Run: node scripts/upload-hero-video.mjs

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const VIDEO_PATH = "/mnt/e/WORK/SHAMELESS/website assets/deckd out_2025_promo_video.mp4"
const R2_KEY = 'video/deckd-out-2025-promo.mp4'

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

console.log('Reading video file...')
const body = readFileSync(VIDEO_PATH)
console.log(`File size: ${(body.length / 1024 / 1024).toFixed(1)} MB`)

console.log(`Uploading to R2 as ${R2_KEY}...`)
await s3.send(new PutObjectCommand({
  Bucket: process.env.R2_BUCKET,
  Key: R2_KEY,
  Body: body,
  ContentType: 'video/mp4',
  CacheControl: 'public, max-age=31536000',
}))

console.log(`\nDone! Public URL:`)
console.log(`https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/${R2_KEY}`)
