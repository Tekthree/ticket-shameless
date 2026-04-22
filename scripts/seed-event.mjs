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

const event = {
  slug: 'deck-d-out-2025',
  title: "Deck'd Out",
  description: "Seattle's favorite underground house and techno party returns. Good music, good people, dark room.",
  date: '2025-06-07T22:00:00',
  end_date: '2025-06-08T04:00:00',
  venue: 'Kremwerk',
  address: '1809 Minor Ave, Seattle, WA 98101',
  image_url: null,
  tags: ['House', 'Techno'],
  payment_link: 'https://venmo.com/shamelessproductions',
  suggested_price: 15,
  is_public: true,
  is_published: true,
}

const lineup = [
  { name: 'DJ Recess', bio: 'Resident selector and founder of Shameless Productions.', time_slot: '12:00 AM - 2:00 AM', sort_order: 0 },
  { name: 'Mija', bio: 'Phoenix-bred, LA-based DJ and producer.', time_slot: '10:00 PM - 12:00 AM', sort_order: 1 },
]

const [inserted] = await sql`
  insert into events (slug, title, description, date, end_date, venue, address, image_url, tags, payment_link, suggested_price, is_public, is_published)
  values (${event.slug}, ${event.title}, ${event.description}, ${event.date}, ${event.end_date}, ${event.venue}, ${event.address}, ${event.image_url}, ${event.tags}, ${event.payment_link}, ${event.suggested_price}, ${event.is_public}, ${event.is_published})
  on conflict (slug) do update set
    title = excluded.title, description = excluded.description, date = excluded.date,
    venue = excluded.venue, address = excluded.address, tags = excluded.tags,
    payment_link = excluded.payment_link, suggested_price = excluded.suggested_price,
    is_published = excluded.is_published
  returning id, slug
`

console.log(`Event: ${inserted.slug} (${inserted.id})`)

for (const artist of lineup) {
  await sql`
    insert into lineup (event_id, name, bio, time_slot, sort_order)
    values (${inserted.id}, ${artist.name}, ${artist.bio}, ${artist.time_slot}, ${artist.sort_order})
    on conflict do nothing
  `
  console.log(`  Artist: ${artist.name}`)
}

console.log('Done.')
