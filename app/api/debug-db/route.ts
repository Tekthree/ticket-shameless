import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const events = await sql`SELECT id, slug, title, date FROM events ORDER BY date`
  const dbUrl = process.env.DATABASE_URL?.slice(0, 60) ?? 'not set'
  return NextResponse.json({ dbUrl, count: events.length, events })
}
