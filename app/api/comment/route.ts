import { NextRequest, NextResponse } from 'next/server'
import { createComment, getComments } from '@/lib/db'

export async function GET(req: NextRequest) {
  const event_id = req.nextUrl.searchParams.get('event_id')
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  try {
    const comments = await getComments(event_id)
    return NextResponse.json(comments)
  } catch (err) {
    console.error('Comments GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { event_id, name, message } = await req.json()
    if (!event_id || !name || !message?.trim()) {
      return NextResponse.json({ error: 'event_id, name, and message are required' }, { status: 400 })
    }
    const comment = await createComment({ event_id, name, message: message.trim() })
    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    console.error('Comment POST error:', err)
    return NextResponse.json({ error: 'Failed to save comment' }, { status: 500 })
  }
}
