import { Metadata } from 'next'
import Link from 'next/link'
import { getEvents } from '@/lib/events'
import type { Event } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Events - Simply Shameless',
  description: "Upcoming Shameless Productions events in Seattle — underground house and techno.",
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
}
function fmtTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' })
}

function EventRow({ event }: { event: Event }) {
  const dateStr = fmt(event.date)
  const timeStr = fmtTime(event.date)
  const endTimeStr = event.end_date ? fmtTime(event.end_date) : null
  const tags = event.tags ?? []

  return (
    <Link href={`/events/${event.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div
        className="event-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr auto',
          alignItems: 'center',
          gap: 32,
          padding: '28px 0',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          transition: 'background 0.15s',
          cursor: 'pointer',
        }}
      >
        {/* Date */}
        <div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 18, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c9321a', marginBottom: 4 }}>{dateStr}</div>
          <div style={{ color: '#7a7068', fontSize: 13 }}>{timeStr}{endTimeStr ? ` – ${endTimeStr}` : ''}</div>
        </div>

        {/* Title + meta */}
        <div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(20px, 2.5vw, 28px)', color: '#f0ece6', textTransform: 'uppercase', lineHeight: 1, marginBottom: 6 }}>{event.title}</div>
          <div style={{ color: '#7a7068', fontSize: 14, marginBottom: 10 }}>{event.venue}{event.address ? ` · ${event.address}` : ''}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tags.map(tag => (
              <span key={tag} style={{ background: 'rgba(201,50,26,0.12)', color: '#c9321a', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px' }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span className="event-row-btn" style={{ display: 'inline-block', background: '#c9321a', color: '#fff', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '10px 20px', transition: 'background 0.15s' }}>
            View Event →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function EventsPage() {
  const events = await getEvents(20)

  return (
    <div style={{ minHeight: '100vh', background: '#1c1917', paddingTop: 64 }}>
      <div className="events-container" style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px, 6vw, 60px) clamp(20px, 4vw, 56px)' }}>
        {/* Header */}
        <div style={{ marginBottom: 56, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c9321a', marginBottom: 14 }}>Upcoming Shows</div>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 0.88, color: '#f0ece6', textTransform: 'uppercase' }}>Events</div>
          </div>
          <Link href="/events/past" style={{
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
          }} className="past-link">
            Past Events →
          </Link>
        </div>

        {events.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 22, color: '#7a7068', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No events currently scheduled</div>
            <div style={{ color: '#7a7068', fontSize: 14, marginTop: 12 }}>Check back soon.</div>
          </div>
        ) : (
          <div>
            {events.map(event => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .event-row:hover { background: rgba(255,255,255,0.02); }
        .event-row:hover .event-row-btn { background: #a82614; }
        .past-link:hover { border-color: #c9321a !important; color: #c9321a !important; }

        @media (max-width: 768px) {
          .events-container { padding: 40px 24px !important; }
          .event-row {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            padding: 24px 0 !important;
          }
          .event-row > div:last-child { text-align: left !important; }
        }

        @media (max-width: 640px) {
          .events-container { padding: 32px 20px !important; }
        }
      ` }} />
    </div>
  )
}
