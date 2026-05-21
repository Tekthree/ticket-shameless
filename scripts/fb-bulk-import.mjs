/**
 * fb-bulk-import.mjs
 *
 * Scrapes ALL upcoming events from the Shameless Facebook page,
 * skips ones already in the DB, and inserts new ones including
 * description, lineup, and stage (rooftop / loft / main).
 *
 * Prerequisites:
 *   1. Min Browser running and logged into Facebook:
 *      /opt/Min/min --remote-debugging-port=9222
 *   2. Prod env pulled:
 *      cd /home/tekthree/ticket-shameless && npx vercel env pull /tmp/vercel-prod-env --environment=production
 *
 * Usage:
 *   node scripts/fb-bulk-import.mjs [--dry-run]
 */

import { chromium } from 'playwright'
import { neon } from '@neondatabase/serverless'
import { readFileSync, existsSync, readdirSync } from 'fs'
import path from 'path'

const CDP_URL        = 'http://localhost:9222'
const FB_EVENTS_URL  = 'https://www.facebook.com/shamelessinseattle/events'
const UPLOAD_URL     = 'https://ticket-shameless.vercel.app/api/upload'
const SHAMELESS_ROOT = '/mnt/e/WORK/SHAMELESS'
const DRY_RUN        = process.argv.includes('--dry-run')

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
const sql = neon(getProd('DATABASE_URL'), { fetchOptions: { cache: 'no-store' } })

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSlug(title) {
  return (title ?? '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, 80)
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const pad = n => String(n).padStart(2, '0')

function parseDateLine(dateLine) {
  const dm = dateLine?.match(/(\w+day),\s+(\w+)\s+(\d+),\s+(\d{4})\s+at\s+(\d+)(?::(\d+))?\s*([AP]M)/i)
  if (!dm) return null
  const [,, month, day, year, hrStr, minStr, ampm] = dm
  const monthIdx = MONTHS.findIndex(m => m.toLowerCase() === month.toLowerCase())
  let hr = parseInt(hrStr)
  const mn = parseInt(minStr ?? '0')
  if (ampm.toUpperCase() === 'PM' && hr !== 12) hr += 12
  if (ampm.toUpperCase() === 'AM' && hr === 12) hr = 0
  const isDST = monthIdx >= 2 && monthIdx <= 10
  const tzOffset = isDST ? '-07:00' : '-08:00'
  const iso = `${year}-${pad(monthIdx + 1)}-${pad(parseInt(day))}T${pad(hr)}:${pad(mn)}:00${tzOffset}`
  return new Date(iso)
}

function parseEndTime(dateLine, endTimeStr) {
  if (!endTimeStr || !dateLine) return null
  const dm = dateLine?.match(/(\w+day),\s+(\w+)\s+(\d+),\s+(\d{4})\s+at\s+(\d+)(?::(\d+))?\s*([AP]M)/i)
  if (!dm) return null
  const [,, month, day, year, hrStr] = dm
  const monthIdx = MONTHS.findIndex(m => m.toLowerCase() === month.toLowerCase())
  const startHr = parseInt(hrStr)
  const [endH, endM] = endTimeStr.split(':').map(Number)
  let endDay = parseInt(day)
  if (endH < startHr) endDay += 1
  const isDST = monthIdx >= 2 && monthIdx <= 10
  const tzOffset = isDST ? '-07:00' : '-08:00'
  const iso = `${year}-${pad(monthIdx + 1)}-${pad(endDay)}T${pad(endH)}:${pad(endM ?? 0)}:00${tzOffset}`
  return new Date(iso)
}

function detectStage(text) {
  const t = (text ?? '').toLowerCase()
  if (/rooftop/i.test(t)) return 'rooftop'
  if (/loft/i.test(t)) return 'loft'
  if (/back\s*room/i.test(t)) return 'back'
  return null
}

/**
 * Parse artist lineup from a description string.
 * Looks for lines after "Lineup", "Artists", "DJs", or bullet-separated names.
 * Returns array of { name, stage }.
 */
function parseLineup(description, eventTitle) {
  if (!description) return []

  const lines = description.split('\n').map(l => l.trim()).filter(Boolean)
  const artists = []
  let inLineup = false
  const lineupTrigger = /^(lineup|dj\s*lineup|artists?|djs?|performing|featuring)[:\s]*$/i
  const stopWords = /^(tickets?|location|venue|address|about|info|more info|presented by|doors|date|time|age)/i
  const noiseWords = /^(and|featuring|feat\.|ft\.|vs\.?|b2b|back\s*to\s*back|\+)$/i

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (lineupTrigger.test(line)) {
      inLineup = true
      continue
    }

    // Stop collecting at section breaks
    if (inLineup && stopWords.test(line)) break

    if (inLineup || line.startsWith('•') || line.startsWith('·') || line.startsWith('-')) {
      // Clean the artist name
      let name = line.replace(/^[•·\-\*]\s*/, '').trim()

      // Handle "Artist1 b2b Artist2" — split into two
      if (/\bb2b\b/i.test(name)) {
        const parts = name.split(/\s+b2b\s+/i)
        for (const part of parts) {
          const cleaned = part.trim()
          if (cleaned && !noiseWords.test(cleaned) && cleaned.length > 1 && cleaned.length < 50) {
            const stage = detectStage(cleaned) ?? detectStage(eventTitle)
            artists.push({ name: cleaned, stage })
          }
        }
        continue
      }

      if (name && !noiseWords.test(name) && !lineupTrigger.test(name) && !stopWords.test(name) && name.length > 1 && name.length < 60) {
        // Skip lines that look like full sentences (likely description prose)
        if (name.split(' ').length > 6 && !line.startsWith('•')) continue
        const stage = detectStage(name) ?? null
        artists.push({ name, stage })
      }
    }
  }

  // Deduplicate by name
  const seen = new Set()
  return artists.filter(a => {
    if (seen.has(a.name.toLowerCase())) return false
    seen.add(a.name.toLowerCase())
    return true
  })
}

function autoFindBanner(title) {
  if (!title || !existsSync(SHAMELESS_ROOT)) return null
  const words = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3)
  try {
    const dirs = readdirSync(SHAMELESS_ROOT)
    for (const dir of dirs) {
      const dirLower = dir.toLowerCase().replace(/[^a-z0-9\s]/g, '')
      const matches = words.filter(w => dirLower.includes(w))
      if (matches.length >= 2) {
        const jpegDir = path.join(SHAMELESS_ROOT, dir, 'JPEG')
        if (existsSync(jpegDir)) {
          const bannerPath = path.join(jpegDir, 'Branding_Banner.jpg')
          if (existsSync(bannerPath)) return bannerPath
        }
      }
    }
  } catch {}
  return null
}

