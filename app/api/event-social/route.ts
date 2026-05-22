import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  const token = req.headers.get('x-session-token')
  const db = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } })

  const [likeCountRows, userLikeRows, rsvpRows, commentRows] = await Promise.all([
    db`SELECT COUNT(*)::int AS count FROM event_likes WHERE event_id = ${eventId}`,
    token
      ? db`
          SELECT l.user_id FROM user_sessions s
          JOIN event_likes l ON l.user_id = s.user_id
          WHERE s.token = ${token} AND s.expires_at > NOW() AND l.event_id = ${eventId}
          LIMIT 1
        `
      : Promise.resolve([]),
    db`
      SELECT status, COUNT(*)::int AS count
      FROM rsvps WHERE event_id = ${eventId}
      GROUP BY status
    `,
    db`
      SELECT id, name, message, created_at
      FROM comments WHERE event_id = ${eventId}
      ORDER BY created_at ASC
    `,
  ])

  const rsvpCounts = { going: 0, maybe: 0, not_going: 0 }
  for (const r of rsvpRows) {
    rsvpCounts[r.status as keyof typeof rsvpCounts] = r.count as number
  }

  return NextResponse.json({
    likes: {
      count: (likeCountRows[0]?.count as number) ?? 0,
      liked: userLikeRows.length > 0,
    },
    rsvpCounts,
    comments: commentRows,
  })
}
