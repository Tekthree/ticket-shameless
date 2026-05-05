/**
 * Create stub profiles for every remaining unlinked lineup name.
 *
 * Strategy:
 *   1. Add alias patches for typos/variants of existing DJs
 *   2. Create stub profiles (name + slug only) for:
 *      a. Slugs referenced in alias map that have no DB profile
 *      b. Unmatched lineup names not covered by alias map
 *   3. Skip non-DJ entries (collectives, crew billings, etc.)
 *
 * Stubs are published by default — bios/images can be filled in later.
 * Safe to re-run (ON CONFLICT DO NOTHING for inserts, COALESCE for alias updates).
 *
 * Run: node scripts/seed-dj-stubs.mjs
 * Then: node scripts/link-lineup-djs.mjs
 */

import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnvConfig(join(__dirname, '..'))

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
const aliasMap = JSON.parse(readFileSync(join(__dirname, 'data/dj-alias-map.json'), 'utf8'))

function toSlug(name) {
  return name.toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── STEP 1: Alias patches for existing DJ profiles ──────────────────────────

const aliasPatch = [
  // Typos / casing variants of existing DJs
  { slug: 'moist-towelette',  add: ['Moist Towellette'] },
  { slug: 'rachel-vick',      add: ['Rachael Vick', 'roam(s) x Rachel Vick'] },
  { slug: 'mz-artiz',         add: ['MZ Artiz', 'Mz. ArTiz', 'MZ ARTIZ', 'MZ ArTiz', 'Mz ArTiz'] },
  { slug: 'aivilo',           add: ['AIVILIBIDO'] },
  { slug: 'mr-linden',        add: ['Jeremy Linden'] },
  { slug: 'hershe',           add: ['Deejay Hershe', 'Hershe'] },
  { slug: 'kadeem-taves',     add: ['Taves'] },
  { slug: 'vondewey',         add: ['Dewey', 'VonDewey'] },
  { slug: 'matt-g',           add: ['MattG', 'Matt G'] },
  { slug: 'carlos-ruiz',      add: ['Carlos R', 'Carlos Ruiz'] },
  { slug: 'orqid',            add: ['ORQID', 'Orqid'] },
  { slug: 'saand',            add: ['SAAND', 'Saand'] },
  { slug: 'ezbot',            add: ['EZBOT', 'Ezbot'] },
  { slug: 'erin-oconner',     add: ["Erin O'Conner", "Erin O'Connor"] },
  { slug: 'future-wife',      add: ['FutureWife', 'Future Wife'] },
  { slug: 'lowkeydinthe-house', add: ['LowkeyDinTheHouse', 'LowkeydintheHouse'] },
  { slug: 'acid-tourist',     add: ['Acid Tourist (4 Hour Set!, NYC)'] },
  { slug: 'jjustice',         add: ['J-Justice', 'JJustice'] },
  { slug: 'jenn-green',       add: ['JennGreen', 'Jenngreen', 'Jenn Green'] },
  { slug: 'dy3',              add: ['DY3', 'DY3 (TN)'] },
  { slug: 'james-ervin',      add: ["Jame$ Ervin", "JAME$ERVIN (Birthday Set)", "James$Ervin", "J. Ervin", "J-Sun"] },
  { slug: 'ethical-drugs',    add: ['Ethical Drugs', 'Ethicaldrugs'] },
  { slug: 'raine',            add: ['DJ Raine', 'Raine'] },
  { slug: 'la-mala-noche',    add: ['La Mala Noche', 'Sazon with La Mala Noche'] },
  { slug: 'dark-chisme',      add: ['Dark Chisme'] },
  { slug: 'luxo',             add: ['Luxo'] },
  { slug: 'dj-manos',        add: ['DJ Manos', 'Manos'] },
  { slug: 'sazon',            add: ['Sazon'] },
  { slug: 'roams',            add: ['Roams', 'roam(s) x Rachel Vick'] },
  { slug: 'hershe',           add: ['Deejay Hershe', 'Hershe'] },
  { slug: 'night-train',      add: ['Night Train'] },
  { slug: 'the-lovevirus',    add: ['The Lovevirus', 'The Love Virus'] },
  { slug: 'sone',             add: ['Sone'] },
  { slug: 'whitcher',         add: ['Whitcher', 'Shaun Whitcher'] },
]

console.log('Applying alias patches...')
for (const { slug, add } of aliasPatch) {
  const rows = await sql`
    UPDATE djs
    SET aliases = (SELECT array_agg(DISTINCT x) FROM unnest(aliases || ${add}::text[]) x)
    WHERE slug = ${slug}
    RETURNING slug, name
  `
  if (rows[0]) process.stdout.write(`  Patched: ${rows[0].name}\n`)
}

// ── STEP 2: New B2B composites to split ─────────────────────────────────────

// These are in the lineup but weren't in the alias map file (truncated at J)
const newComposites = [
  { alias: 'Pezzner & Lippert',             slugs: ['dave-pezzner'] },  // Lippert unknown
  { alias: 'Saqib B2B Pezzner (Open to Close)', slugs: ['saqib', 'dave-pezzner'] },
  { alias: 'Brian Lyons B2B Wesley Holmes', slugs: ['brian-lyons', 'wesley-holmes'] },
  { alias: 'Riz B2B Rob Green',             slugs: ['riz-rollins', 'rob-noble'] },
  { alias: 'Parker Mills B2B Veta Vitali',  slugs: ['parker-mills', 'veta-vitali'] },
  { alias: 'La Mala Noche B2B Papito Peace', slugs: ['la-mala-noche', 'papito-peace'] },
  { alias: 'Franz & Shape',                 slugs: [] },  // unknown, skip
  { alias: 'Viper & Frenz',                 slugs: ['viper-fengz'] },
  { alias: 'Open House Collective with HAÜS\\GASM', slugs: ['haus-gasm'] },
  { alias: 'Dusty Booty Ranch with Sean Wood', slugs: [] }, // unknown, skip
  { alias: 'Sazon with La Mala Noche',      slugs: ['sazon', 'la-mala-noche'] },
  { alias: 'Lee Houser feat. Jon Lee & Simon Houser', slugs: ['jon-lee'] },
]

// ── STEP 3: Entries to skip entirely (not DJs) ───────────────────────────────

const SKIP = new Set([
  'No DJs listed', 'Shameless Residents', 'Residents', 'Innerflight',
  'Dirty Ice Crew', 'Open House Collective', 'Flammable Records crew',
  'Late Night Munchies crew', 'Grounded Records crew', 'Innerflight Residents',
  'Shameless DJs', 'Bottom Forty', 'Train Car House',
  'Bad Ginger; Silent Disco with CB89.5 / MMBASSY / Shameless / Milo House',
  'Innerflight Residents', 'Jackson (Gallery - Between the Lines)',
])

// ── STEP 4: Build slug→name from alias map ───────────────────────────────────

const slugToName = new Map()
for (const e of aliasMap) {
  for (let i = 0; i < e.canonical_slugs.length; i++) {
    const slug = e.canonical_slugs[i]
    const name = e.canonical_names[i]
    if (slug && name && !slugToName.has(slug)) slugToName.set(slug, name)
  }
}

// ── STEP 5: Get current DB state ──────────────────────────────────────────────

const existing = await sql`SELECT slug FROM djs`
const inDB = new Set(existing.map(r => r.slug))

// ── STEP 6: Insert missing stubs from alias map ───────────────────────────────

console.log('\nCreating stubs from alias map...')
let stubsCreated = 0

for (const [slug, name] of slugToName) {
  if (inDB.has(slug)) continue
  await sql`
    INSERT INTO djs (slug, name, is_published) VALUES (${slug}, ${name}, true)
    ON CONFLICT (slug) DO NOTHING
  `
  console.log(`  Stub: ${name} [${slug}]`)
  stubsCreated++
  inDB.add(slug)
}

// ── STEP 7: Insert stubs for unmatched lineup names not in alias map ─────────

// Build normalized alias lookup (after patches + alias map)
const allDJs = await sql`SELECT id, slug, name, aliases FROM djs`
const nameToSlug = new Map()
for (const dj of allDJs) {
  const normalize = s => s?.toLowerCase().trim()
  nameToSlug.set(normalize(dj.name), dj.slug)
  for (const a of (dj.aliases || [])) nameToSlug.set(normalize(a), dj.slug)
}

// Build composite lookup for splitting
const compositeAlias = new Map()
for (const e of aliasMap) {
  if (e.is_composite) compositeAlias.set(e.alias.toLowerCase().trim(), e.canonical_slugs)
}
for (const e of newComposites) {
  if (e.slugs.length > 0) compositeAlias.set(e.alias.toLowerCase().trim(), e.slugs)
}

const unmatched = await sql`
  SELECT name, COUNT(*)::int as cnt FROM lineup
  WHERE dj_id IS NULL AND name IS NOT NULL AND name != ''
  GROUP BY name ORDER BY cnt DESC
`

console.log('\nCreating stubs for remaining unmatched lineup names...')
let lineupStubs = 0

for (const row of unmatched) {
  const key = row.name.toLowerCase().trim()
  if (SKIP.has(row.name)) continue
  if (compositeAlias.has(key)) continue       // will be split by linker
  if (nameToSlug.has(key)) continue           // already matched

  // Strip parentheticals like "Coflo (SF)" → "Coflo"
  const stripped = row.name.replace(/\s*\([^)]*\)\s*/g, '').trim()
  const strippedKey = stripped.toLowerCase().trim()
  if (nameToSlug.has(strippedKey)) {
    // Add as alias to existing profile
    const slug = nameToSlug.get(strippedKey)
    await sql`
      UPDATE djs
      SET aliases = (SELECT array_agg(DISTINCT x) FROM unnest(aliases || ${[row.name]}::text[]) x)
      WHERE slug = ${slug}
    `
    console.log(`  Alias added: "${row.name}" → ${slug}`)
    nameToSlug.set(key, slug)
    continue
  }

  // Create new stub
  const slug = toSlug(stripped || row.name)
  if (inDB.has(slug)) {
    // Slug exists but name doesn't match — add as alias
    await sql`
      UPDATE djs
      SET aliases = (SELECT array_agg(DISTINCT x) FROM unnest(aliases || ${[row.name]}::text[]) x)
      WHERE slug = ${slug}
    `
    nameToSlug.set(key, slug)
    continue
  }

  await sql`
    INSERT INTO djs (slug, name, is_published) VALUES (${slug}, ${stripped || row.name}, true)
    ON CONFLICT (slug) DO NOTHING
  `
  console.log(`  Lineup stub: ${stripped || row.name} [${slug}]`)
  lineupStubs++
  inDB.add(slug)
  nameToSlug.set(key, slug)
  nameToSlug.set(strippedKey, slug)
}