// ── Step 1: Collect event URLs from the listing page ─────────────────────────

console.log('\n[1/3] Connecting to Min Browser...')
const browser = await chromium.connectOverCDP(CDP_URL)
const context = browser.contexts()[0]
const pages = context.pages()
const page = pages.find(p => p.url().includes('facebook.com')) ?? pages[0]

console.log(`[1/3] Navigating to ${FB_EVENTS_URL}`)
await page.goto(FB_EVENTS_URL, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)

// Scroll to load all events
console.log('[1/3] Scrolling to load all upcoming events...')
let prevCount = 0
for (let i = 0; i < 30; i++) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1500)
  const count = await page.evaluate(() =>
    new Set([...document.querySelectorAll('a[href*="/events/"]')]
      .map(a => a.href.match(/\/events\/(\d+)/)?.[1])
      .filter(Boolean)
    ).size
  )
  if (count === prevCount) break
  prevCount = count
}

const eventUrls = await page.evaluate(() => {
  const ids = new Set()
  for (const a of document.querySelectorAll('a[href*="/events/"]')) {
    const m = a.href.match(/\/events\/(\d+)/)
    if (m) ids.add(m[1])
  }
  return [...ids].map(id => `https://www.facebook.com/events/${id}/`)
})

console.log(`[1/3] Found ${eventUrls.length} upcoming event(s)`)

// ── Step 2: Check which already exist in DB ───────────────────────────────────

console.log('\n[2/3] Checking existing events in DB...')
const existingEvents = await sql`SELECT slug, title FROM events`
const existingSlugs = new Set(existingEvents.map(e => e.slug))
console.log(`      ${existingSlugs.size} events already in DB`)

// ── Step 3: Scrape and import each new event ─────────────────────────────────

const results = { inserted: [], skipped: [], failed: [] }

