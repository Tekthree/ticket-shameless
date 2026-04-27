import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] })
    .filter(([k]) => k)
)

const sql = neon(env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } })

// ── Schema patch ─────────────────────────────────────────────────────────────
await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS facebook_url TEXT`
await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS banner_url TEXT`
console.log('✓ schema patched')

// ── Load existing DJ profiles for matching ───────────────────────────────────
const existingDJs = await sql`SELECT id, name FROM djs`

function normName(n) {
  return n.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Build map: normalizedName → id
const djMap = new Map()
for (const dj of existingDJs) {
  djMap.set(normName(dj.name), dj.id)
}

function findDJId(rawName) {
  // Strip parentheticals for matching only (e.g. "(LA)", "(Dirtybird, SF)")
  const stripped = rawName.replace(/\s*\([^)]*\)/g, '').trim()
  const norm = normName(stripped)
  if (!norm) return null
  // Exact match
  if (djMap.has(norm)) return djMap.get(norm)
  // Partial: "recess" inside "djrecess", or "djrecess" inside input
  for (const [key, id] of djMap) {
    if (key.includes(norm) || norm.includes(key)) return id
  }
  return null
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeSlug(title, dateStr) {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const base = title.toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 50)
    .replace(/-$/, '')
  return `${base}-${y}-${m}-${day}`
}

function parseDate(str) {
  // "Sun, Apr 19, 2026" → "2026-04-19T20:00:00" (8pm default for events)
  const d = new Date(str)
  if (isNaN(d)) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}T20:00:00`
}

// Split "A (label, city), B (Stage), C" respecting parens
function splitDJs(str) {
  const parts = []
  let depth = 0
  let current = ''
  for (const ch of str) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

// Extract stage from trailing paren, clean name
function parseDJEntry(entry) {
  const stageMatch = entry.match(/\s*\(([^)]*)\)\s*$/)
  let name = entry.trim()
  let stage = null

  if (stageMatch) {
    const paren = stageMatch[1].toLowerCase()
    if (paren.includes('rooftop')) {
      stage = 'rooftop'
      name = name.slice(0, stageMatch.index).trim()
    } else if (paren.includes('loft')) {
      stage = 'loft'
      name = name.slice(0, stageMatch.index).trim()
    } else if (paren.includes('main stage') || paren === 'main') {
      stage = 'main'
      name = name.slice(0, stageMatch.index).trim()
    }
    // Otherwise the paren is label/location info — keep in name
  }

  return { name, stage }
}

// ── Seed ─────────────────────────────────────────────────────────────────────
const rows = JSON.parse(readFileSync(join(__dirname, 'historical-events.json'), 'utf8'))
const header = rows[0]
const data = rows.slice(1)

let eventsInserted = 0
let eventsSkipped = 0
let lineupInserted = 0
let djsLinked = 0

for (const row of data) {
  const title    = (row[2] || '').trim()
  const dateStr  = (row[1] || '').trim()
  const venue    = (row[3] || '').trim().replace(/, Seattle$/, '')
  const fbUrl    = (row[5] || '').trim()
  const djsRaw   = (row[6] || '').trim()
  const bannerUrl = (row[7] || '').trim()
  const description = (row[9] || '').trim()

  if (!title || !dateStr) continue

  const date = parseDate(dateStr)
  if (!date) { console.log(`  ⚠ bad date: ${dateStr} — ${title}`); continue }

  const slug = makeSlug(title, dateStr)

  // Insert event — skip if slug already exists
  const [inserted] = await sql`
    INSERT INTO events (slug, title, description, date, venue, image_url, banner_url, facebook_url, is_public, is_published)
    VALUES (
      ${slug}, ${title}, ${description || null}, ${date},
      ${venue || null}, ${bannerUrl || null}, ${bannerUrl || null}, ${fbUrl || null},
      true, true
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id
  `

  if (!inserted) {
    eventsSkipped++
    continue
  }

  eventsInserted++
  const eventId = inserted.id

  // Parse and insert lineup
  if (!djsRaw) continue

  const djEntries = splitDJs(djsRaw)
  for (let i = 0; i < djEntries.length; i++) {
    const { name, stage } = parseDJEntry(djEntries[i])
    if (!name) continue

    const djId = findDJId(name)
    if (djId) djsLinked++

    await sql`
      INSERT INTO lineup (event_id, name, sort_order, stage, dj_id)
      VALUES (${eventId}, ${name}, ${i}, ${stage}, ${djId})
    `
    lineupInserted++
  }
}

console.log(`\n✓ Events inserted: ${eventsInserted}`)
console.log(`  Events skipped (already exist): ${eventsSkipped}`)
console.log(`✓ Lineup entries inserted: ${lineupInserted}`)
console.log(`  DJ profiles linked: ${djsLinked}`)
console.log('\nDone.')
