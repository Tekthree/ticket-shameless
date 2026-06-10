/**
 * Scrape Instagram profile images for DJs missing photos.
 * Navigates to each IG profile, grabs og:image, downloads, uploads to R2, updates DB.
 *
 * Run: node scripts/fetch-dj-profile-images.mjs [--apply]
 * Dry run shows what would be fetched. --apply writes to R2 + DB.
 */

import { readFileSync, writeFileSync } from 'fs'
import { chromium } from 'playwright'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { neon } from '@neondatabase/serverless'
import https from 'https'
import http from 'http'
import { randomUUID } from 'crypto'

const envPath = new URL('../.env.local', import.meta.url).pathname
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')] })
)

const sql = neon(envVars.DATABASE_URL)
const APPLY = process.argv.includes('--apply')
const R2_PUBLIC_URL = envVars.R2_PUBLIC_URL || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'
const BUCKET = envVars.R2_BUCKET || 'shameless-party-images'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${envVars.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: envVars.R2_ACCESS_KEY_ID,
    secretAccessKey: envVars.R2_SECRET_ACCESS_KEY,
  },
})

// DJs to process: { slug, id, igHandle }
// Handles confirmed from DJ spreadsheet + name validation
const TARGETS = [
  { slug: 'brit-jean',     id: 'af2528c7-9fe3-44d4-b745-646c905227e9', igHandle: 'brit__jean' },
  { slug: 'fouad-masoud',  id: 'a55b2229-ddfe-43b2-a55e-1e2276279feb', igHandle: 'fouadmasoud.ofc' },
  { slug: 'jacki-why',     id: '3f7839cc-6135-4b90-8dbe-44b8630c5ec9', igHandle: 'jacki.why' },
  { slug: 'jenn-green',    id: '0a5a16bc-35a3-4a9d-ab23-f4385e581288', igHandle: 'jelrgreen' },
  { slug: 'la-mala-noche', id: '056610ed-9651-4ed1-82b7-495bf8d30cb4', igHandle: 'la_mala_noche' },
  { slug: 'papito-peace',  id: '0787c28d-bc45-4c44-8697-3de99421bb66', igHandle: 'papitopeace' },
  { slug: 'veta-vitali',   id: 'fd4e5657-7131-48b3-a169-54ad337f2bc7', igHandle: 'veta.vitali' },
]

async function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject)
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function getInstagramOgImage(page, handle) {
  try {
    await page.goto(`https://www.instagram.com/${handle}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    // Wait a moment for meta tags
    await page.waitForTimeout(2000)
    const ogImage = await page.$eval(
      'meta[property="og:image"]',
      el => el.getAttribute('content')
    ).catch(() => null)
    return ogImage
  } catch (e) {
    return null
  }
}

const results = { success: [], failed: [], skipped: [] }

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
})
const page = await context.newPage()

for (const target of TARGETS) {
  console.log(`\nProcessing @${target.igHandle} (${target.slug})...`)
  const igUrl = `https://www.instagram.com/${target.igHandle}/`

  const ogImage = await getInstagramOgImage(page, target.igHandle)

  if (!ogImage) {
    console.log(`  No og:image found — skipping`)
    results.failed.push({ ...target, reason: 'no og:image' })
    continue
  }

  console.log(`  og:image: ${ogImage.slice(0, 80)}...`)

  if (!APPLY) {
    console.log(`  [dry run] Would download + upload to R2`)
    results.success.push({ ...target, imageUrl: ogImage })
    continue
  }

  // Download image
  let imgBuffer
  try {
    imgBuffer = await downloadBuffer(ogImage)
    console.log(`  Downloaded ${imgBuffer.length} bytes`)
  } catch (e) {
    console.log(`  Download failed: ${e.message}`)
    results.failed.push({ ...target, reason: 'download failed' })
    continue
  }

  // Upload to R2
  const key = `djs/${target.slug}-${randomUUID().slice(0, 8)}.jpg`
  try {
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: imgBuffer,
      ContentType: 'image/jpeg',
    }))
    console.log(`  Uploaded to R2: ${key}`)
  } catch (e) {
    console.log(`  R2 upload failed: ${e.message}`)
    results.failed.push({ ...target, reason: 'R2 upload failed' })
    continue
  }

  const r2Url = `${R2_PUBLIC_URL}/${encodeURIComponent(key)}`

  // Update DB: set profile_image_url + instagram_url
  await sql`
    UPDATE djs
    SET profile_image_url = ${r2Url},
        instagram_url = ${igUrl}
    WHERE id = ${target.id}
  `
  console.log(`  DB updated: ${r2Url}`)
  results.success.push({ ...target, r2Key: key, r2Url })
}

await browser.close()

console.log('\n── Summary ──')
console.log(`Success:  ${results.success.length}`)
console.log(`Failed:   ${results.failed.length}`)
if (results.failed.length) {
  results.failed.forEach(r => console.log(`  ${r.slug}: ${r.reason}`))
}

if (!APPLY) {
  console.log('\nDry run. Pass --apply to write to R2 + DB.')
}
