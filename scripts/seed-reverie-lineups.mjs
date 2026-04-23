import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { neon } from '@neondatabase/serverless'

loadEnvConfig(process.cwd())
const sql = neon(process.env.DATABASE_URL)

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// New DJs to create (no photos yet)
const NEW_DJS = [
  'Shortstack', 'Yourmom', 'Nick Bertossi', 'Poof',
  'Duncfoo', 'Tek Jones', 'Kadeejah Streets',
]

console.log('Creating new DJ profiles...')
for (const name of NEW_DJS) {
  const slug = toSlug(name)
  const rows = await sql`
    insert into djs (slug, name, is_published)
    values (${slug}, ${name}, true)
    on conflict (slug) do nothing
    returning slug, name
  `
  if (rows[0]) console.log(`  Created: ${rows[0].name} → /djs/${rows[0].slug}`)
  else console.log(`  Already exists: /djs/${slug}`)
}

// Fetch event IDs
const events = await sql`
  select id, slug, title from events
  where slug in (
    'reverie-society-our-house-takeover-2026',
    'reverie-society-taurus-party-2026'
  )
`
const eventMap = {}
for (const e of events) eventMap[e.slug] = e

// Fetch all DJ IDs by slug
const allDJs = await sql`select id, slug, name from djs`
const djBySlug = {}
for (const d of allDJs) djBySlug[d.slug] = d

// Apr 26 — Our House Takeover
const apr26 = eventMap['reverie-society-our-house-takeover-2026']
const apr26Lineup = [
  { name: 'Shortstack',    slug: 'shortstack',    sort_order: 0 },
  { name: 'Yourmom',       slug: 'yourmom',       sort_order: 1 },
  { name: 'Nick Bertossi', slug: 'nick-bertossi', sort_order: 2 },
  { name: 'Poof',          slug: 'poof',          sort_order: 3 },
]

// May 3 — Taurus Party
const may3 = eventMap['reverie-society-taurus-party-2026']
const may3Lineup = [
  { name: 'Recess',          slug: 'dj-recess',       sort_order: 0 },
  { name: 'Duncfoo',         slug: 'duncfoo',          sort_order: 1 },
  { name: 'Tek Jones',       slug: 'tek-jones',        sort_order: 2 },
  { name: 'Kadeejah Streets', slug: 'kadeejah-streets', sort_order: 3 },
]

async function insertLineup(event, lineup) {
  if (!event) { console.log('Event not found, skipping'); return }
  console.log(`\nAdding lineup for: ${event.title}`)

  // Clear existing lineup first
  await sql`delete from lineup where event_id = ${event.id}`

  for (const artist of lineup) {
    const dj = djBySlug[artist.slug]
    await sql`
      insert into lineup (event_id, name, dj_id, sort_order)
      values (${event.id}, ${artist.name}, ${dj?.id ?? null}, ${artist.sort_order})
    `
    console.log(`  ${artist.sort_order === 0 ? '[headliner]' : '          '} ${artist.name}${dj ? ` → /djs/${dj.slug}` : ' (no profile)'}`)
  }
}

await insertLineup(apr26, apr26Lineup)
await insertLineup(may3, may3Lineup)

console.log('\nDone.')
