import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getEvents } from '@/lib/events'
import type { Event } from '@/lib/db'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Events - Simply Shameless',
  description: "Upcoming Shameless Productions events in Seattle — underground house and techno.",
  alternates: { canonical: 'https://simplyshameless.com/events' },
}

function toSeattleISO(dateStr: string): string {
  const date = new Date(dateStr)
  const local = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date).replace(' ', 'T')
  const utcMs = date.getTime()
  const laMs = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getTime()
  const offsetMin = Math.round((laMs - utcMs) / 60000)
  const sign = offsetMin >= 0 ? '+' : '-'
  const absMin = Math.abs(offsetMin)
  const hh = String(Math.floor(absMin / 60)).padStart(2, '0')
  const mm = String(absMin % 60).padStart(2, '0')
  return `${local}${sign}${hh}:${mm}`
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
  const imageUrl = event.banner_url || event.image_url || null

  return (
    <Link href={`/events/${event.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div
        className="event-row"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 80px 1fr auto',
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

        {/* Square image */}
        <div className="event-row-img" style={{ width: 80, height: 80, borderRadius: 6, overflow: 'hidden', background: '#111', position: 'relative', flexShrink: 0 }}>
          {imageUrl ? (
            <Image src={imageUrl} fill sizes="80px" style={{ objectFit: 'cover' }} alt={event.title} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 10px)' }} />
          )}
        </div>

        {/* Title + meta */}
        <div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(20px, 2.5vw, 28px)', color: 'rgba(240,236,230,0.82)', textTransform: 'uppercase', lineHeight: 1, marginBottom: 6 }}>{event.title}</div>
          <div style={{ color: '#7a7068', fontSize: 14, marginBottom: 10 }}>{event.venue}{event.address ? ` · ${event.address}` : ''}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tags.map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.06)', color: '#7a7068', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999 }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span className="event-row-btn" style={{ display: 'inline-block', background: 'transparent', border: '1px solid #c9321a', color: '#c9321a', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '10px 20px', borderRadius: 'var(--ss-radius-btn)', transition: 'color 0.15s, border-color 0.15s' }}>
            View Event →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function EventsPage() {
  const events = await getEvents(20)

  const jsonLd = events.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Upcoming Simply Shameless Events',
    url: 'https://simplyshameless.com/events',
    itemListElement: events.map((event, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'MusicEvent',
        name: event.title,
        startDate: toSeattleISO(event.date),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        url: `https://simplyshameless.com/events/${event.slug}`,
        location: {
          '@type': 'MusicVenue',
          name: event.venue,
          address: { '@type': 'PostalAddress', addressLocality: 'Seattle', addressRegion: 'WA', addressCountry: 'US' },
        },
        organizer: { '@type': 'Organization', name: 'Simply Shameless', url: 'https://simplyshameless.com' },
        ...(event.banner_url ?? event.image_url ? { image: event.banner_url ?? event.image_url } : {}),
      },
    })),
  } : null

  return (
    <>
    {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    <div style={{ minHeight: '100vh', background: '#1c1917', paddingTop: 64 }}>
      <div className="events-container" style={{ maxWidth: 1312, margin: '0 auto', padding: 'clamp(40px, 6vw, 60px) clamp(20px, 4vw, 56px)' }}>
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
            borderRadius: 'var(--ss-radius-btn)',
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
        .event-row:hover .event-row-btn { color: #ff4d30 !important; border-color: #ff4d30 !important; }
        .past-link:hover { border-color: #c9321a !important; color: #c9321a !important; }

        @media (max-width: 768px) {
          .events-container { padding: 40px 24px !important; }
          .event-row {
            grid-template-columns: 130px 1fr !important;
            gap: 10px 16px !important;
            padding: 24px 0 !important;
          }
          .event-row > div:nth-child(1) { grid-column: 2; grid-row: 1; align-self: start; }
          .event-row-img { display: block !important; grid-column: 1; grid-row: 1 / 3; align-self: start; width: 130px !important; height: 130px !important; }
          .event-row > div:nth-child(3) { grid-column: 2; grid-row: 2; }
          .event-row > div:nth-child(4) { grid-column: 1 / 3; grid-row: 3; text-align: left !important; margin-top: 4px; }
          .event-row > div:nth-child(4) .event-row-btn { display: block !important; text-align: center !important; }
          .event-row:hover > div:nth-child(4) .event-row-btn { color: #ff4d30 !important; border-color: #ff4d30 !important; }
        }

        @media (max-width: 640px) {
          .events-container { padding: 32px 20px !important; }
        }
      ` }} />
    </div>
    </>
  )
}
