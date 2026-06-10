/**
 * Validate that Instagram handles match DJ names.
 * Flags low-confidence matches for manual review.
 */
import { readFileSync, writeFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const envPath = new URL('../.env.local', import.meta.url).pathname
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')] })
)
const sql = neon(envVars.DATABASE_URL)

function normalize(s) {
  return s.toLowerCase().replace(/^dj\s+/i, '').replace(/[^a-z0-9]/g, '')
}

function levenshtein(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = i
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? dp[j - 1] : Math.min(dp[j - 1], dp[j], prev) + 1
      dp[j - 1] = prev; prev = val
    }
    dp[b.length] = prev
  }
  return dp[b.length]
}

function matchScore(name, handle) {
  const n = normalize(name)
  const h = normalize(handle)
  if (!h || !n) return 0
  if (n === h) return 1
  if (h.includes(n) || n.includes(h)) return 0.85
  const longer = n.length > h.length ? n : h
  const shorter = n.length > h.length ? h : n
  const dist = levenshtein(longer, shorter)
  return (longer.length - dist) / longer.length
}

const rows = await sql`
  SELECT name, slug, instagram_url, soundcloud_url, profile_image_url IS NOT NULL as has_img
  FROM djs
  WHERE is_published = true
    AND instagram_url ILIKE '%instagram.com%'
  ORDER BY name
`

const flagged = []
const ok = []

for (const r of rows) {
  const handle = r.instagram_url.replace(/\/$/, '').split('/').pop()
  const s = matchScore(r.name, handle)
  const entry = { name: r.name, slug: r.slug, handle, score: Math.round(s * 100), has_img: r.has_img }
  if (s < 0.35) flagged.push(entry)
  else ok.push(entry)
}

flagged.sort((a, b) => a.score - b.score)

console.log(`OK:      ${ok.length}`)
console.log(`FLAGGED: ${flagged.length} (handle score < 35% — needs manual check)`)
console.log()
flagged.forEach(f =>
  console.log(`[${String(f.score).padStart(2)}%] ${f.name.padEnd(32)} -> @${f.handle}`)
)

writeFileSync(
  new URL('../scripts/dj-link-validation.json', import.meta.url).pathname,
  JSON.stringify({ ok: ok.length, flagged }, null, 2)
)
console.log('\nFull report: scripts/dj-link-validation.json')