// ── STEP 8: Handle new composites — split lineup rows ────────────────────────

console.log('\nSplitting new B2B composite entries...')
const slugToId = new Map((await sql`SELECT id, slug FROM djs`).map(d => [d.slug, d.id]))
const nameToId = new Map((await sql`SELECT id, name, aliases FROM djs`).flatMap(d => [
  [d.name.toLowerCase().trim(), d.id],
  ...(d.aliases || []).map(a => [a.toLowerCase().trim(), d.id])
]))

let splits = 0
for (const [aliasKey, slugs] of compositeAlias) {
  const unlinkedRows = await sql`
    SELECT id, sort_order, stage, time_slot, is_headliner, event_id
    FROM lineup
    WHERE dj_id IS NULL AND LOWER(TRIM(name)) = ${aliasKey}
  `
  for (const row of unlinkedRows) {
    const ids = slugs.map(s => slugToId.get(s)).filter(Boolean)
    if (!ids.length) continue
    await sql`UPDATE lineup SET dj_id = ${ids[0]} WHERE id = ${row.id}`
    for (let i = 1; i < ids.length; i++) {
      const djName = (await sql`SELECT name FROM djs WHERE id = ${ids[i]} LIMIT 1`)[0]?.name || aliasKey
      await sql`
        INSERT INTO lineup (event_id, name, dj_id, sort_order, stage, time_slot, is_headliner)
        VALUES (${row.event_id}, ${djName}, ${ids[i]}, ${row.sort_order}, ${row.stage}, ${row.time_slot}, ${row.is_headliner})
        ON CONFLICT DO NOTHING
      `
    }
    splits++
  }
}
console.log(`  Split ${splits} composite entries`)

console.log(`\nDone.`)
console.log(`  Stubs from alias map: ${stubsCreated}`)
console.log(`  Stubs from lineup names: ${lineupStubs}`)
