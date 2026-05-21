/**
 * fb-bulk-import.mjs
 *
 * Scrapes ALL upcoming events from the Shameless Eventbrite organizer page,
 * skips ones already in the DB, and inserts new ones including full artist
 * lineup with stage assignments, bios, and social links (RA, SC, IG, YT).
 *
 * Prerequisites:
 *   1. Min Browser running:
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
const EB_ORG_URL     = 'https://www.eventbrite.com/o/12623653314'
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

function cleanTitle(title) {
  return (title ?? '')
    .replace(/^\(\d+\+\)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function makeSlug(title) {
  return cleanTitle(title)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, 80)
}

const pad = n => String(n).padStart(2, '0')

/** Parse a JSON-LD ISO date string (with or without TZ offset) to a UTC Date. */
function parseISODate(isoStr) {
  if (!isoStr) return null
  // Has explicit timezone — let Date() handle it
  if (/[Z]$/.test(isoStr) || /[+\-]\d{2}:\d{2}$/.test(isoStr)) return new Date(isoStr)
  // No TZ — assume Pacific: PDT (UTC-7) Mar–Nov, PST (UTC-8) otherwise
  const month = parseInt(isoStr.slice(5, 7))
  const isDST = month >= 3 && month <= 11
  return new Date(isoStr + (isDST ? '-07:00' : '-08:00'))
}

function detectStage(text) {
  const t = (text ?? '').toLowerCase()
  if (/rooftop/i.test(t)) return 'rooftop'
  if (/loft/i.test(t)) return 'loft'
  if (/back\s*room/i.test(t)) return 'back'
  return null
}

