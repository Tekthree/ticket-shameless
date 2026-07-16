/**
 * generate-descriptions-2026.mjs
 *
 * For each 2026 event missing a description:
 *   1. Pull event data + lineup from DB
 *   2. If an image URL exists, fetch it as base64 and pass to Gemini vision
 *   3. Combine image reading + structured DB data into a prompt
 *   4. Write the generated description back to the DB
 *
 * Run: node scripts/generate-descriptions-2026.mjs
 *
 * Set GEMINI_API_KEY in .env.local (or it falls back to text-only mode if not set)
 */

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
// Fall back to zoo-bot .env for GEMINI_API_KEY if not set locally
if (!process.env.GEMINI_API_KEY) {
  config({ path: '/home/tekthree/zoo-bot/.env', override: false })
}

const sql = neon(process.env.DATABASE_URL)
const GEMINI_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set — will generate from text data only (no flyer vision)')
}

// ── Fetch events missing descriptions in 2026 ──────────────────────────────────
const events = await sql`
  SELECT 
    e.id,
    e.slug,
    e.title,
    e.date,
    e.end_date,
    e.venue,
    e.address,
    e.tags,
    e.presented_by,
    e.suggested_price,
    e.image_url,
    e.banner_url,
    e.square_image_url,
    coalesce(
      json_agg(
        json_build_object(
          'name', l.name,
          'stage', l.stage,
          'time_slot', l.time_slot,
          'is_headliner', coalesce(l.is_headliner, false)
        ) ORDER BY l.sort_order
      ) FILTER (WHERE l.id IS NOT NULL),
      '[]'
    ) AS lineup
  FROM events e
  LEFT JOIN lineup l ON l.event_id = e.id
  WHERE e.is_published = true
    AND (e.description IS NULL OR e.description = '')
    AND e.date >= '2026-01-01'
    AND e.date < '2027-01-01'
  GROUP BY e.id
  ORDER BY e.date ASC
`

console.log(`\n📋 Found ${events.length} 2026 events to describe\n`)

// ── Image → base64 ─────────────────────────────────────────────────────────────
async function fetchImageBase64(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const b64 = Buffer.from(buf).toString('base64')
    const ct = res.headers.get('content-type') ?? 'image/jpeg'
    return { b64, mimeType: ct.split(';')[0] }
  } catch {
    return null
  }
}

// ── Gemini API call ────────────────────────────────────────────────────────────
async function callGemini(parts) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    systemInstruction: {
      parts: [{
        text: `You write short, punchy event descriptions for a Seattle underground house and techno collective called Simply Shameless (aka Shameless Productions). 
The descriptions go on their website event pages. 

Style guide:
- 2–4 short paragraphs, 80–180 words total
- Mention the specific artists by name, their style/origin if known
- Mention the venue, time context (day party, sunset rooftop, late night, etc.)
- Sound like the promoter wrote it — warm, no-hype, scene-aware, lowercase-friendly
- Do NOT use phrases like "experience the magic", "unforgettable night", "join us", "don't miss"
- DO reference: Monkey Loft rooftop if it's a Deck'd Out/rooftop show; "underground" if appropriate
- For Reverie Society: it's a Sunday afternoon series, 3–8pm, community-oriented, often has yoga
- End with practical info: time range and age restriction (21+) if known

Output ONLY the description text. No title, no markdown, no quotes around the output.`
      }]
    }
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini error ${res.status}: ${err.slice(0, 200)}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null
}

// ── Build prompt for one event ─────────────────────────────────────────────────
function buildTextPrompt(ev) {
  const date = new Date(ev.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    timeZone: 'America/Los_Angeles',
  })
  const time = new Date(ev.date).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'America/Los_Angeles',
  })
  const endTime = ev.end_date
    ? new Date(ev.end_date).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
        timeZone: 'America/Los_Angeles',
      })
    : null

  const lineupLines = ev.lineup.map(a => {
    const parts = [`• ${a.name}`]
    if (a.stage) parts.push(`(${a.stage} stage)`)
    if (a.time_slot) parts.push(`@ ${a.time_slot}`)
    if (a.is_headliner) parts.push('— HEADLINER')
    return parts.join(' ')
  }).join('\n')

  const lines = [
    `EVENT: ${ev.title}`,
    `DATE: ${date}, ${time}${endTime ? ` – ${endTime}` : ''}`,
    `VENUE: ${ev.venue ?? 'Monkey Loft'}${ev.address ? `, ${ev.address}` : ''}`,
  ]
  if (ev.presented_by) lines.push(`PRESENTED BY: ${ev.presented_by}`)
  if (ev.tags?.length) lines.push(`TAGS/GENRE: ${ev.tags.join(', ')}`)
  if (ev.suggested_price) lines.push(`SUGGESTED COVER: $${ev.suggested_price}`)
  if (lineupLines) lines.push(`LINEUP:\n${lineupLines}`)

  return lines.join('\n')
}

// ── Process each event ─────────────────────────────────────────────────────────
let successCount = 0
let failCount = 0

for (const ev of events) {
  process.stdout.write(`\n⏳ ${ev.title} (${new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })})... `)

  try {
    const textPart = { text: buildTextPrompt(ev) }
    const parts = [textPart]

    // Try to load flyer image
    const imageUrl = ev.banner_url ?? ev.image_url ?? ev.square_image_url
    if (imageUrl && GEMINI_KEY) {
      const img = await fetchImageBase64(imageUrl)
      if (img) {
        // Insert image BEFORE the text prompt
        parts.unshift({
          inlineData: { mimeType: img.mimeType, data: img.b64 }
        })
        // Add instruction to use image
        parts.push({ text: '\n\nThe image above is the event flyer. Use any additional artist names, subtext, or context you can read from it to improve the description. If the flyer is unreadable or irrelevant, just use the structured data above.' })
        process.stdout.write('🖼 ')
      } else {
        process.stdout.write('📄 ')
      }
    } else {
      process.stdout.write('📄 ')
    }

    const description = await callGemini(parts)
    if (!description) throw new Error('Empty response from Gemini')

    // Write to DB
    await sql`
      UPDATE events
      SET description = ${description}
      WHERE id = ${ev.id}
    `

    console.log('✅')
    console.log(`   → ${description.slice(0, 120).replace(/\n/g, ' ')}...`)
    successCount++

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500))
  } catch (err) {
    console.log(`❌ ERROR: ${err.message}`)
    failCount++
  }
}

console.log(`\n${'='.repeat(50)}`)
console.log(`✅ ${successCount} descriptions written`)
if (failCount) console.log(`❌ ${failCount} failed`)
console.log(`\nDeploy to Vercel and submit updated event URLs in GSC to re-index.\n`)
