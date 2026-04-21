import { NextRequest, NextResponse } from 'next/server'
import { createRsvp } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_id, name, email, phone, status, note } = body

    if (!event_id || !name) {
      return NextResponse.json({ error: 'event_id and name are required' }, { status: 400 })
    }

    const rsvp = await createRsvp({ event_id, name, email, phone, status, note })
    return NextResponse.json(rsvp, { status: 201 })
  } catch (err) {
    console.error('RSVP error:', err)
    return NextResponse.json({ error: 'Failed to save RSVP' }, { status: 500 })
  }
}
