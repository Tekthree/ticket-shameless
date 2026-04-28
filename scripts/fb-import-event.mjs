/**
 * fb-import-event.mjs
 *
 * Scrapes a Facebook event via Min Browser CDP session (already logged in),
 * finds the banner in the local Shameless E: drive, uploads to R2 via the
 * live API, and inserts the event into the production DB.
 *
 * Prerequisites:
 *   1. Min Browser running:  /opt/Min/min --remote-debugging-port=9222
 *   2. Prod env pulled:      npx vercel env pull /tmp/vercel-prod-env --environment=production
 *
 * Usage:
 *   node scripts/fb-import-event.mjs <facebook-event-url> [options]
 *
 * Options:
 *   --banner "/mnt/e/WORK/SHAMELESS/Folder/JPEG/Branding_Banner.jpg"
 *   --tags "house,techno,rooftop,deep house"
 *   --presented-by "Shameless & Friends"
 *   --end-time "23:00"    (24h Pacific time, e.g. 23:00 = 11 PM)
 *   --dry-run             (print extracted data, skip DB write)
 */

import { chromium } from 'playwright'
import { neon } from '@neondatabase/serverless'
import { readFileSync, existsSync, readdirSync } from 'fs'
import path from 'path'

// ── Constants ─────────────────────────────────────────────────────────────────

const UPLOAD_URL     = 'https://ticket-shameless.vercel.app/api/upload'
const SHAMELESS_ROOT = '/mnt/e/WORK/SHAMELESS'
const CDP_URL        = 'http://localhost:9222'

// ── Args ──────────────────────────────────────────────────────────────────────

const args       = process.argv.slice(2)
const FB_URL     = args.find(a => a.startsWith('https://www.facebook.com/events/'))
const bannerArg  = getArg('--banner')
const tagsArg    = getArg('--tags')
const presBy     = getArg('--presented-by')
const endTimeArg = getArg('--end-time')
const DRY_RUN    = args.includes('--dry-run')

function getArg(flag) {
  const i = args.indexOf(flag)
  return i !== -1 && args[i + 1] ? args[i + 1] : null
}

if (!FB_URL) {
  console.error('Usage: node scripts/fb-import-event.mjs <facebook-event-url> [--banner path] [--tags "a,b,c"] [--presented-by "X"] [--end-time "HH:MM"] [--dry-run]')
  process.exit(1)
}

// ── Prod DB ───────────────────────────────────────────────────────────────────

const prodEnv = readFileSync('/tmp/vercel-prod-env', 'utf8')
function getProd(key) {
  for (const line of prodEnv.split('\n')) {
    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue
    if (line.slice(0, eqIdx).trim() === key) return line.slice(eqIdx + 1).trim().replace(/^"|"$/g, '')
  }
  return ''
}
const DATABASE_URL = getProd('DATABASE_URL')
const sql = neon(DATABASE_URL, { fetchOptions: { cache: 'no-store' } })

// ── Step 1: Scrape via Min Browser ───────────────────────────────────────────

console.log('\n[1/4] Connecting to Min Browser CDP...')
const browser = await chromium.connectOverCDP(CDP_URL)
const context = browser.contexts()[0]
const pages = context.pages()
const page = pages.find(p => p.url().includes('facebook.com')) ?? pages[0]

