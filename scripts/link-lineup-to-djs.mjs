/**
 * Fuzzy-match unlinked lineup entries to DJ profiles.
 * Outputs a JSON report of proposed matches for review.
 * Run: node scripts/link-lineup-to-djs.mjs [--apply]
 *
 * Without --apply: dry run, outputs report only.
 * With --apply:    writes approved matches to DB.
 */

import { readFileSync, writeFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

// Load env manually (dotenv not globally available)
const envPath = new URL('../.env.local', import.meta.url).pathname
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')] })
)
const sql = neon(envVars.DATABASE_URL)
const APPLY = process.argv.includes('--apply')

// ── Fuzzy match helpers ──────────────────────────────────────────────────────

function normalize(s) {
  return s.toLowerCase()
    .replace(/^dj\s+/i, '')        // strip leading "DJ "
    .replace(/[^a-z0-9]/g, '')     // strip non-alphanumeric
    .trim()
}

function similarity(a, b) {
  a = normalize(a); b = normalize(b)
  if (!a || !b) return 0
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) return 0.85
  // Levenshtein-based ratio
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  const dist = levenshtein(longer, shorter)
  return (longer.length - dist) / longer.length
}

function levenshtein(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = i
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? dp[j - 1] : Math.min(dp[j - 1], dp[j], prev) + 1
      dp[j - 1] = prev
      prev = val
    }
    dp[b.length] = prev
  }
  return dp[b.length]
}

function bestMatch(lineupName, profiles) {
  let best = null, bestScore = 0
  for (const dj of profiles) {
    const names = [dj.name, ...(dj.aliases || [])]
    for (const candidate of names) {
      const score = similarity(lineupName, candidate)
      if (score > bestScore) {
        bestScore = score
        best = dj
      }
    }
  }
  return { dj: best, score: bestScore }
}

// ── Main ─────────────────────────────────────────────────────────────────────

const [lineupRows, djRows] = await Promise.all([
  sql`
    SELECT l.id, l.name, l.event_id, e.title as event_title
    FROM lineup l
    JOIN events e ON e.id = l.event_id
    WHERE l.dj_id IS NULL AND l.name IS NOT NULL AND l.name != ''
    ORDER BY l.name
  `,
  sql`
    SELECT id, slug, name, aliases, instagram_url, soundcloud_url
    FROM djs
    WHERE is_published = true
    ORDER BY name
  `
])

console.log(`Unlinked lineup entries: ${lineupRows.length}`)
console.log(`DJ profiles in DB:       ${djRows.length}`)

const HIGH = 0.8    // auto-approve threshold
const MED  = 0.5    // review threshold
const LOW  = 0.3    // probably wrong, skip

const report = { high: [], review: [], no_match: [] }

for (const entry of lineupRows) {
  const { dj, score } = bestMatch(entry.name, djRows)
  const result = {
    lineup_id: entry.id,
    lineup_name: entry.name,
    event: entry.event_title,
    matched_name: dj?.name ?? null,
    matched_id: dj?.id ?? null,
    matched_slug: dj?.slug ?? null,
    score: Math.round(score * 100) / 100,
  }
  if (score >= HIGH) report.high.push(result)
  else if (score >= MED) report.review.push(result)
  else report.no_match.push(result)
}

console.log(`\nHigh confidence (>=80%):  ${report.high.length}`)
console.log(`Needs review (50-79%):    ${report.review.length}`)
console.log(`No match (<50%):          ${report.no_match.length}`)

// Write report
const outPath = new URL('../scripts/lineup-link-report.json', import.meta.url).pathname
writeFileSync(outPath, JSON.stringify(report, null, 2))
console.log(`\nReport written to scripts/lineup-link-report.json`)

// Print review items
if (report.review.length) {
  console.log('\n── Needs Review ──')
  for (const r of report.review) {
    console.log(`  [${(r.score * 100).toFixed(0)}%] "${r.lineup_name}" -> "${r.matched_name}" (${r.event})`)
  }
}

if (report.no_match.length) {
  console.log('\n── No Match ──')
  for (const r of report.no_match) {
    console.log(`  "${r.lineup_name}" (${r.event})`)
  }
}

// Apply high-confidence matches
if (APPLY) {
  console.log(`\nApplying ${report.high.length} high-confidence matches...`)
  for (const r of report.high) {
    await sql`UPDATE lineup SET dj_id = ${r.matched_id} WHERE id = ${r.lineup_id}`
    console.log(`  Linked "${r.lineup_name}" -> ${r.matched_slug}`)
  }
  console.log('Done.')
} else {
  console.log('\nDry run. Pass --apply to write matches to DB.')
}
