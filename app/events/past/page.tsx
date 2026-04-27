import { Metadata } from 'next'
import Link from 'next/link'
import { getPastEvents } from '@/lib/events'
import type { Event } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Past Events - Simply Shameless',
  description: 'Archive of past Shameless Productions events in Seattle.',
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
}

function EventRow({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div
        className="event-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr',
          alignItems: 'center',
          gap: 32,
          padding: '22px 0',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          transition: 'background 0.15s',
          cursor: 'pointer',
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7a7068' }}>{fmt(event.date)}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 20, color: '#f0ece6', textTransform: 'uppercase', lineHeight: 1, transition: 'color 0.15s' }} className="event-row-title">
          {event.title}
          {event.venue && <span style={{ fontWeight: 400, fontSize: 13, color: '#7a7068', marginLeft: 14, textTransform: 'none', letterSpacing: 0 }}>{event.venue}</span>}
        </div>
      </div>
    </Link>
  )
}

export default async function PastEventsPage() {
  const events = await getPastEvents(300)

  // Group by year
  const byYear = new Map<number, Event[]>()
  for (const e of events) {
    const yr = new Date(e.date).getFullYear()
    if (!byYear.has(yr)) byYear.set(yr, [])
    byYear.get(yr)!.push(e)
  }
  const years = [...byYear.keys()].sort((a, b) => b - a)

  return (
    <div style={{ minHeight: '100vh', background: '#1c1917', paddingTop: 64 }}>
      <div className="events-container" style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 48px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c9321a', marginBottom: 14 }}>Archive</div>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 0.88, color: '#f0ece6', textTransform: 'uppercase' }}>Past Events</div>
            <div style={{ color: '#7a7068', fontSize: 14, marginTop: 14 }}>{events.length} shows</div>
          </div>
          <Link href="/events" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(240,236,230,0.5)',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '12px 20px',
            textDecoration: 'none',
            transition: 'border-color 0.2s, color 0.2s',
          }} className="back-link">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Upcoming
          </Link>
        </div>

        {years.map(yr => (
          <div key={yr} style={{ marginBottom: 56 }}>
            <div style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#c9321a',
              borderBottom: '1px solid rgba(201,50,26,0.2)',
              paddingBottom: 12,
              marginBottom: 4,
            }}>{yr} <span style={{ color: '#7a7068', fontWeight: 700 }}>({byYear.get(yr)!.length})</span></div>
            {byYear.get(yr)!.map(e => <EventRow key={e.id} event={e} />)}
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .event-row:hover { background: rgba(255,255,255,0.02); }
        .event-row:hover .event-row-title { color: #c9321a !important; }
        .back-link:hover { border-color: #c9321a !important; color: #c9321a !important; }
        @media (max-width: 768px) {
          .events-container { padding: 40px 24px !important; }
          .event-row { grid-template-columns: 1fr !important; gap: 6px !important; padding: 20px 0 !important; }
        }
        @media (max-width: 640px) {
          .events-container { padding: 32px 20px !important; }
        }
      ` }} />
    </div>
  )
}
