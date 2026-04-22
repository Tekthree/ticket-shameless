import { NextResponse } from 'next/server'
import { sql, getEvents } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const rawEvents = await sql`SELECT id, slug, title, date, is_published FROM events ORDER BY date`
  const publishedEvents = await getEvents(10)
  const dbUrl = process.env.DATABASE_URL?.slice(0, 80) ?? 'not set'
  return NextResponse.json({ dbUrl, rawCount: rawEvents.length, rawEvents, publishedCount: publishedEvents.length, publishedSlugs: publishedEvents.map(e => e.slug) })
}
