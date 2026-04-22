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

// Remove old placeholder events
await sql`delete from lineup where event_id in (
  select id from events where slug in ('electric-soul-2025','auden-miky-montenegro-2025','deck-d-out-2025')
)`
await sql`delete from events where slug in ('electric-soul-2025','auden-miky-montenegro-2025','deck-d-out-2025')`
console.log('✓ cleared old placeholder events')

const events = [
  {
    slug: 'reverie-society-our-house-takeover-2026',
    title: 'Reverie Society: Our House Takeover',
    description: 'A Sunday day party from Viva, Uniting Souls and Shameless. Come through for an afternoon of deep, soulful house music on the Monkey Loft rooftop.',
    date: '2026-04-26T15:00:00',
    end_date: '2026-04-26T20:00:00',
    venue: 'Monkey Loft',
    address: '2915 1st Avenue South, Seattle, WA 98134',
    image_url: null,
    tags: ['House', 'Deep House', 'Day Party'],
    payment_link: 'https://www.eventbrite.com/e/reverie-society-our-houe-takeover-april-26-2026-tickets-1986002440762',
    suggested_price: 15,
    is_public: true,
    is_published: true,
    ticket_tiers: JSON.stringify([
      { key: 'ga', label: 'General Admission', price: 14.87, sub: 'The price you\'ll pay. No surprises.', badge: 'On Sale' },
      { key: 'vip', label: 'VIP', price: 18.07, sub: 'Limited availability', badge: 'Limited' },
    ]),
  },
  {
    slug: 'reverie-society-taurus-party-2026',
    title: 'Reverie Society: Taurus Party!',
    description: "A Sunday day party from Shameless, Viva, and Uniting Souls. Celebrating Taurus season with deep, soulful house on the Monkey Loft rooftop.",
    date: '2026-05-03T15:00:00',
    end_date: '2026-05-03T20:00:00',
    venue: 'Monkey Loft',
    address: '2915 1st Avenue South, Seattle, WA 98134',
    image_url: null,
    tags: ['House', 'Deep House', 'Day Party'],
    payment_link: 'https://www.eventbrite.com/e/reverie-society-taurus-party-may-3-2026-tickets-1987480850726',
    suggested_price: 15,
    is_public: true,
    is_published: true,
    ticket_tiers: JSON.stringify([
      { key: 'ga', label: 'General Admission', price: 14.87, sub: 'The price you\'ll pay. No surprises.', badge: 'On Sale' },
      { key: 'vip', label: 'VIP', price: 18.07, sub: 'Limited availability', badge: 'Limited' },
    ]),
  },
  {
    slug: 'reverie-society-viva-la-soul-2026',
    title: 'Reverie Society: Viva la Soul w/ Rick Preston',
    description: 'Viva La Soul / Vegas Decompression. A Sunday day party from Shameless, Viva, and Uniting Souls featuring Rick Preston, Mr. Linden, Hector J Rodriguez, and Kadeem Taves. 21+ · 3PM–8PM.',
    date: '2026-05-10T15:00:00',
    end_date: '2026-05-10T20:00:00',
    venue: 'Monkey Loft',
    address: '2915 1st Avenue South, Seattle, WA 98134',
    image_url: null,
    tags: ['House', 'Deep House', 'Day Party', '21+'],
    payment_link: 'https://www.eventbrite.com/e/reverie-society-viva-la-soul-w-rick-preston-may-10-2026-tickets-1987532981651',
    suggested_price: 18,
    is_public: true,
    is_published: true,
    ticket_tiers: JSON.stringify([
      { key: 'ga', label: 'General Admission', price: 18.07, sub: 'The price you\'ll pay. No surprises.', badge: 'On Sale' },
      { key: 'vip', label: 'VIP', price: 23.38, sub: 'Limited availability', badge: 'Limited' },
    ]),
  },
  {
    slug: 'memorial-day-hijinks-desert-hearts-2026',
    title: 'Memorial Day Hijinks',
    description: 'Desert Hearts annual open air rooftop takeover with Mikey Lion, Lee Reynolds, Marbs & Tony H. Plus Shameless friends in the Loft. Two rooms, all day.',
    date: '2026-05-25T14:00:00',
    end_date: '2026-05-25T22:00:00',
    venue: 'Monkey Loft',
    address: '2915 1st Avenue South, Seattle, WA 98134',
    image_url: null,
    tags: ['House', 'Techno', 'Deep House', 'All Ages'],
    payment_link: 'https://www.eventbrite.com/e/memorial-day-hijinks-with-desert-hearts-tickets-1984486631937',
    suggested_price: 45,
    is_public: true,
    is_published: true,
    ticket_tiers: JSON.stringify([
      { key: 'ga', label: 'General Admission', price: 44.52, sub: 'The price you\'ll pay. No surprises.', badge: 'On Sale' },
    ]),
  },
]

