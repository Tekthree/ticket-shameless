import { neon, neonConfig } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder'

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set, using placeholder for build')
}

// Prevent Next.js from caching Neon's internal HTTP responses
neonConfig.fetchOptions = { cache: 'no-store' }

export const sql = neon(DATABASE_URL)

// ── EVENTS ──────────────────────────────────────────────────────────────────

export type TicketTier = {
  key: string
  label: string
  price: number
  sub: string
  badge: string
}

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
  ticket_tiers: TicketTier[] | null
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
  stage: string | null
  dj_id: string | null
  dj_slug: string | null
  dj_profile_image_url: string | null
  is_headliner: boolean
}

// ── DJS ──────────────────────────────────────────────────────────────────────

export type DJ = {
  id: string
  slug: string
  name: string
  bio: string | null
  profile_image_url: string | null
  banner_image_url: string | null
  location: string | null
  genres: string[]
  soundcloud_url: string | null
  instagram_url: string | null
  spotify_url: string | null
  youtube_url: string | null
  mixcloud_url: string | null
  website_url: string | null
  seo_description: string | null
  is_published: boolean
  created_at: string
}

export async function getEvents(limit = 10): Promise<Event[]> {
  try {
    // Fresh connection per call — prevents Neon's HTTP client from caching responses
    const freshSql = neon(DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
    const rows = await freshSql`
      select * from events
      where is_published = true
      order by date asc
      limit ${limit}
    `
    return rows as Event[]
  } catch (error) {
    console.warn('Failed to fetch events:', error)
    return []
  }
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const rows = await sql`
    select * from events where slug = ${slug} and is_published = true limit 1
  `
  return (rows[0] as Event) ?? null
}

export async function getEventLineup(eventId: string): Promise<LineupArtist[]> {
  const db = neon(DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
  const rows = await db`
    select l.*, d.slug as dj_slug, d.profile_image_url as dj_profile_image_url
    from lineup l
    left join djs d on d.id = l.dj_id
    where l.event_id = ${eventId}
    order by l.sort_order asc
  `
  return rows as LineupArtist[]
}

export async function getDJs(): Promise<DJ[]> {
  const db = neon(DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
  const rows = await db`
    select * from djs where is_published = true order by name asc
  `
  return rows as DJ[]
}

export async function getDJBySlug(slug: string): Promise<DJ | null> {
  const db = neon(DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
  const rows = await db`
    select * from djs where slug = ${slug} and is_published = true limit 1
  `
  return (rows[0] as DJ) ?? null
}

export async function getDJEvents(djId: string): Promise<Event[]> {
  const db = neon(DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
  const rows = await db`
    select distinct e.*
    from events e
    join lineup l on l.event_id = e.id
    where l.dj_id = ${djId} and e.is_published = true
    order by e.date desc
  `
  return rows as Event[]
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    const rows = await sql`
      select * from events where id = ${id} limit 1
    `
    return (rows[0] as Event) ?? null
  } catch (error) {
    console.warn('Failed to fetch event by ID during build:', error)
    return null // Return null during build
  }
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<Event | null> {
  try {
    // For now, handle basic updates - this can be expanded as needed
    const updateFields = []
    const updateValues = []
    
    if (data.title !== undefined) {
      updateFields.push('title = ?')
      updateValues.push(data.title)
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(data.description)
    }
    if (data.date !== undefined) {
      updateFields.push('date = ?')
      updateValues.push(data.date)
    }
    if (data.venue !== undefined) {
      updateFields.push('venue = ?')
      updateValues.push(data.venue)
    }
    if (data.address !== undefined) {
      updateFields.push('address = ?')
      updateValues.push(data.address)
    }
    if (data.image_url !== undefined) {
      updateFields.push('image_url = ?')
      updateValues.push(data.image_url)
    }
    
    if (updateFields.length === 0) {
      return await getEventById(id) // No updates needed
    }
    
    const query = `update events set ${updateFields.join(', ')} where id = ? returning *`
    updateValues.push(id)
    
    const rows = await sql(query, ...updateValues)
    return (rows[0] as Event) ?? null
  } catch (error) {
    console.warn('Failed to update event during build:', error)
    return null // Return null during build
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    const rows = await sql`
      delete from events where id = ${id}
    `
    return true // Neon doesn't return affected rows count in the same way
  } catch (error) {
    console.warn('Failed to delete event during build:', error)
    return false // Return false during build
  }
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
  attendee_count: number
  created_at: string
}

export async function createRsvp(data: {
  event_id: string
  name: string
  email?: string
  phone?: string
  status?: 'going' | 'maybe' | 'not_going'
  note?: string
  attendee_count?: number
}): Promise<Rsvp> {
  const rows = await sql`
    insert into rsvps (event_id, name, email, phone, status, note, attendee_count)
    values (${data.event_id}, ${data.name}, ${data.email ?? null}, ${data.phone ?? null}, ${data.status ?? 'going'}, ${data.note ?? null}, ${data.attendee_count ?? 1})
    returning *
  `
  return rows[0] as Rsvp
}

export async function getRsvpCounts(eventId: string): Promise<{ going: number; maybe: number; not_going: number }> {
  const db = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } })
  const rows = await db`
    select status, count(*)::int as count from rsvps where event_id = ${eventId} group by status
  `
  const result = { going: 0, maybe: 0, not_going: 0 }
  for (const r of rows) result[r.status as keyof typeof result] = r.count
  return result
}

export type Comment = {
  id: string
  event_id: string
  name: string
  message: string
  created_at: string
}

export async function createComment(data: { event_id: string; name: string; message: string }): Promise<Comment> {
  const db = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } })
  const rows = await db`
    insert into comments (event_id, name, message) values (${data.event_id}, ${data.name}, ${data.message}) returning *
  `
  return rows[0] as Comment
}

export async function getComments(eventId: string): Promise<Comment[]> {
  const db = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } })
  const rows = await db`
    select * from comments where event_id = ${eventId} order by created_at asc
  `
  return rows as Comment[]
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
