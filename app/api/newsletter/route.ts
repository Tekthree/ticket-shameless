import { NextRequest, NextResponse } from 'next/server'
import { addSubscriber } from '@/lib/db'
import { newsletterAttribution } from '@/lib/newsletter-attribution'

export async function POST(req: NextRequest) {
  try {
    const input = await req.json()
    const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : ''
    const name = typeof input?.name === 'string' ? input.name.slice(0, 120) : undefined
    const source = input?.source === 'breakfast-club-2027' ? input.source : 'homepage'

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    await addSubscriber(email, name, source, newsletterAttribution(input?.attribution))
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('Newsletter error:', err)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
