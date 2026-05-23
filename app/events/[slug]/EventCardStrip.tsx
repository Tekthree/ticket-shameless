'use client'

import Link from 'next/link'
import { useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import type { Event } from '@/lib/db'

const C = {
  red: '#c9321a',
  darkCard: '#252220',
  darkBorder: 'rgba(255,255,255,0.07)',
  darkText: '#f0ece6',
  darkMuted: '#7a7068',
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
}

function Card({ event }: { event: Event }) {
  const [hover, setHover] = useState(false)
  return (
    <Link href={`/events/${event.slug}`} style={{ textDecoration: 'none', display: 'block', flexShrink: 0, width: 260 }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ background: C.darkCard, border: `1px solid ${hover ? C.red : C.darkBorder}`, borderRadius: 'var(--ss-radius)', padding: '18px', cursor: 'pointer', transition: 'border-color 0.15s', height: '100%' }}
      >
        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 18, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.red, marginBottom: 5 }}>{fmt(event.date)}</div>
        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 20, color: C.darkText, textTransform: 'uppercase', lineHeight: 1, marginBottom: 4 }}>{event.title}</div>
        <div style={{ color: C.darkMuted, fontSize: 13, marginBottom: 14 }}>{event.venue} · Seattle</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ background: C.red, color: '#fff', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px', borderRadius: 'var(--ss-radius-btn)' }}>Tickets</span>
        </div>
      </div>
    </Link>
  )
}

export default function EventCardStrip({ events }: { events: Event[] }) {
  const [emblaRef] = useEmblaCarousel({ align: 'start', loop: false, dragFree: true, containScroll: 'trimSnaps' })

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {events.map(e => <Card key={e.id} event={e} />)}
        </div>
      </div>
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 80,
        background: 'linear-gradient(to right, transparent, #1c1917)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
