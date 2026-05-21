import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

async function getUserFromToken(token: string | null) {
  if (!token) return null
  const db = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } })
  const rows = await db`
    SELECT u.id, u.phone, u.name
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
    AND s.expires_at > NOW()
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  const token = req.headers.get('x-session-token')
  const db = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } })

  const [countRows, userLikeRows] = await Promise.all([
    db`SELECT COUNT(*)::int AS count FROM event_likes WHERE event_id = ${eventId}`,
    token ? db`
      SELECT l.user_id FROM user_sessions s
      JOIN event_likes l ON l.user_id = s.user_id
      WHERE s.token = ${token} AND s.expires_at > NOW() AND l.event_id = ${eventId}
      LIMIT 1
    ` : Promise.resolve([]),
  ])

  return NextResponse.json({
    count: (countRows[0]?.count as number) ?? 0,
    liked: userLikeRows.length > 0,
  })
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-session-token')
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { event_id } = await req.json()
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  const db = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } })

  const existing = await db`
    SELECT 1 FROM event_likes WHERE user_id = ${user.id as string} AND event_id = ${event_id}
  `

  if (existing.length > 0) {
    await db`DELETE FROM event_likes WHERE user_id = ${user.id as string} AND event_id = ${event_id}`
  } else {
    await db`INSERT INTO event_likes (user_id, event_id) VALUES (${user.id as string}, ${event_id})`
  }

  const countRows = await db`SELECT COUNT(*)::int AS count FROM event_likes WHERE event_id = ${event_id}`

  return NextResponse.json({
    liked: existing.length === 0,
    count: (countRows[0]?.count as number) ?? 0,
  })
}
