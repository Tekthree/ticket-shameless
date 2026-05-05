/**
 * Download DJ profile images from sheet URLs and upload to Cloudflare R2.
 * Skips DJs already on R2. Skips Instagram CDN URLs (403, require auth).
 * SoundCloud and Linktree og:image URLs work fine.
 *
 * Run: node scripts/upload-dj-images.mjs
 */

import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { neon } from '@neondatabase/serverless'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnvConfig(join(__dirname, '..'))

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } })

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET || 'shameless-party-images'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'

console.log(`R2 bucket: ${R2_BUCKET}`)
console.log(`R2 account: ${R2_ACCOUNT_ID?.slice(0, 8)}...`)

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const djs = await sql`
  SELECT id, slug, name, profile_image_url
  FROM djs
  WHERE profile_image_url IS NOT NULL
    AND profile_image_url NOT LIKE '%r2.dev%'
  ORDER BY name
`

console.log(`\nDJs to process: ${djs.length}\n`)

const SKIP_HOSTS = ['cdninstagram.com', 'instagram.com', 'fbcdn.net', 'scontent']
const skip = url => SKIP_HOSTS.some(h => url.includes(h))

let uploaded = 0, skipped = 0, failed = 0

for (const dj of djs) {
  const imageUrl = dj.profile_image_url

  if (skip(imageUrl)) {
    process.stdout.write(`  [skip instagram] ${dj.name}\n`)
    skipped++
    continue
  }

  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ShamelessBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const key = `djs/${dj.slug}-${randomUUID().slice(0, 8)}.${ext}`

    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.byteLength,
    }))

    const r2Url = `${R2_PUBLIC_URL}/${key}`
    await sql`UPDATE djs SET profile_image_url = ${r2Url} WHERE id = ${dj.id}`
    console.log(`  [OK] ${dj.name} -> ${key}`)
    uploaded++
  } catch (e) {
    console.log(`  [FAIL] ${dj.name}: ${e.message}`)
    failed++
  }
}

console.log(`\nDone.`)
console.log(`  Uploaded to R2: ${uploaded}`)
console.log(`  Skipped (Instagram): ${skipped}`)
console.log(`  Failed: ${failed}`)