console.log(`[1/4] Navigating to ${FB_URL}`)
await page.goto(FB_URL, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

// Expand description
try {
  const btn = page.locator('div[role="button"]:has-text("See more")').first()
  if (await btn.isVisible({ timeout: 2000 })) {
    await btn.click()
    await page.waitForTimeout(800)
    console.log('[1/4] Clicked "See more"')
  }
} catch {}

const scraped = await page.evaluate(() => {
  const mainEl   = document.querySelector('[role="main"]')
  const mainText = mainEl?.innerText ?? ''
  const lines    = mainText.split('\n').map(l => l.trim()).filter(Boolean)

  // Date/time line: "Thursday, June 18, 2026 at 7 PM"
  const dateMatch = mainText.match(/\w+day,\s+\w+\s+\d+,\s+\d{4}\s+at\s+\d+(?::\d+)?\s*[AP]M/i)
  const dateLine  = dateMatch?.[0] ?? null

  // Event title: the line that appears right after the date line in mainText
  let title = null
  if (dateLine) {
    const dateIdx = lines.findIndex(l => l === dateLine)
    if (dateIdx !== -1 && lines[dateIdx + 1]) title = lines[dateIdx + 1]
  }
  // Fallback: og:title or document.title
  if (!title) {
    title = document.querySelector('meta[property="og:title"]')?.content?.replace(/\s*\|.*$/, '').trim()
      ?? document.title?.replace(/\s*\|.*$/, '').trim()
  }

  // Venue: line after title
  let venue = null
  if (dateLine) {
    const dateIdx = lines.findIndex(l => l === dateLine)
    if (dateIdx !== -1 && lines[dateIdx + 2]) venue = lines[dateIdx + 2]
  }

  // Address
  const addrMatch = mainText.match(/\d+\s+\w[^,\n]+,\s*Seattle,\s*WA\s*\d{5}/)
  const address = addrMatch?.[0]?.replace(/-\d+,.*$/, '').trim() ?? null

  // Ticket link — unwrap FB redirect if needed
  let ticketLink = null
  for (const a of document.querySelectorAll('a[href]')) {
    if (/eventbrite|tixr|dice\.fm|ra\.co|axs|ticketweb/i.test(a.href)) {
      const m = a.href.match(/[?&]u=([^&]+)/)
      ticketLink = m ? decodeURIComponent(m[1]).split('?')[0] : a.href.split('?')[0]
      break
    }
  }

  // Description: text between "Anyone on or off Facebook" and the address line
  const pubIdx = mainText.indexOf('Anyone on or off Facebook')
  const addrIdx = address ? mainText.indexOf(address) : -1
  let description = null
  if (pubIdx !== -1) {
    const raw = addrIdx > pubIdx
      ? mainText.slice(pubIdx + 'Anyone on or off Facebook'.length, addrIdx)
      : mainText.slice(pubIdx + 'Anyone on or off Facebook'.length, pubIdx + 3000)
    description = raw.replace(/\n+/g, '\n').trim()
    // Strip trailing noise after the actual description
    description = description
      .replace(/\s*See less[\s\S]*$/, '')
      .replace(/\s*\*\*By entering a Shameless event[\s\S]*$/, '')
      .trim()
  }

  return { title, dateLine, venue, address, ticketLink, description }
})

await browser.close()
console.log('\n[1/4] Scraped data:')
console.log('  Title:      ', scraped.title)
console.log('  Date line:  ', scraped.dateLine)
console.log('  Venue:      ', scraped.venue)
console.log('  Address:    ', scraped.address)
console.log('  Ticket:     ', scraped.ticketLink)
console.log('  Description:', scraped.description?.slice(0, 100) + '...')

// ── Step 2: Parse date → UTC ──────────────────────────────────────────────────

console.log('\n[2/4] Parsing date/time...')
const dm = scraped.dateLine?.match(/(\w+day),\s+(\w+)\s+(\d+),\s+(\d{4})\s+at\s+(\d+)(?::(\d+))?\s*([AP]M)/i)
if (!dm) { console.error('Could not parse:', scraped.dateLine); process.exit(1) }

const [, , month, day, year, hrStr, minStr, ampm] = dm
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const monthIdx = MONTHS.findIndex(m => m.toLowerCase() === month.toLowerCase())
let hr = parseInt(hrStr)
const mn = parseInt(minStr ?? '0')
if (ampm.toUpperCase() === 'PM' && hr !== 12) hr += 12
if (ampm.toUpperCase() === 'AM' && hr === 12) hr = 0

// Build ISO string with PDT offset so JS parses it as the correct UTC instant
const isDST = (monthIdx >= 2 && monthIdx <= 10)  // rough: Mar–Nov = PDT
const tzOffset = isDST ? '-07:00' : '-08:00'
const pad = n => String(n).padStart(2, '0')
const startISO = `${year}-${pad(monthIdx + 1)}-${pad(parseInt(day))}T${pad(hr)}:${pad(mn)}:00${tzOffset}`
const utcStart = new Date(startISO)

let utcEnd = null
if (endTimeArg) {
  const [endH, endM] = endTimeArg.split(':').map(Number)
  let endDay = parseInt(day)
  if (endH < hr || (endH === hr && (endM ?? 0) <= mn)) endDay += 1  // past midnight
  const endISO = `${year}-${pad(monthIdx + 1)}-${pad(endDay)}T${pad(endH)}:${pad(endM ?? 0)}:00${tzOffset}`
  utcEnd = new Date(endISO)
}

console.log('  Start (UTC):', utcStart.toISOString())
console.log('  End   (UTC):', utcEnd?.toISOString() ?? '(none — use --end-time HH:MM to set)')

// ── Step 3: Generate slug, check duplicate ────────────────────────────────────

console.log('\n[3/4] Checking for duplicates...')
const slug = (scraped.title ?? '')
  .toLowerCase()
  .replace(/['']/g, '')
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/[\s-]+/g, '-')  // collapse spaces and dashes into single dash
  .slice(0, 80)

