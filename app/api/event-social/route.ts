import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getPublicEventSocial, getPublicEventComments } from '@/lib/event-social'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  const token = req.headers.get('x-session-token')
  const db = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } })

  const [publicData, userLikeRows, commentRows] = await Promise.all([
    getPublicEventSocial(eventId),
    token
      ? db`
          SELECT l.user_id FROM user_sessions s
          JOIN event_likes l ON l.user_id = s.user_id
          WHERE s.token = ${token} AND s.expires_at > NOW() AND l.event_id = ${eventId}
          LIMIT 1
        `
      : Promise.resolve([]),
    searchParams.get('comments') === '0' ? Promise.resolve([]) : getPublicEventComments(eventId),
  ])

  return NextResponse.json({
    likes: {
      count: publicData.count,
      liked: userLikeRows.length > 0,
    },
    rsvpCounts: publicData.rsvpCounts,
    comments: commentRows,
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}
