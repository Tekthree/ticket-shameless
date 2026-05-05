/**
 * Scrape Instagram profile og:image URLs via Playwright and upload to R2.
 * Works without login — Instagram's og:image CDN URLs are publicly accessible.
 *
 * Run: node scripts/upload-instagram-photos.mjs
 */

import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { neon } from '@neondatabase/serverless'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { chromium } from 'playwright'
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

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const djs = await sql`
  SELECT id, slug, name, instagram_url, profile_image_url
  FROM djs
  WHERE instagram_url IS NOT NULL
    AND instagram_url LIKE '%instagram.com%'
    AND (
      profile_image_url IS NULL
      OR profile_image_url LIKE '%cdninstagram%'
      OR profile_image_url LIKE '%fbcdn%'
      OR profile_image_url LIKE '%scontent%'
    )
  ORDER BY name ASC
`

console.log(`DJs to process: ${djs.length}\n`)

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
})
const page = await context.newPage()

let uploaded = 0, failed = 0, noImage = 0

for (const dj of djs) {
  try {
    await page.goto(dj.instagram_url, { waitUntil: 'domcontentloaded', timeout: 15000 })

    const ogImage = await page.evaluate(() =>
      document.querySelector('meta[property="og:image"]')?.content
    )

    if (!ogImage) {
      console.log(`  [no og:image] ${dj.name}`)
      noImage++
      continue
    }

    const res = await fetch(ogImage, {
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

    // Brief pause to be polite to Instagram
    await new Promise(r => setTimeout(r, 1500))
  } catch (e) {
    console.log(`  [FAIL] ${dj.name}: ${e.message}`)
    failed++
  }
}

await browser.close()

console.log(`\nDone.`)
console.log(`  Uploaded to R2: ${uploaded}`)
console.log(`  No og:image found: ${noImage}`)
console.log(`  Failed: ${failed}`)