console.log('  Slug:', slug)
const existing = await sql`SELECT id, title FROM events WHERE slug = ${slug} LIMIT 1`
if (existing.length > 0) {
  console.log('  Already in DB:', existing[0].title, '— nothing to do.')
  process.exit(0)
}
console.log('  Not found — proceeding.')

// ── Step 4a: Find and upload banner ───────────────────────────────────────────

console.log('\n[4/4] Banner image...')
let imageUrl = null

const bannerPath = bannerArg ?? autoFindBanner(scraped.title)
if (bannerPath && existsSync(bannerPath)) {
  console.log('  Uploading:', bannerPath)
  const fileBuffer = readFileSync(bannerPath)
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' })
  const form = new FormData()
  form.append('file', blob, path.basename(bannerPath))
  form.append('folder', 'events')
  const res  = await fetch(UPLOAD_URL, { method: 'POST', body: form })
  const json = await res.json()
  imageUrl = json.url ?? null
  console.log('  Uploaded:', imageUrl)
} else {
  console.log('  No banner found. Pass --banner "/path/to/Branding_Banner.jpg" to add one.')
}

// ── Step 4b: Insert ───────────────────────────────────────────────────────────

const tags = tagsArg ? tagsArg.split(',').map(t => t.trim()) : []
const eventData = {
  slug,
  title:        scraped.title,
  description:  scraped.description,
  date:         utcStart.toISOString(),
  end_date:     utcEnd?.toISOString() ?? null,
  venue:        scraped.venue,
  address:      scraped.address,
  tags,
  payment_link: scraped.ticketLink,
  image_url:    imageUrl,
  banner_url:   imageUrl,
  presented_by: presBy,
}

console.log('\n  Event data:')
console.log(JSON.stringify(eventData, null, 2))

if (DRY_RUN) {
  console.log('\n-- DRY RUN: nothing written to DB --')
  process.exit(0)
}

const result = await sql`
  INSERT INTO events (
    slug, title, description, date, end_date,
    venue, address, tags, payment_link, suggested_price,
    image_url, banner_url, presented_by,
    is_published, is_public
  ) VALUES (
    ${eventData.slug},
    ${eventData.title},
    ${eventData.description},
    ${eventData.date},
    ${eventData.end_date},
    ${eventData.venue},
    ${eventData.address},
    ${tags},
    ${eventData.payment_link},
    null,
    ${eventData.image_url},
    ${eventData.banner_url},
    ${eventData.presented_by},
    true, true
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug, title
`

if (result.length > 0) {
  console.log('\nDone. Event added:', result[0].title)
  console.log('Live at: https://ticket-shameless.vercel.app/events/' + result[0].slug)
} else {
  console.log('\nSlug conflict — not inserted.')
}

// ── Helper: auto-find Branding_Banner.jpg ─────────────────────────────────────

function autoFindBanner(title) {
  if (!title) return null
  const words = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3)
  try {
    const dirs = readdirSync(SHAMELESS_ROOT)
    for (const dir of dirs) {
      const dirLower = dir.toLowerCase()
      if (words.some(w => dirLower.includes(w))) {
        const candidate = path.join(SHAMELESS_ROOT, dir, 'JPEG', 'Branding_Banner.jpg')
        if (existsSync(candidate)) {
          console.log('  Auto-found banner:', candidate)
          return candidate
        }
      }
    }
  } catch {}
  return null
}