for (const fbUrl of eventUrls) {
  console.log(`\n[3/3] → ${fbUrl}`)

  try {
    await page.goto(fbUrl, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)

    // Expand description
    try {
      const btn = page.locator('div[role="button"]:has-text("See more")').first()
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click()
        await page.waitForTimeout(800)
      }
    } catch {}

    const scraped = await page.evaluate(() => {
      const mainEl   = document.querySelector('[role="main"]')
      const mainText = mainEl?.innerText ?? ''
      const lines    = mainText.split('\n').map(l => l.trim()).filter(Boolean)

      // Date line
      const dateMatch = mainText.match(/\w+day,\s+\w+\s+\d+,\s+\d{4}\s+at\s+\d+(?::\d+)?\s*[AP]M/i)
      const dateLine  = dateMatch?.[0] ?? null

      // End time from event: "7 PM – 11 PM" style
      const timeRangeMatch = mainText.match(/\d+(?::\d+)?\s*(?:AM|PM)\s*[–\-]\s*(\d+(?::\d+)?\s*(?:AM|PM))/i)
      const endTimeRaw = timeRangeMatch?.[1] ?? null

      // Title
      let title = null
      if (dateLine) {
        const dateIdx = lines.findIndex(l => l === dateLine)
        if (dateIdx !== -1 && lines[dateIdx + 1]) title = lines[dateIdx + 1]
      }
      if (!title) {
        title = document.querySelector('meta[property="og:title"]')?.content?.replace(/\s*\|.*$/, '').trim()
          ?? document.title?.replace(/\s*\|.*$/, '').trim()
      }

      // Venue
      let venue = null
      if (dateLine) {
        const dateIdx = lines.findIndex(l => l === dateLine)
        if (dateIdx !== -1 && lines[dateIdx + 2]) venue = lines[dateIdx + 2]
      }

      // Address
      const addrMatch = mainText.match(/\d+\s+\w[^,\n]+,\s*Seattle,\s*WA\s*\d{5}/)
      const address = addrMatch?.[0]?.replace(/-\d+,.*$/, '').trim() ?? null

      // Ticket link
      let ticketLink = null
      for (const a of document.querySelectorAll('a[href]')) {
        if (/eventbrite|tixr|dice\.fm|ra\.co|axs|ticketweb/i.test(a.href)) {
          const m = a.href.match(/[?&]u=([^&]+)/)
          ticketLink = m ? decodeURIComponent(m[1]).split('?')[0] : a.href.split('?')[0]
          break
        }
      }

      // Description
      const pubIdx = mainText.indexOf('Anyone on or off Facebook')
      const addrIdx = address ? mainText.indexOf(address) : -1
      let description = null
      if (pubIdx !== -1) {
        const raw = addrIdx > pubIdx
          ? mainText.slice(pubIdx + 'Anyone on or off Facebook'.length, addrIdx)
          : mainText.slice(pubIdx + 'Anyone on or off Facebook'.length, pubIdx + 4000)
        description = raw
          .replace(/\n+/g, '\n').trim()
          .replace(/\s*See less[\s\S]*$/, '')
          .replace(/\s*\*\*By entering a Shameless event[\s\S]*$/, '')
          .trim()
      }

      return { title, dateLine, endTimeRaw, venue, address, ticketLink, description }
    })

    if (!scraped.title || !scraped.dateLine) {
      console.log('  Skipping — could not parse title or date')
      results.failed.push({ url: fbUrl, reason: 'parse failure' })
      continue
    }

    const slug = makeSlug(scraped.title)

    if (existingSlugs.has(slug)) {
      console.log(`  Already in DB: "${scraped.title}" — skipping`)
      results.skipped.push(scraped.title)
      continue
    }

    const utcStart = parseDateLine(scraped.dateLine)
    if (!utcStart) {
      console.log('  Could not parse date:', scraped.dateLine)
      results.failed.push({ url: fbUrl, reason: 'date parse failure' })
      continue
    }

    // Parse end time from the event page's time range (e.g. "7 PM – 11 PM")
    let utcEnd = null
    if (scraped.endTimeRaw) {
      const endMatch = scraped.endTimeRaw.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i)
      if (endMatch) {
        let endH = parseInt(endMatch[1])
        const endM = parseInt(endMatch[2] ?? '0')
        if (endMatch[3].toUpperCase() === 'PM' && endH !== 12) endH += 12
        if (endMatch[3].toUpperCase() === 'AM' && endH === 12) endH = 0
        const startHr = utcStart.getUTCHours() + (utcStart.getTimezoneOffset() / -60)
        const dayStr = scraped.dateLine.match(/(\w+)\s+(\d+),\s+(\d{4})/)?.[0]
        utcEnd = parseEndTime(scraped.dateLine, `${pad(endH)}:${pad(endM)}`)
      }
    }

    // Detect stage from title and description
    const titleStage = detectStage(scraped.title)

    // Parse lineup from description
    const artists = parseLineup(scraped.description, scraped.title)

    // If multiple stages detected in lineup, assign them
    const hasMultipleStages = artists.length > 0 && new Set(artists.map(a => a.stage).filter(Boolean)).size > 1

    console.log(`  Title:   ${scraped.title}`)
    console.log(`  Date:    ${utcStart.toISOString()}`)
    console.log(`  Venue:   ${scraped.venue ?? '—'}`)
    console.log(`  Stage:   ${titleStage ?? 'none detected'}`)
    console.log(`  Artists: ${artists.length > 0 ? artists.map(a => a.name).join(', ') : 'none parsed'}`)

    if (DRY_RUN) {
      console.log('  [DRY RUN — not inserting]')
      results.inserted.push(scraped.title + ' (dry run)')
      continue
    }

    // Upload banner if found on E: drive
    let imageUrl = null
    const bannerPath = autoFindBanner(scraped.title)
    if (bannerPath) {
      try {
        const fileBuffer = readFileSync(bannerPath)
        const blob = new Blob([fileBuffer], { type: 'image/jpeg' })
        const form = new FormData()
        form.append('file', blob, path.basename(bannerPath))
        form.append('folder', 'events')
        const res = await fetch(UPLOAD_URL, { method: 'POST', body: form })
        const json = await res.json()
        imageUrl = json.url ?? null
        console.log(`  Banner:  uploaded from ${bannerPath}`)
      } catch (e) {
        console.log(`  Banner:  upload failed — ${e.message}`)
      }
    } else {
      console.log('  Banner:  not found on E: drive — set manually later')
    }

    // Insert event
    const inserted = await sql`
      INSERT INTO events (
        slug, title, description, date, end_date,
        venue, address, tags, payment_link,
        image_url, banner_url,
        is_published, is_public
      ) VALUES (
        ${slug},
        ${scraped.title},
        ${scraped.description},
        ${utcStart.toISOString()},
        ${utcEnd?.toISOString() ?? null},
        ${scraped.venue},
        ${scraped.address},
        ${[]},
        ${scraped.ticketLink},
        ${imageUrl},
        ${imageUrl},
        true, true
      )
      ON CONFLICT (slug) DO NOTHING
      RETURNING id, slug, title
    `

    if (inserted.length === 0) {
      console.log('  Slug conflict — skipped')
      results.skipped.push(scraped.title)
      continue
    }

    const eventId = inserted[0].id
    existingSlugs.add(slug)

    // Insert lineup
    if (artists.length > 0) {
      for (let i = 0; i < artists.length; i++) {
        const a = artists[i]
        // Try to find matching DJ profile by name
        const djRows = await sql`
          SELECT id, slug FROM djs
          WHERE lower(name) = lower(${a.name})
          OR lower(${a.name}) = any(select lower(x) from unnest(aliases) as x)
          LIMIT 1
        `
        const djId = djRows[0]?.id ?? null
        await sql`
          INSERT INTO lineup (event_id, name, dj_id, sort_order, stage)
          VALUES (${eventId}, ${a.name}, ${djId}, ${i}, ${a.stage ?? titleStage})
        `
      }
      console.log(`  Lineup:  inserted ${artists.length} artist(s)`)
    }

    console.log(`  Inserted: https://ticket-shameless.vercel.app/events/${slug}`)
    results.inserted.push(scraped.title)

  } catch (e) {
    console.log(`  Error: ${e.message}`)
    results.failed.push({ url: fbUrl, reason: e.message })
  }

  // Small pause between events to avoid FB rate limiting
  await page.waitForTimeout(1500)
}

await browser.close()

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════')
console.log(`Inserted (${results.inserted.length}):`)
results.inserted.forEach(t => console.log(`  ✓ ${t}`))
console.log(`\nSkipped — already in DB (${results.skipped.length}):`)
results.skipped.forEach(t => console.log(`  – ${t}`))
if (results.failed.length > 0) {
  console.log(`\nFailed (${results.failed.length}):`)
  results.failed.forEach(f => console.log(`  ✗ ${f.url} — ${f.reason}`))
}
console.log('══════════════════════════════════════════')
