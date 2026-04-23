import { NextRequest, NextResponse } from 'next/server'
import { createRsvp, getRsvpCounts, getRsvpComments } from '@/lib/db'

export async function GET(req: NextRequest) {
  const event_id = req.nextUrl.searchParams.get('event_id')
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  try {
    const [counts, comments] = await Promise.all([
      getRsvpCounts(event_id),
      getRsvpComments(event_id),
    ])
    return NextResponse.json({ counts, comments })
  } catch (err) {
    console.error('RSVP GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch RSVPs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_id, name, email, phone, status, note, attendee_count } = body

    if (!event_id || !name) {
      return NextResponse.json({ error: 'event_id and name are required' }, { status: 400 })
    }

    const rsvp = await createRsvp({ event_id, name, email, phone, status, note, attendee_count })
    return NextResponse.json(rsvp, { status: 201 })
  } catch (err) {
    console.error('RSVP error:', err)
    return NextResponse.json({ error: 'Failed to save RSVP' }, { status: 500 })
  }
}
