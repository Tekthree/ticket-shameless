import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

export const sql = neon(process.env.DATABASE_URL)

// ── EVENTS ──────────────────────────────────────────────────────────────────

export type Event = {
  id: string
  slug: string
  title: string
  description: string | null
  date: string
  end_date: string | null
  venue: string | null
  address: string | null
  image_url: string | null
  tags: string[]
  payment_link: string | null
  suggested_price: number | null
  is_public: boolean
  is_published: boolean
  created_at: string
}

export type LineupArtist = {
  id: string
  event_id: string
  name: string
  bio: string | null
  image_url: string | null
  mix_url: string | null
  time_slot: string | null
  sort_order: number
}

export async function getEvents(limit = 10): Promise<Event[]> {
  const rows = await sql`
    select * from events
    where is_published = true
    order by date asc
    limit ${limit}
  `
  return rows as Event[]
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const rows = await sql`
    select * from events where slug = ${slug} and is_published = true limit 1
  `
  return (rows[0] as Event) ?? null
}

export async function getEventLineup(eventId: string): Promise<LineupArtist[]> {
  const rows = await sql`
    select * from lineup where event_id = ${eventId} order by sort_order asc
  `
  return rows as LineupArtist[]
}

// ── RSVPs ────────────────────────────────────────────────────────────────────

export type Rsvp = {
  id: string
  event_id: string
  name: string
  email: string | null
  phone: string | null
  status: 'going' | 'maybe' | 'not_going'
  note: string | null
  created_at: string
}

export async function createRsvp(data: {
  event_id: string
  name: string
  email?: string
  phone?: string
  status?: 'going' | 'maybe' | 'not_going'
  note?: string
}): Promise<Rsvp> {
  const rows = await sql`
    insert into rsvps (event_id, name, email, phone, status, note)
    values (${data.event_id}, ${data.name}, ${data.email ?? null}, ${data.phone ?? null}, ${data.status ?? 'going'}, ${data.note ?? null})
    on conflict (event_id, email) do update
      set name = excluded.name, status = excluded.status, note = excluded.note
    returning *
  `
  return rows[0] as Rsvp
}

export async function getRsvpsForEvent(eventId: string): Promise<Rsvp[]> {
  const rows = await sql`
    select * from rsvps where event_id = ${eventId} order by created_at asc
  `
  return rows as Rsvp[]
}

// ── PRODUCTS ─────────────────────────────────────────────────────────────────

export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  sizes: string[] | null
  stock: number
  is_published: boolean
  stripe_price_id: string | null
  created_at: string
}

export async function getProducts(): Promise<Product[]> {
  const rows = await sql`
    select * from products where is_published = true order by created_at desc
  `
  return rows as Product[]
}

// ── SUBSCRIBERS ───────────────────────────────────────────────────────────────

export async function addSubscriber(email: string, name?: string): Promise<void> {
  await sql`
    insert into subscribers (email, name)
    values (${email}, ${name ?? null})
    on conflict (email) do nothing
  `
}
