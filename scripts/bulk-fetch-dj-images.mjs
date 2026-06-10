/**
 * Bulk-scrape Instagram profile images for DJs in the Google Sheets CSV
 * that have an IG link but no profile image in the DB.
 *
 * Logs progress to scripts/bulk-fetch-log.json on completion.
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
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')] })
)

const sql = neon(envVars.DATABASE_URL)
const R2_PUBLIC_URL = envVars.R2_PUBLIC_URL || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'
const BUCKET = envVars.R2_BUCKET || 'shameless-party-images'
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${envVars.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: envVars.R2_ACCESS_KEY_ID, secretAccessKey: envVars.R2_SECRET_ACCESS_KEY },
})

function normalize(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, '') }

function parseCSV(content) {
  const lines = content.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const vals = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') inQ = !inQ
      else if (ch === ',' && !inQ) { vals.push(cur); cur = '' }
      else cur += ch
    }
    vals.push(cur)
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || '').trim()]))
  })
}

function download(url) {
  return new Promise((res, rej) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location)
        return download(r.headers.location).then(res).catch(rej)
      const chunks = []
      r.on('data', c => chunks.push(c))
      r.on('end', () => res(Buffer.concat(chunks)))
      r.on('error', rej)
    }).on('error', rej)
  })
}

// Load CSV and DB
const sheetRows = parseCSV(readFileSync(new URL('../../zoo-bot/scripts/shameless-djs.csv', import.meta.url).pathname, 'utf8'))
const dbDjs = await sql`SELECT id, name, slug, instagram_url, profile_image_url FROM djs WHERE is_published = true`

// Build enrichment list
const targets = []
for (const row of sheetRows) {
  const link = (row.profile_link || '').trim()
  if (!link.startsWith('http') || !link.includes('instagram.com')) continue
  const handle = link.replace(/\/$/, '').split('/').pop()
  const norm = normalize(row.name)
  const match = dbDjs.find(d =>
    normalize(d.name) === norm ||
    (d.aliases || []).some(a => normalize(a) === norm)
  )
  if (!match) continue
  if (match.profile_image_url || match.instagram_url) continue
  targets.push({ id: match.id, slug: match.slug, name: match.name, igHandle: handle, igUrl: link })
}

console.log(`Targets: ${targets.length}`)

// Launch browser
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
})
const page = await context.newPage()

const results = { success: [], failed: [], skipped: [] }
let i = 0

for (const target of targets) {
  i++
  process.stdout.write(`[${i}/${targets.length}] @${target.igHandle} (${target.slug})... `)

  try {
    await page.goto(`https://www.instagram.com/${target.igHandle}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await page.waitForTimeout(1500)

    const ogImage = await page.$eval('meta[property="og:image"]', el => el.getAttribute('content')).catch(() => null)

    if (!ogImage) {
      console.log('no og:image')
      results.failed.push({ ...target, reason: 'no og:image' })
      // Update IG URL even without image
      await sql`UPDATE djs SET instagram_url = ${target.igUrl} WHERE id = ${target.id}`
      continue
    }

    const buf = await download(ogImage)
    if (buf.length < 500) {
      console.log('image too small, likely placeholder')
      results.skipped.push({ ...target, reason: 'placeholder image' })
      await sql`UPDATE djs SET instagram_url = ${target.igUrl} WHERE id = ${target.id}`
      continue
    }

    const key = `djs/${target.slug}-${randomUUID().slice(0, 8)}.jpg`
    await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: 'image/jpeg' }))
    const r2Url = `${R2_PUBLIC_URL}/${encodeURIComponent(key)}`

    await sql`UPDATE djs SET profile_image_url = ${r2Url}, instagram_url = ${target.igUrl} WHERE id = ${target.id}`

    console.log(`ok (${buf.length} bytes)`)
    results.success.push({ slug: target.slug, name: target.name, r2Url })
  } catch (e) {
    console.log(`error: ${e.message?.slice(0, 60)}`)
    results.failed.push({ ...target, reason: e.message?.slice(0, 80) })
  }

  // Small delay to avoid rate limiting
  await page.waitForTimeout(500)
}

await browser.close()

const logPath = new URL('../scripts/bulk-fetch-log.json', import.meta.url).pathname
writeFileSync(logPath, JSON.stringify({
  ran_at: new Date().toISOString(),
  total: targets.length,
  success: results.success.length,
  failed: results.failed.length,
  skipped: results.skipped.length,
  results,
}, null, 2))

console.log(`\nDone: ${results.success.length} success, ${results.failed.length} failed, ${results.skipped.length} skipped`)
console.log(`Log: scripts/bulk-fetch-log.json`)
