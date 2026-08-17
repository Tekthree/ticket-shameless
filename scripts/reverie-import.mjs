/**
 * reverie-import.mjs
 *
 * Recurring: imports specific Reverie Society Eventbrite URLs directly.
 * fb-bulk-import.mjs only discovers events under the Shameless organizer page —
 * Reverie Society is co-presented (Viva, Uniting Souls, & Shameless) and its
 * Eventbrite listings live under a different organizer, so they never show up
 * in that scrape. Same per-event scrape/insert logic as fb-bulk-import.mjs,
 * just fed an explicit URL list instead of discovering them from an organizer page.
 *
 * Find current/upcoming Reverie URLs at the collection page:
 *   https://www.eventbrite.com/cc/reverie-society-sundays-4701833
 * (fastest way to pull it: firecrawl scrape that URL, format markdown+links —
 * "Upcoming (N)" events are listed first, rest are past.)
 *
 * Title convention (apply manually after import, script does not auto-rename):
 *   "Reverie Society: [Headliner]" — e.g. "Reverie Society: David Scuba",
 *   "Reverie Society: Diffusion Takeover". Drop the raw Eventbrite
 *   "Sunday M/D/YY - " prefix/suffix noise.
 *
 * Known Eventbrite layout gotcha (fixed 2026-08-17): the description scraper
 * isolates text between the "Overview" and "Good to know" headings — those are
 * stable across Eventbrite's layout even when CSS selectors for the description
 * container aren't. If a future layout change breaks this again, the symptom is
 * an inserted event with no lineup and a description full of organizer/follower
 * boilerplate instead of party copy — verify description content after import,
 * don't trust it blindly.
 *
 * Prerequisites:
 *   1. Min running with remote debugging on 9222:
 *      DISPLAY=:0 /opt/Min/min --remote-debugging-port=9222 &
 *   2. Prod env pulled: npx vercel env pull /tmp/vercel-prod-env --environment=production
 *
 * Connects via Puppeteer, not Playwright — Playwright's connectOverCDP hangs
 * indefinitely attaching to Min's worker target. Do not switch this back.
 *
 * Usage:
 *   1. Edit eventUrls below with the URLs to import
 *   2. node scripts/reverie-import.mjs --dry-run   (verify title/date/lineup parse correctly)
 *   3. node scripts/reverie-import.mjs             (writes to DB — skips events already present)
 *   4. Manually rename titles to the "Reverie Society: [Headliner]" convention
 *   5. Warm the ISR cache: curl the event page + each new lineup DJ's /djs/[slug] page
 *      twice (60s apart) so Tek doesn't see a stale "no upcoming show" page
 */

// NOTE: connectOverCDP via Playwright hangs indefinitely attaching to Min's worker
// target (min://app/js/util/processWorker.js) — confirmed 2026-07-23 and again
// 2026-08-17. Puppeteer connects cleanly with Min's default targets untouched.
// See memory: feedback_browser_tools.md. Do not switch this back to Playwright.
import puppeteer from '/home/tekthree/partiful-scraper/files/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'
import { neon } from '@neondatabase/serverless'
import { readFileSync, existsSync, readdirSync } from 'fs'
import path from 'path'

const CDP_URL        = 'http://localhost:9222'
const UPLOAD_URL     = 'https://ticket-shameless.vercel.app/api/upload'
const SHAMELESS_ROOT = '/mnt/e/WORK/SHAMELESS'
const DRY_RUN        = process.argv.includes('--dry-run')

// Edit this list before each run — see collection URL in the docblock above.
const eventUrls = [
  // 'https://www.eventbrite.com/e/reverie-society-...',
]

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

// ── Helpers (identical to fb-bulk-import.mjs) ──────────────────────────────────

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

