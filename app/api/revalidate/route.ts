import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

// Call after external imports/edits. Keep this secret out of client code.
export async function POST(req: NextRequest) {
  const secret = process.env.CACHE_REVALIDATION_SECRET
  if (!secret) return NextResponse.json({ error: 'Revalidation is not configured' }, { status: 503 })
  const supplied = Buffer.from(req.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  revalidateTag('event-social')
  for (const path of ['/', '/events', '/events/past', '/djs', '/sitemap.xml', '/breakfast-club']) revalidatePath(path)
  revalidatePath('/events/[slug]', 'page')
  revalidatePath('/djs/[slug]', 'page')
  return NextResponse.json({ revalidated: true })
}
