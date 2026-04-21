'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'

const PLACEHOLDER_EVENTS = [
  { id: '1', title: 'Electric Soul', date: new Date('2025-05-09'), venue: 'Kremwerk, Seattle', tags: ['House', 'Techno'], status: 'tickets', slug: null },
  { id: '2', title: 'Auden × Miky Montenegro', date: new Date('2025-05-17'), venue: 'Monkey Loft, Seattle', tags: ['House'], status: 'tickets', slug: null },
  { id: '3', title: 'Desert Hearts × Shameless', date: new Date('2025-05-25'), venue: 'Monkey Loft, Seattle', tags: ['House', 'Techno', 'Deep'], status: 'soon', slug: null, hasImg: true },
  { id: '4', title: 'Nonstop', date: new Date('2025-06-14'), venue: 'TBA, Seattle', tags: ['Techno'], status: 'soon', slug: null },
]

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible] as const
}

function EventCard({ event, delay }: { event: any; delay: number }) {
  const [ref, visible] = useInView()
  const [hover, setHover] = useState(false)
  const [btnHover, setBtnHover] = useState(false)

  const dateStr = event.date instanceof Date
    ? event.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
    : String(event.date || '').toUpperCase()

  const tags = event.tags || []
  const hasImg = event.hasImg || event.image_url
  const href = event.slug ? `/events/${event.slug}` : '/events'
  const isSoon = event.status === 'soon'

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      <Link href={href} style={{ display: 'block', textDecoration: 'none' }}>
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            background: hover ? '#fff' : '#faf7f2',
            border: '1px solid rgba(28,25,23,0.1)',
            transform: hover ? 'translateY(-6px)' : 'translateY(0)',
            boxShadow: hover ? '0 16px 40px rgba(28,25,23,0.12)' : 'none',
            transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease, background 0.15s',
            cursor: 'pointer',
          }}
        >
          {/* Image area */}
          <div style={{ height: 190, background: '#f2ede5', overflow: 'hidden', position: 'relative', borderBottom: '1px solid rgba(28,25,23,0.1)' }}>
            {hasImg ? (
              <Image src="/brand-hero.jpg" fill style={{ objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)', transform: hover ? 'scale(1.06)' : 'scale(1)' }} alt={event.title} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, rgba(28,25,23,0.04) 0px, rgba(28,25,23,0.04) 1px, transparent 1px, transparent 14px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#8a8078' }}>event art</span>
              </div>
            )}
            {isSoon && (
              <div style={{ position: 'absolute', top: 14, right: 14, background: '#1c1917', color: '#7a7068', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '5px 12px' }}>Coming Soon</div>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: '22px 24px 24px' }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.2em', color: '#c9321a', textTransform: 'uppercase', marginBottom: 7 }}>{dateStr}</div>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 24, color: '#1c1917', textTransform: 'uppercase', lineHeight: 1, marginBottom: 6 }}>{event.title}</div>
            <div style={{ color: '#8a8078', fontSize: 14, marginBottom: 14 }}>{event.venue || event.location}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              {tags.map((tag: string) => (
                <span key={tag} style={{ background: 'rgba(201,50,26,0.12)', color: '#c9321a', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px' }}>{tag}</span>
              ))}
            </div>
            <button
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                width: '100%', border: 'none', cursor: isSoon ? 'default' : 'pointer',
                background: isSoon ? '#f2ede5' : (btnHover ? '#a82614' : '#c9321a'),
                color: isSoon ? '#8a8078' : '#fff',
                fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 14,
                letterSpacing: '0.15em', textTransform: 'uppercase', padding: '13px',
                borderTop: isSoon ? '1px solid rgba(28,25,23,0.1)' : 'none',
                transition: 'background 0.15s, transform 0.1s',
                transform: !isSoon && btnHover ? 'scale(0.98)' : 'scale(1)',
              }}
            >{isSoon ? 'Coming Soon' : 'View Event →'}</button>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default function EventsSection({ events }: { events: any[] }) {
  const displayEvents = events.length > 0 ? events : PLACEHOLDER_EVENTS
  const [ref, visible] = useInView()

  return (
    <section id="events" style={{ padding: '100px 56px', background: '#f2ede5' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div ref={ref} style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c9321a', marginBottom: 14 }}>Upcoming Shows</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(52px,6vw,88px)', lineHeight: 0.88, color: '#1c1917', textTransform: 'uppercase' }}>Events</div>
            <Link href="/events" style={{ color: '#8a8078', textDecoration: 'none', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: '1px solid rgba(28,25,23,0.1)', paddingBottom: 2 }}>All Events →</Link>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2 }}>
          {displayEvents.slice(0, 4).map((e, i) => (
            <EventCard key={e.id} event={e} delay={i * 80} />
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) {
          #events > div > div:last-child { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 640px) {
          #events { padding: 60px 24px !important; }
          #events > div > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
