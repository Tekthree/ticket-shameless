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
    .map(l => l.split('=').map((v, i) => i === 0 ? v : v.replace(/^"|"$/g, '')))
    .filter(([k]) => k)
)

const sql = neon(env.DATABASE_URL)

// ── MIGRATIONS ──────────────────────────────────────────────────────────────

await sql`ALTER TABLE lineup ADD COLUMN IF NOT EXISTS stage text DEFAULT 'main'`
console.log('✓ lineup.stage column')

await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_tiers jsonb`
console.log('✓ events.ticket_tiers column')

// ── EVENTS ──────────────────────────────────────────────────────────────────

const events = [
  {
    slug: 'deck-d-out-2025',
    title: "Deck'd Out",
    description: "Seattle's favorite underground house and techno party returns for summer. Two rooms of music, good people, dark room. Kremwerk opens both floors — main room and the basement.",
    date: '2025-06-07T22:00:00',
    end_date: '2025-06-08T04:00:00',
    venue: 'Kremwerk',
    address: '1809 Minor Ave, Seattle, WA 98101',
    image_url: null,
    tags: ['House', 'Techno', 'All Ages'],
    payment_link: 'https://venmo.com/shamelessproductions',
    suggested_price: 15,
    is_public: true,
    is_published: true,
    ticket_tiers: JSON.stringify([
      { key: 'ga', label: 'General Admission', price: 15, sub: "Pay what you can. No surprises.", badge: 'On Sale' },
      { key: 'vip', label: 'Early Entry + Back Room', price: 25, sub: 'Limited availability', badge: 'Limited' }
    ]),
  },
  {
    slug: 'electric-soul-2025',
    title: 'Electric Soul',
    description: 'Deep house and minimal techno in the basement. A night for the heads.',
    date: '2025-05-09T22:00:00',
    end_date: '2025-05-10T03:00:00',
    venue: 'Kremwerk',
    address: '1809 Minor Ave, Seattle, WA 98101',
    image_url: null,
    tags: ['House', 'Techno'],
    payment_link: 'https://venmo.com/shamelessproductions',
    suggested_price: 15,
    is_public: true,
    is_published: true,
    ticket_tiers: JSON.stringify([
      { key: 'ga', label: 'General Admission', price: 15, sub: "Pay what you can. No surprises.", badge: 'On Sale' }
    ]),
  },
  {
    slug: 'auden-miky-montenegro-2025',
    title: 'Auden × Miky Montenegro',
    description: 'Back-to-back night with two Pacific Northwest selectors bringing deep, soulful house to the Monkey Loft rooftop.',
    date: '2025-05-17T14:00:00',
    end_date: '2025-05-17T22:00:00',
    venue: 'Monkey Loft',
    address: '2915 1st Ave S, Seattle, WA 98134',
    image_url: null,
    tags: ['House', 'Deep House'],
    payment_link: 'https://venmo.com/shamelessproductions',
    suggested_price: 20,
    is_public: true,
    is_published: true,
    ticket_tiers: JSON.stringify([
      { key: 'ga', label: 'General Admission', price: 20, sub: "Pay what you can. No surprises.", badge: 'On Sale' }
    ]),
  },
]

const insertedEvents = {}

for (const event of events) {
  const [row] = await sql`
    insert into events (slug, title, description, date, end_date, venue, address, image_url, tags, payment_link, suggested_price, is_public, is_published, ticket_tiers)
    values (${event.slug}, ${event.title}, ${event.description}, ${event.date}, ${event.end_date}, ${event.venue}, ${event.address}, ${event.image_url}, ${event.tags}, ${event.payment_link}, ${event.suggested_price}, ${event.is_public}, ${event.is_published}, ${event.ticket_tiers}::jsonb)
    on conflict (slug) do update set
      title = excluded.title,
      description = excluded.description,
      date = excluded.date,
      end_date = excluded.end_date,
      venue = excluded.venue,
      address = excluded.address,
      tags = excluded.tags,
      payment_link = excluded.payment_link,
      suggested_price = excluded.suggested_price,
      is_published = excluded.is_published,
      ticket_tiers = excluded.ticket_tiers
    returning id, slug
  `
  insertedEvents[row.slug] = row.id
  console.log(`✓ event: ${row.slug} (${row.id})`)
}

// ── LINEUP ──────────────────────────────────────────────────────────────────

// Clear existing lineup for deck-d-out so we can re-seed with stages
await sql`delete from lineup where event_id = ${insertedEvents['deck-d-out-2025']}`

const deckDOutLineup = [
  // Main Room
  { name: 'DJ Recess', bio: 'Resident selector and founder of Shameless Productions.', time_slot: '12:00 AM – 2:00 AM', sort_order: 0, stage: 'main', headliner: true },
  { name: 'Mija', bio: 'Phoenix-bred, LA-based DJ and producer known for high-energy sets.', time_slot: '10:00 PM – 12:00 AM', sort_order: 1, stage: 'main', headliner: true },
  { name: 'Brennen Grey', bio: 'Seattle local bringing deep techno and hypnotic grooves.', time_slot: '8:00 PM – 10:00 PM', sort_order: 2, stage: 'main', headliner: false },
  { name: 'Tony H', bio: 'Veteran selector with roots in Detroit and Chicago.', time_slot: '6:00 PM – 8:00 PM', sort_order: 3, stage: 'main', headliner: false },
  // Back Room
  { name: 'Sloane Motion', bio: 'Deep and minimal — back room staple.', time_slot: '11:00 PM – 1:00 AM', sort_order: 4, stage: 'back', headliner: false },
  { name: 'Julie Herrera', bio: 'Afro house and percussive rhythms from Seattle.', time_slot: '9:00 PM – 11:00 PM', sort_order: 5, stage: 'back', headliner: false },
  { name: 'Cheeks', bio: 'Eclectic selector — expect the unexpected.', time_slot: '7:00 PM – 9:00 PM', sort_order: 6, stage: 'back', headliner: false },
]

for (const artist of deckDOutLineup) {
  await sql`
    insert into lineup (event_id, name, bio, time_slot, sort_order, stage)
    values (${insertedEvents['deck-d-out-2025']}, ${artist.name}, ${artist.bio}, ${artist.time_slot}, ${artist.sort_order}, ${artist.stage})
    on conflict do nothing
  `
  console.log(`  ✓ ${artist.stage}/${artist.name}`)
}

// Electric Soul lineup
await sql`delete from lineup where event_id = ${insertedEvents['electric-soul-2025']}`
for (const artist of [
  { name: 'Brennen Grey', bio: 'Techno, minimal, hypnotic.', time_slot: '11:00 PM – 1:00 AM', sort_order: 0, stage: 'main' },
  { name: 'Cheeks', bio: 'Eclectic selector.', time_slot: '9:00 PM – 11:00 PM', sort_order: 1, stage: 'main' },
]) {
  await sql`
    insert into lineup (event_id, name, bio, time_slot, sort_order, stage)
    values (${insertedEvents['electric-soul-2025']}, ${artist.name}, ${artist.bio}, ${artist.time_slot}, ${artist.sort_order}, ${artist.stage})
    on conflict do nothing
  `
  console.log(`  ✓ electric-soul/${artist.name}`)
}

// Auden × Miky lineup
await sql`delete from lineup where event_id = ${insertedEvents['auden-miky-montenegro-2025']}`
for (const artist of [
  { name: 'Auden', bio: 'Deep house and soulful grooves from the PNW.', time_slot: '6:00 PM – 10:00 PM', sort_order: 0, stage: 'main' },
  { name: 'Miky Montenegro', bio: 'Organic house and Latin rhythms.', time_slot: '2:00 PM – 6:00 PM', sort_order: 1, stage: 'main' },
]) {
  await sql`
    insert into lineup (event_id, name, bio, time_slot, sort_order, stage)
    values (${insertedEvents['auden-miky-montenegro-2025']}, ${artist.name}, ${artist.bio}, ${artist.time_slot}, ${artist.sort_order}, ${artist.stage})
    on conflict do nothing
  `
  console.log(`  ✓ auden-miky/${artist.name}`)
}

console.log('\nDone.')
