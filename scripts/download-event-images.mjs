/**
 * Downloads event flyer images from Facebook photo pages, uploads to R2,
 * and updates the events table with the new R2 URL.
 *
 * SETUP (one-time):
 *   1. Install "Cookie-Editor" browser extension in Chrome/Firefox
 *   2. Log in to Facebook in your browser
 *   3. Go to facebook.com, open Cookie-Editor, click "Export" → "Export as JSON"
 *   4. Save the file to: scripts/fb-cookies.json
 *   5. Run: node scripts/download-event-images.mjs
 *
 * The script processes all events with Facebook image URLs, extracts the real
 * CDN image URL via og:image, downloads it, uploads to R2, and updates the DB.
 */

import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const playwright = require('../node_modules/playwright')
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'crypto'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnvConfig(join(__dirname, '..'))

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET || 'shameless-party-images'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'
const DATABASE_URL = process.env.DATABASE_URL

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const sql = neon(DATABASE_URL, { fetchOptions: { cache: 'no-store' } })

const COOKIES_FILE = join(__dirname, 'fb-cookies.json')
const DELAY_MS = 1500

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function loadCookies() {
  try {
    const raw = await readFile(COOKIES_FILE, 'utf8')
    const cookies = JSON.parse(raw)
    // Cookie-Editor exports an array; normalize to Playwright format
    return cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain.startsWith('.') ? c.domain : '.' + c.domain,
      path: c.path || '/',
      expires: c.expirationDate ? Math.floor(c.expirationDate) : -1,
      httpOnly: c.httpOnly || false,
      secure: c.secure || false,
      sameSite: c.sameSite === 'no_restriction' ? 'None'
              : c.sameSite === 'lax' ? 'Lax'
              : c.sameSite === 'strict' ? 'Strict'
              : 'None',
    }))
  } catch {
    return null
  }
}

async function uploadToR2(buffer, contentType) {
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
  const key = `events/${randomUUID()}.${ext}`
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ContentLength: buffer.byteLength,
  }))
  return `${R2_PUBLIC_URL}/${key}`
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120 Safari/537.36' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  if (!contentType.startsWith('image/')) throw new Error(`Not an image: ${contentType.slice(0,40)}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  return { buffer, contentType: contentType.split(';')[0].trim() }
}

async function extractImageUrl(page, fbUrl) {
  // Some rows have two concatenated URLs — use only the first
  const url = fbUrl.includes('https://', 5)
    ? fbUrl.slice(0, fbUrl.indexOf('https://', 5))
    : fbUrl

  await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 })
  await page.waitForTimeout(2500)

  // Grab the largest fbcdn image on the page (the event flyer)
  const imageUrl = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')]
      .filter(i => i.src.includes('fbcdn.net') || i.src.includes('scontent'))
      .map(i => ({ src: i.src, area: (i.naturalWidth || i.width) * (i.naturalHeight || i.height) }))
      .sort((a, b) => b.area - a.area)
    return imgs[0]?.src || null
  })

  return imageUrl
}

// ── Main ──────────────────────────────────────────────────────────────────────

const cookies = await loadCookies()
if (!cookies) {
  console.error(`
  No Facebook cookies found at scripts/fb-cookies.json

  To get them:
    1. Install "Cookie-Editor" in Chrome: https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm
    2. Log in to Facebook
    3. Go to facebook.com, open Cookie-Editor, click "Export" > "Export as JSON"
    4. Save the file as: ${COOKIES_FILE}
    5. Re-run this script

  `)
  process.exit(1)
}

const events = await sql`
  SELECT id, slug, title, image_url
  FROM events
  WHERE image_url IS NOT NULL
    AND (
      image_url LIKE 'https://www.facebook.com/photo%'
      OR image_url LIKE 'https://lookaside.fbsbx.com%'
    )
  ORDER BY date DESC
`

console.log(`\nFound ${events.length} events with Facebook image URLs`)
console.log(`Loaded ${cookies.length} cookies from fb-cookies.json\n`)

const { chromium } = playwright
const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
})
await ctx.addCookies(cookies)
const page = await ctx.newPage()

// Verify login before batch
await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 12000 })
await page.waitForTimeout(1500)
const loggedIn = await page.evaluate(() => !document.querySelector('input[name="email"]'))
if (!loggedIn) {
  console.error('  Facebook cookies are expired or invalid. Re-export and replace fb-cookies.json.')
  await browser.close()
  process.exit(1)
}
console.log('  Facebook login verified\n')

let uploaded = 0
let failed = 0

for (let i = 0; i < events.length; i++) {
  const { id, title, image_url } = events[i]
  process.stdout.write(`[${i + 1}/${events.length}] ${title.slice(0, 50).padEnd(50)} ... `)

  try {
    const realUrl = await extractImageUrl(page, image_url)
    if (!realUrl) {
      console.log('no og:image found')
      failed++
      await sleep(DELAY_MS)
      continue
    }

    const { buffer, contentType } = await downloadImage(realUrl)
    const r2Url = await uploadToR2(buffer, contentType)
    await sql`UPDATE events SET image_url = ${r2Url}, banner_url = ${r2Url} WHERE id = ${id}`
    console.log(`✓`)
    uploaded++
  } catch (err) {
    console.log(`✗ ${err.message.slice(0, 60)}`)
    failed++
  }

  await sleep(DELAY_MS)
}

await browser.close()

console.log(`\n── Results ──────────────────────────────`)
console.log(`  Uploaded & linked:  ${uploaded}`)
console.log(`  Failed:             ${failed}`)
console.log('\nDone.')