const insertedIds = {}

for (const event of events) {
  const [row] = await sql`
    insert into events (slug, title, description, date, end_date, venue, address, image_url, tags, payment_link, suggested_price, is_public, is_published, ticket_tiers)
    values (${event.slug}, ${event.title}, ${event.description}, ${event.date}, ${event.end_date}, ${event.venue}, ${event.address}, ${event.image_url}, ${event.tags}, ${event.payment_link}, ${event.suggested_price}, ${event.is_public}, ${event.is_published}, ${event.ticket_tiers}::jsonb)
    on conflict (slug) do update set
      title = excluded.title, description = excluded.description, date = excluded.date,
      end_date = excluded.end_date, venue = excluded.venue, address = excluded.address,
      tags = excluded.tags, payment_link = excluded.payment_link,
      suggested_price = excluded.suggested_price, is_published = excluded.is_published,
      ticket_tiers = excluded.ticket_tiers
    returning id, slug
  `
  insertedIds[row.slug] = row.id
  console.log(`✓ ${row.slug}`)
}

// ── LINEUP ──────────────────────────────────────────────────────────────────

// Event 3: Viva la Soul — named artists
await sql`delete from lineup where event_id = ${insertedIds['reverie-society-viva-la-soul-2026']}`
for (const artist of [
  { name: 'Rick Preston', bio: 'Vegas-based house selector, Vegas Decompression resident.', time_slot: '6:00 PM – 8:00 PM', sort_order: 0, stage: 'main' },
  { name: 'Mr. Linden', bio: null, time_slot: '4:30 PM – 6:00 PM', sort_order: 1, stage: 'main' },
  { name: 'Hector J Rodriguez', bio: null, time_slot: '3:00 PM – 4:30 PM', sort_order: 2, stage: 'main' },
  { name: 'Kadeem Taves', bio: null, time_slot: '3:00 PM – 4:00 PM', sort_order: 3, stage: 'main' },
]) {
  await sql`
    insert into lineup (event_id, name, bio, time_slot, sort_order, stage)
    values (${insertedIds['reverie-society-viva-la-soul-2026']}, ${artist.name}, ${artist.bio}, ${artist.time_slot}, ${artist.sort_order}, ${artist.stage})
    on conflict do nothing
  `
  console.log(`  ✓ ${artist.name}`)
}

// Event 4: Memorial Day Hijinks — full Desert Hearts lineup
await sql`delete from lineup where event_id = ${insertedIds['memorial-day-hijinks-desert-hearts-2026']}`
for (const artist of [
  // Rooftop
  { name: 'Mikey Lion', bio: 'Desert Hearts co-founder.', time_slot: '7:00 PM – 10:00 PM', sort_order: 0, stage: 'rooftop' },
  { name: 'Lee Reynolds', bio: 'Desert Hearts co-founder.', time_slot: '5:30 PM – 7:00 PM', sort_order: 1, stage: 'rooftop' },
  { name: 'Marbs', bio: 'Desert Hearts resident.', time_slot: '4:00 PM – 5:30 PM', sort_order: 2, stage: 'rooftop' },
  { name: 'Tony H', bio: 'Desert Hearts resident.', time_slot: '2:00 PM – 4:00 PM', sort_order: 3, stage: 'rooftop' },
  // Loft
  { name: 'DJ Recess', bio: 'Shameless Productions founder.', time_slot: '8:00 PM – 10:00 PM', sort_order: 4, stage: 'loft' },
  { name: 'Sloane Motion', bio: 'Shameless resident.', time_slot: '6:00 PM – 8:00 PM', sort_order: 5, stage: 'loft' },
  { name: 'Julie Herrera', bio: 'Shameless resident.', time_slot: '4:00 PM – 6:00 PM', sort_order: 6, stage: 'loft' },
  { name: 'Cheeks', bio: 'Shameless resident.', time_slot: '2:00 PM – 4:00 PM', sort_order: 7, stage: 'loft' },
]) {
  await sql`
    insert into lineup (event_id, name, bio, time_slot, sort_order, stage)
    values (${insertedIds['memorial-day-hijinks-desert-hearts-2026']}, ${artist.name}, ${artist.bio}, ${artist.time_slot}, ${artist.sort_order}, ${artist.stage})
    on conflict do nothing
  `
  console.log(`  ✓ ${artist.stage}/${artist.name}`)
}

console.log('\nDone.')