function parseISODate(isoStr) {
  if (!isoStr) return null
  if (/[Z]$/.test(isoStr) || /[+\-]\d{2}:\d{2}$/.test(isoStr)) return new Date(isoStr)
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

/**
 * Reverie Society descriptions don't use Shameless's own "++Name++" convention —
 * lineup is a "DJ's:" header followed by one artist per line (blank-line separated),
 * with "X" (not "b2b") marking back-to-back sets. Terminates at the first line that
 * reads as a sentence rather than a name.
 */
function parseDJsList(description) {
  if (!description) return []
  const lines = description.split('\n').map(l => l.trim()).filter(Boolean)
  const startIdx = lines.findIndex(l => /^dj'?s:?$/i.test(l))
  if (startIdx === -1) return []

  const artists = []
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    const wordCount = line.split(/\s+/).length
    if (wordCount > 5 || /[.!?]$/.test(line) || /^(a|the|it'?s|expect|shameless|uniting|viva)\b/i.test(line)) break

    const parts = line.split(/\s+x\s+/i).map(p => p.trim()).filter(Boolean)
    for (const name of parts) {
      if (!name || name.length < 2 || name.length >= 60) continue
      if (/\btba\b|\btbd\b/i.test(name)) continue
      artists.push({ name, stage: null, bio: null, ra: null, soundcloud: null, instagram: null, youtube: null })
    }
  }
  return artists
}

function buildTags(title, description) {
  const tags = ['house', 'deep house']
  if (/rooftop/i.test(title + ' ' + (description ?? ''))) tags.push('rooftop party')
  if (/sunday|brunch/i.test(title)) tags.push('day party')
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
      if (imgUrl && !/default|placeholder|fallback|static\.eventbrite|img\.evbuc/i.test(imgUrl)) {
        return imgUrl
      }
    } catch {}
  }
  return null
}

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

// ── Connect + fetch existing DB state ──────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

console.log('\n[1/2] Connecting to browser...')
const browser = await puppeteer.connect({ browserURL: CDP_URL })
const pages = await browser.pages()
const page = pages[0] ?? await browser.newPage()

console.log('[1/2] Checking existing events in DB...')
const existingEvents = await sql`SELECT slug, title, date FROM events`
const existingSlugs = new Set(existingEvents.map(e => e.slug))
console.log(`      ${existingSlugs.size} events already in DB`)

// ── Scrape and import each event ───────────────────────────────────────────────

const results = { inserted: [], skipped: [], failed: [] }

for (const ebUrl of eventUrls) {
  console.log(`\n[2/2] → ${ebUrl}`)

  try {
    await page.goto(ebUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await sleep(3000)

    try {
      // "View all event details" shows up instead of "Show more"/"Read more" on
      // ended/past Eventbrite listings — description is collapsed behind it there.
      const clicked = await page.evaluate(() => {
        const clickable = [...document.querySelectorAll('button, a')]
          .find(b => /show more|read more|view all event details/i.test(b.textContent ?? ''))
        if (clickable) { clickable.click(); return true }
        return false
      })
      if (clicked) await sleep(1200)
    } catch {}

    const scraped = await page.evaluate(() => {
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
          jsonImage = Array.isArray(ev.image) ? ev.image[0] : (ev.image ?? null)
          if (ev.location?.name) jsonVenue = ev.location.name
          if (ev.location?.address) {
            const a = ev.location.address
            jsonAddress = typeof a === 'string'
              ? a
              : (a.streetAddress?.includes(',') ? a.streetAddress
                : [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].filter(Boolean).join(', '))
          }
          break
        } catch {}
      }

      const title = jsonTitle ?? document.querySelector('h1')?.textContent?.trim() ?? null

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

      // Eventbrite's current layout doesn't expose the party copy via any stable
      // selector above — descSelectors matches nothing and the `main` fallback pulls
      // in surrounding page chrome (organizer follower counts, "Good to know" boilerplate,
      // location/map block) instead of the actual Overview text. Isolate the real copy
      // by slicing between the "Overview" and "Good to know" headings, which are present
      // on every Eventbrite event page regardless of description content.
      if (description) {
        const overviewIdx = description.indexOf('Overview')
        const goodToKnowIdx = description.indexOf('Good to know')
        if (overviewIdx !== -1 && goodToKnowIdx !== -1 && goodToKnowIdx > overviewIdx) {
          description = description.slice(overviewIdx + 'Overview'.length, goodToKnowIdx)
            .replace(/^Read less\s*/i, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
        }
      }

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

    const parsed = parseDescriptionData(scraped.description)
    const { bios, presentedBy: descPresentedBy } = parsed
    const artists = parsed.artists.length > 0 ? parsed.artists : parseDJsList(scraped.description)
    for (const a of artists) {
      if (!a.bio) a.bio = bios[a.name.toLowerCase()] ?? null
    }
    assignSocialLinks(artists, scraped.socialAnchors)

    const presentedBy = descPresentedBy ?? 'Viva, Uniting Souls, & Shameless'
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
        return `${a.name}${a.stage ? ` [${a.stage}]` : ''}${socials.length ? ` (${socials.join('/')})` : ''}`
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
      imageUrl = scraped.jsonImage
      console.log(`  Banner:  using Eventbrite image`)
    } else {
      console.log('  Banner:  not found — set manually later')
    }

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

    if (artists.length > 0) {
      let newDjCount = 0
      for (let i = 0; i < artists.length; i++) {
        const a = artists[i]

        let djRows = await sql`
          SELECT id FROM djs
          WHERE lower(name) = lower(${a.name})
          OR lower(${a.name}) = any(select lower(x) from unnest(aliases) as x)
          LIMIT 1
        `
        let djId = djRows[0]?.id ?? null

        const hasSocials = a.ra || a.soundcloud || a.instagram || a.youtube
        const hasBio = !!a.bio

        let profileImageUrl = null
        if (hasSocials) {
          const sourceUrl = await fetchArtistImage(a)
          if (sourceUrl) profileImageUrl = await uploadImageFromUrl(sourceUrl, a.name)
        }

        if (!djId && (hasBio || hasSocials)) {
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

  await sleep(1500)
}

browser.disconnect() // NOT browser.close() — that would kill Min itself, not just this session

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