function parseArtistsFromTitle(title) {
  if (!title) return []
  let segment = title
    .replace(/^deck['']d out\s+#?\d+\s*/i, '')
    .replace(/^[\w\s&']+(?:season opener|season finale|pride edition|[\w]+ edition)\s*/i, '')

  const presM = segment.match(/(?:presents?|pres\.?|feat\.?|featuring|w\/|with)\s+(.+)$/i)
  if (presM) segment = presM[1]
  else {
    const dashM = segment.match(/\s[-]\s+(.+)$/)
    if (dashM) segment = dashM[1]
    else return []
  }

  const parts = segment.split(/\s+b2b\s+|\s+\+\s+(?!more)|,\s+/i)
  const artists = []
  for (const part of parts) {
    const name = part
      .replace(/\s*\([^)]+\)/g, ' ')
      .replace(/\s+all\s+vinyl$/i, '')
      .replace(/\s*open\s+to\s+close\s*/i, '')
      .replace(/\s*\+?\s*more!?$/i, '')
      .replace(/\s+showcases?$/i, '')
      .replace(/\s+\d+\s+year\s+anniv.*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!name || name.length < 2 || name.length >= 60) continue
    if (/\btba\b|\btbd\b/i.test(name)) continue
    if (/^\d+$/.test(name)) continue
    if (/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(name)) continue
    if (/\d+\s*(th|rd|st|nd),?\s*\d{4}/i.test(name)) continue
    if (/\d+\s+year\s+anniv/i.test(name)) continue
    if (/^[-–]\s*/.test(name)) continue
    if (/^(more|and|feat|vs|showcase)$/i.test(name)) continue
    artists.push({ name, stage: null, bio: null, ra: null, soundcloud: null, instagram: null, youtube: null })
  }
  return artists
}

const SOCIAL_NOISE = /^(resident advisor|soundcloud|instagram|youtube|you\s*tube|spotify|mixcloud|facebook|twitter|bandcamp|beatport|website|link in bio|ra\.co|tickets?|eventbrite|tixr|buy tickets|get tickets)$/i

function parseDescriptionData(description) {
  if (!description) return { artists: [], bios: {}, presentedBy: null }

  const lines = description.split('\n').map(l => l.trim()).filter(Boolean)
  const artists = []
  const bios = {}
  let presentedBy = null
  let currentStage = null
  let inBioSection = false
  let currentBioName = null
  let currentBioLines = []

  const ARTIST_TAG  = /^\+\+(.+)\+\+$/
  const STAGE_HDR   = /^(rooftop|loft|main|back\s*room)\s+stage[:\s]*/i
  const BIO_START   = /^about\s+(.+?):\s*(.*)/i
  const PRESENTER   = /^(.{2,60}?)\s+presents?\s*$/i
  const SECTION_SEP = /^[-=─═·•]{4,}$/

  function saveBio() {
    if (currentBioName && currentBioLines.length) {
      bios[currentBioName.toLowerCase()] = currentBioLines.join(' ').replace(/\s+/g, ' ').trim()
    }
    currentBioName = null
    currentBioLines = []
  }

  for (const line of lines) {
    if (SECTION_SEP.test(line)) { saveBio(); inBioSection = false; continue }

    const bioM = BIO_START.exec(line)
    if (bioM) {
      saveBio()
      currentBioName = bioM[1].trim()
      inBioSection = true
      if (bioM[2]) currentBioLines.push(bioM[2])
      continue
    }
    if (inBioSection) { currentBioLines.push(line); continue }

    if (SOCIAL_NOISE.test(line)) continue

    const stageM = STAGE_HDR.exec(line)
    if (stageM) {
      const s = stageM[1].toLowerCase()
      currentStage = s === 'rooftop' ? 'rooftop' : s === 'loft' ? 'loft' : /back/.test(s) ? 'back' : null
      continue
    }

    const presM = PRESENTER.exec(line)
    if (presM && !presentedBy) { presentedBy = presM[1].trim(); continue }

    const artM = ARTIST_TAG.exec(line)
    if (artM) {
      const rawName = artM[1]
        .replace(/\s*\([^)]+\)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (!rawName || rawName.length < 2) continue
      if (/\btba\b|\btbd\b/i.test(rawName)) continue
      if (/deck['']d out\s+\d{4}/i.test(rawName)) continue
      if (/summer series|season pass|season opener|season finale/i.test(rawName)) continue
      const b2bParts = rawName.split(/\s+b2b\s+/i).map(p => p.trim()).filter(p => p.length >= 2 && p.length <= 60)
      for (const name of b2bParts) {
        artists.push({ name, stage: currentStage, bio: null, ra: null, soundcloud: null, instagram: null, youtube: null })
      }
      continue
    }
  }
  saveBio()

  const seen = new Set()
  const uniqueArtists = artists.filter(a => {
    if (seen.has(a.name.toLowerCase())) return false
    seen.add(a.name.toLowerCase())
    return true
  })

  return { artists: uniqueArtists, bios, presentedBy }
}

function extractPresentedBy(title) {
  const stripped = title.replace(/^deck['']d out\s+#?\d+\s*/i, '')
  const m = stripped.match(/^(.+?)\s+(?:presents?|pres\.?|feat\.?|featuring)\s+/i)
  if (m) {
    const p = m[1].trim()
    if (p && p.length < 60) return p
  }
  return 'Shameless'
}

function buildTags(title, description) {
  const tags = ['house', 'deep house', 'techno']
  if (/deck['']d out/i.test(title) || /rooftop/i.test(title + ' ' + (description ?? ''))) {
    tags.push('rooftop party')
  }
  return tags
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

/**
 * Fetch an artist profile image by scraping og:image from RA, Soundcloud, or YouTube.
 * Returns the raw source image URL, or null if nothing usable found.
 */
async function fetchArtistImage(artist) {
  const sources = [artist.ra, artist.soundcloud, artist.youtube].filter(Boolean)
  for (const url of sources) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const html = await res.text()
      const m = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
             ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)
      const imgUrl = m?.[1]
      // Skip defaults, placeholders, and Eventbrite generic images
      if (imgUrl && !/default|placeholder|fallback|static\.eventbrite|img\.evbuc/i.test(imgUrl)) {
        return imgUrl
      }
    } catch {}
  }
  return null
}

/** Download an image from sourceUrl and re-upload it to R2 via the upload endpoint. */
async function uploadImageFromUrl(sourceUrl, name) {
  try {
    const imgRes = await fetch(sourceUrl, { signal: AbortSignal.timeout(10000) })
    if (!imgRes.ok) return null
    const buffer = await imgRes.arrayBuffer()
    const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
    const filename = `${makeSlug(name)}.${ext}`
    const blob = new Blob([buffer], { type: contentType })
    const form = new FormData()
    form.append('file', blob, filename)
    form.append('folder', 'djs')
    const uploadRes = await fetch(UPLOAD_URL, { method: 'POST', body: form })
    const json = await uploadRes.json()
    return json.url ?? null
  } catch {
    return null
  }
}

/** Match social link URLs to artists by name slug. */
function assignSocialLinks(artists, socialAnchors) {
  for (const artist of artists) {
    const nameSlug = artist.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)
    if (nameSlug.length < 3) continue
    const prefix = nameSlug.slice(0, Math.min(5, nameSlug.length))
    for (const href of socialAnchors) {
      const h = href.toLowerCase()
      const urlPath = h.replace(/^https?:\/\/[^/]+\//, '').replace(/[^a-z0-9]/g, '').slice(0, 15)
      if (!urlPath.includes(prefix)) continue
      if (!artist.ra       && h.includes('ra.co/dj'))                                         artist.ra        = href
      if (!artist.soundcloud && h.includes('soundcloud.com'))                                  artist.soundcloud = href
      if (!artist.instagram  && h.includes('instagram.com') && !/\/p\/|\/reel\//.test(h))     artist.instagram  = href
      if (!artist.youtube    && (h.includes('youtube.com') || h.includes('youtu.be')))        artist.youtube    = href
    }
  }
}

// ── Step 1: Collect event URLs from Eventbrite organizer page ─────────────────

console.log('\n[1/3] Connecting to Min Browser...')
const browser = await chromium.connectOverCDP(CDP_URL)
const context = browser.contexts()[0]
const page = context.pages()[0]

console.log(`[1/3] Navigating to Eventbrite organizer page...`)
await page.goto(EB_ORG_URL, { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.waitForTimeout(3000)

// Dismiss cookie/GDPR consent banner if present
try {
  const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("Accept All"), button:has-text("I Accept")').first()
  if (await acceptBtn.isVisible({ timeout: 3000 })) {
    await acceptBtn.click()
    await page.waitForTimeout(800)
  }
} catch {}

// Scroll and click "Show more" until all events are loaded
console.log('[1/3] Scrolling to load all upcoming events...')
let prevCount = 0
let stableRuns = 0
for (let i = 0; i < 40; i++) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1500)

  // Click "Show more" if present
  try {
    const showMore = page.locator('button:has-text("Show more")').first()
    if (await showMore.isVisible({ timeout: 1000 })) {
      await showMore.click()
      await page.waitForTimeout(2000)
    }
  } catch {}

  const count = await page.evaluate(() =>
    new Set(
      [...document.querySelectorAll('a[href*="/e/"]')]
        .map(a => a.href.split('?')[0])
        .filter(u => /eventbrite\.com\/e\/[a-z0-9-]+-\d{8,}/.test(u))
    ).size
  )
  if (count === prevCount) {
    stableRuns++
    if (stableRuns >= 3) break
  } else {
    stableRuns = 0
    prevCount = count
  }
}

const eventUrls = await page.evaluate(() => {
  const seen = new Set()
  const result = []
  for (const a of document.querySelectorAll('a[href*="/e/"]')) {
    const url = a.href.split('?')[0]
    if (/eventbrite\.com\/e\/[a-z0-9-]+-\d{8,}/.test(url) && !seen.has(url)) {
      seen.add(url)
      result.push(url)
    }
  }
  return result
})

console.log(`[1/3] Found ${eventUrls.length} upcoming event(s)`)

// ── Step 2: Check which already exist in DB ───────────────────────────────────

console.log('\n[2/3] Checking existing events in DB...')
const existingEvents = await sql`SELECT slug, title, date FROM events`
const existingSlugs = new Set(existingEvents.map(e => e.slug))
console.log(`      ${existingSlugs.size} events already in DB`)

// ── Step 3: Scrape and import each event ─────────────────────────────────────

const results = { inserted: [], skipped: [], failed: [] }

for (const ebUrl of eventUrls) {
  console.log(`\n[3/3] → ${ebUrl}`)

  try {
    await page.goto(ebUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(3000)

    // Expand description if truncated
    try {
      const btn = page.locator('button:has-text("Show more"), button:has-text("Read more")').first()
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click()
        await page.waitForTimeout(800)
      }
    } catch {}

    const scraped = await page.evaluate(() => {
      // JSON-LD structured data — Eventbrite uses @type: SocialEvent
      let jsonTitle = null, jsonStart = null, jsonEnd = null
      let jsonVenue = null, jsonAddress = null, jsonImage = null
      for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          const raw = JSON.parse(s.textContent)
          const evArr = Array.isArray(raw) ? raw : [raw]
          const ev = evArr.find(x => x['@type'] === 'Event' || x['@type'] === 'SocialEvent')
          if (!ev) continue
          jsonTitle = ev.name ?? null
          jsonStart = ev.startDate ?? null
          jsonEnd   = ev.endDate ?? null
          // ev.image is the event banner — can be a string or array
          jsonImage = Array.isArray(ev.image) ? ev.image[0] : (ev.image ?? null)
          if (ev.location?.name) jsonVenue = ev.location.name
          if (ev.location?.address) {
            const a = ev.location.address
            // streetAddress often already includes city/state/zip — use as-is if it has a comma
            jsonAddress = typeof a === 'string'
              ? a
              : (a.streetAddress?.includes(',') ? a.streetAddress
                : [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].filter(Boolean).join(', '))
          }
          break
        } catch {}
      }

      const title = jsonTitle ?? document.querySelector('h1')?.textContent?.trim() ?? null

      // Description — try structured selectors first, fall back to main body
      const descSelectors = [
        '[data-testid="structured-content-parent"]',
        '[data-testid="description-container"]',
        '.structured-content',
        '.eds-text--left',
        '.event-description',
      ]
      let description = null
      for (const sel of descSelectors) {
        const el = document.querySelector(sel)
        if (el?.innerText?.trim().length > 50) { description = el.innerText.trim(); break }
      }
      if (!description) {
        const main = document.querySelector('main')
        if (main) description = main.innerText.trim()
      }

      // Social anchors — actual clickable links (EB renders real <a href> for socials)
      const socialAnchors = []
      const seen = new Set()
      for (const a of document.querySelectorAll('a[href]')) {
        const h = a.href.split('?')[0]
        if (seen.has(h)) continue
        if (/(ra\.co\/dj|soundcloud\.com|instagram\.com|youtube\.com|youtu\.be)/i.test(h)) {
          socialAnchors.push(h)
          seen.add(h)
        }
      }

      // FB URL if EB page links to the FB event
      let fbUrl = null
      for (const a of document.querySelectorAll('a[href*="facebook.com/events/"]')) {
        fbUrl = a.href.split('?')[0]
        break
      }

      return { title, jsonStart, jsonEnd, venue: jsonVenue, address: jsonAddress, jsonImage, description, socialAnchors, fbUrl }
    })

    if (!scraped.title || !scraped.jsonStart) {
      console.log('  Skipping — could not parse title or date')
      results.failed.push({ url: ebUrl, reason: 'parse failure' })
      continue
    }

    scraped.title = cleanTitle(scraped.title)

    // Skip season passes — they're not individual shows
    if (/season pass/i.test(scraped.title)) {
      console.log('  Skipping — season pass, not an individual show')
      results.skipped.push(scraped.title + ' (season pass)')
      continue
    }

    const slug = makeSlug(scraped.title)

    if (existingSlugs.has(slug)) {
      console.log(`  Already in DB: "${scraped.title}" — skipping`)
      results.skipped.push(scraped.title)
      continue
    }

    const utcStart = parseISODate(scraped.jsonStart)
    const utcEnd   = scraped.jsonEnd ? parseISODate(scraped.jsonEnd) : null

    if (!utcStart || isNaN(utcStart.getTime())) {
      console.log('  Could not parse date:', scraped.jsonStart)
      results.failed.push({ url: ebUrl, reason: 'date parse failure' })
      continue
    }

    // Skip past events (EB organizer page loads past events when scrolled far enough)
    if (utcStart < new Date()) {
      console.log(`  Skipping — past event (${utcStart.toISOString().slice(0, 10)})`)
      results.skipped.push(scraped.title + ' (past)')
      continue
    }

    // Date + title-similarity duplicate check (catches slug-variant dups)
    const isoDay = utcStart.toISOString().slice(0, 10)
    const newTitlePrefix = scraped.title.toLowerCase().slice(0, 15)
    const sameDayEvent = existingEvents.find(e => {
      if (!e.date) return false
      if (new Date(e.date).toISOString().slice(0, 10) !== isoDay) return false
      return (e.title ?? '').toLowerCase().slice(0, 15) === newTitlePrefix
    })
    if (sameDayEvent) {
      console.log(`  Date+title duplicate: "${scraped.title}" matches existing "${sameDayEvent.title}" — skipping`)
      results.skipped.push(scraped.title + ' (date+title dup)')
      continue
    }

    // Parse description for artists, bios, presentedBy
    const { artists: descArtists, bios, presentedBy: descPresentedBy } = parseDescriptionData(scraped.description)
    const artists = descArtists.length > 0 ? descArtists : parseArtistsFromTitle(scraped.title)

    // Attach bios
    for (const a of artists) {
      if (!a.bio) a.bio = bios[a.name.toLowerCase()] ?? null
    }

    // Assign social links from EB page
    assignSocialLinks(artists, scraped.socialAnchors)

    const presentedBy = descPresentedBy ?? extractPresentedBy(scraped.title)
    const tags = buildTags(scraped.title, scraped.description)
    const titleStage = detectStage(scraped.title)

    console.log(`  Title:   ${scraped.title}`)
    console.log(`  Date:    ${utcStart.toISOString()}${utcEnd ? ` → ${utcEnd.toISOString()}` : ''}`)
    console.log(`  Venue:   ${scraped.venue ?? '—'}`)
    console.log(`  By:      ${presentedBy}`)
    console.log(`  Tags:    ${tags.join(', ')}`)
    if (artists.length > 0) {
      const lines = artists.map(a => {
        const socials = [a.ra && 'RA', a.soundcloud && 'SC', a.instagram && 'IG', a.youtube && 'YT'].filter(Boolean)
        const hasImg = a.ra || a.soundcloud || a.youtube
        return `${a.name}${a.stage ? ` [${a.stage}]` : ''}${socials.length ? ` (${socials.join('/')}${hasImg ? '/img' : ''})` : ''}`
      })
      console.log(`  Artists: ${lines.join(', ')}`)
    } else {
      console.log('  Artists: none parsed')
    }

    if (DRY_RUN) {
      console.log('  [DRY RUN — not inserting]')
      results.inserted.push(scraped.title + ' (dry run)')
      continue
    }

    // Upload banner: prefer E: drive file, fall back to Eventbrite image
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
        console.log(`  Banner:  uploaded from E: drive`)
      } catch (e) {
        console.log(`  Banner:  E: drive upload failed — ${e.message}`)
      }
    } else if (scraped.jsonImage) {
      // Use the Eventbrite event image directly (already a public CDN URL)
      imageUrl = scraped.jsonImage
      console.log(`  Banner:  using Eventbrite image`)
    } else {
      console.log('  Banner:  not found — set manually later')
    }

    // Insert event
    const inserted = await sql`
      INSERT INTO events (
        slug, title, description, date, end_date,
        venue, address, tags, payment_link,
        image_url, banner_url,
        presented_by, facebook_url,
        is_published, is_public
      ) VALUES (
        ${slug},
        ${scraped.title},
        ${scraped.description},
        ${utcStart.toISOString()},
        ${utcEnd?.toISOString() ?? null},
        ${scraped.venue},
        ${scraped.address},
        ${tags},
        ${ebUrl},
        ${imageUrl},
        ${imageUrl},
        ${presentedBy},
        ${scraped.fbUrl ?? null},
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

    // Insert lineup — upsert DJ profiles with bio + social links
    if (artists.length > 0) {
      let newDjCount = 0
      for (let i = 0; i < artists.length; i++) {
        const a = artists[i]

        // Look up existing DJ by name or alias
        let djRows = await sql`
          SELECT id FROM djs
          WHERE lower(name) = lower(${a.name})
          OR lower(${a.name}) = any(select lower(x) from unnest(aliases) as x)
          LIMIT 1
        `
        let djId = djRows[0]?.id ?? null

        const hasSocials = a.ra || a.soundcloud || a.instagram || a.youtube
        const hasBio = !!a.bio

        // Fetch profile image from RA / Soundcloud / YouTube og:image
        let profileImageUrl = null
        if (hasSocials) {
          const sourceUrl = await fetchArtistImage(a)
          if (sourceUrl) profileImageUrl = await uploadImageFromUrl(sourceUrl, a.name)
        }

        if (!djId && (hasBio || hasSocials)) {
          // Create new DJ profile
          const djSlug = makeSlug(a.name)
          const newDj = await sql`
            INSERT INTO djs (slug, name, bio, soundcloud_url, instagram_url, youtube_url, website_url, profile_image_url, is_published)
            VALUES (
              ${djSlug}, ${a.name}, ${a.bio ?? null},
              ${a.soundcloud ?? null}, ${a.instagram ?? null}, ${a.youtube ?? null}, ${a.ra ?? null},
              ${profileImageUrl},
              false
            )
            ON CONFLICT (slug) DO NOTHING
            RETURNING id
          `
          djId = newDj[0]?.id ?? null
          if (djId) newDjCount++
        } else if (djId && (hasBio || hasSocials)) {
          // Enrich existing profile without overwriting already-set fields
          await sql`
            UPDATE djs SET
              soundcloud_url    = COALESCE(soundcloud_url,    ${a.soundcloud ?? null}),
              instagram_url     = COALESCE(instagram_url,     ${a.instagram ?? null}),
              youtube_url       = COALESCE(youtube_url,       ${a.youtube ?? null}),
              website_url       = COALESCE(website_url,       ${a.ra ?? null}),
              bio               = COALESCE(bio,               ${a.bio ?? null}),
              profile_image_url = COALESCE(profile_image_url, ${profileImageUrl})
            WHERE id = ${djId}
          `
        }

        await sql`
          INSERT INTO lineup (event_id, name, dj_id, sort_order, stage)
          VALUES (${eventId}, ${a.name}, ${djId}, ${i}, ${a.stage ?? titleStage})
        `
      }
      console.log(`  Lineup:  ${artists.length} artist(s)${newDjCount > 0 ? `, ${newDjCount} new DJ profile(s) created` : ''}`)
    }

    console.log(`  Inserted: https://ticket-shameless.vercel.app/events/${slug}`)
    results.inserted.push(scraped.title)

  } catch (e) {
    console.log(`  Error: ${e.message}`)
    results.failed.push({ url: ebUrl, reason: e.message })
  }

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
