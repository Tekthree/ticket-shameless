import { unstable_cache } from 'next/cache'
import { neon } from '@neondatabase/serverless'

// Only public data belongs in this shared cache; never cache session tokens here.
const db = () => neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } })

export const getPublicEventSocial = unstable_cache(async (eventId: string) => {
  const sql = db()
  const [likes, rows] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM event_likes WHERE event_id = ${eventId}`,
    sql`SELECT status, COUNT(*)::int AS count FROM rsvps WHERE event_id = ${eventId} GROUP BY status`,
  ])
  const rsvpCounts = { going: 0, maybe: 0, not_going: 0 }
  for (const row of rows) rsvpCounts[row.status as keyof typeof rsvpCounts] = row.count as number
  return { count: (likes[0]?.count as number) ?? 0, rsvpCounts }
}, ['event-social-counts-v1'], { revalidate: 900, tags: ['event-social'] })

export const getPublicEventComments = unstable_cache(async (eventId: string) => {
  const sql = db()
  return sql`SELECT id, name, message, created_at FROM comments WHERE event_id = ${eventId} ORDER BY created_at ASC`
}, ['event-social-comments-v1'], { revalidate: 900, tags: ['event-social'] })
