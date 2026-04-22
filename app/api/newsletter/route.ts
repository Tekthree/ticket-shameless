import { NextRequest, NextResponse } from 'next/server'
import { addSubscriber } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    await addSubscriber(email, name)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('Newsletter error:', err)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
