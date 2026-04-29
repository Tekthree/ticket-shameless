'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import type { Event } from '@/lib/db'

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

function EventCard({ event }: { event: Event | typeof PLACEHOLDER_EVENTS[0] }) {
  const [hover, setHover] = useState(false)
  const [btnHover, setBtnHover] = useState(false)

  const dateStr = event.date instanceof Date
    ? event.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
    : String(event.date || '').toUpperCase()

  const tags = Array.isArray(event.tags) ? event.tags : []
  const imageUrl = event.banner_url || event.image_url || null
  const href = event.slug ? `/events/${event.slug}` : '/events'
  const isSoon = event.status === 'soon'

  return (
    <div style={{ height: '100%' }}>
      <Link href={href} style={{ display: 'flex', height: '100%', textDecoration: 'none' }}>
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: 'flex', flexDirection: 'column', width: '100%',
            background: hover ? '#fff' : '#faf7f2',
            border: '1px solid rgba(28,25,23,0.1)',
            transform: hover ? 'translateY(-6px)' : 'translateY(0)',
            boxShadow: hover ? '0 16px 40px rgba(28,25,23,0.12)' : 'none',
            transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease, background 0.15s',
            cursor: 'pointer',
          }}
        >
          {/* Image area */}
          <div style={{ aspectRatio: '16/9', flexShrink: 0, background: '#f2ede5', overflow: 'hidden', position: 'relative', borderBottom: '1px solid rgba(28,25,23,0.1)' }}>
            {imageUrl ? (
              <Image src={imageUrl} fill sizes="(max-width: 640px) 85vw, 420px" loading="eager" style={{ objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)', transform: hover ? 'scale(1.06)' : 'scale(1)' }} alt={event.title} />
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
          <div style={{ padding: '22px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.2em', color: '#c9321a', textTransform: 'uppercase', marginBottom: 7 }}>{dateStr}</div>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 24, color: '#1c1917', textTransform: 'uppercase', lineHeight: 1, marginBottom: 6 }}>{event.title}</div>
            <div style={{ color: '#8a8078', fontSize: 14, marginBottom: 14 }}>{event.venue || event.location}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              {tags.map((tag: string) => (
                <span key={tag} style={{ background: 'rgba(201,50,26,0.12)', color: '#c9321a', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', alignSelf: 'flex-start' }}>{tag}</span>
              ))}
            </div>
            <button
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                marginTop: 'auto',
                width: '100%', border: 'none', cursor: isSoon ? 'default' : 'pointer',
                background: isSoon ? 'rgba(28,25,23,0.06)' : (btnHover ? '#a82614' : '#c9321a'),
                color: isSoon ? '#8a8078' : '#fff',
                fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 14,
                letterSpacing: '0.15em', textTransform: 'uppercase', padding: '13px',
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

export default function EventsSection({ events }: { events: Event[] }) {
  const displayEvents = events.length > 0 ? events : PLACEHOLDER_EVENTS
  const [headerRef, headerVisible] = useInView()

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: false,
    slidesToScroll: 1,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    onSelect()
  }, [emblaApi, onSelect])

  return (
    <section id="events" style={{ padding: '100px 0', background: '#f2ede5', overflow: 'hidden' }}>
      {/* Header — aligned to content boundary */}
      <div className="events-header" style={{ maxWidth: 1312, margin: '0 auto', padding: '0 56px' }}>
        <div ref={headerRef} style={{
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c9321a', marginBottom: 14 }}>Upcoming Shows</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(52px,6vw,88px)', lineHeight: 0.88, color: '#1c1917', textTransform: 'uppercase' }}>Events</div>
            <Link href="/events" style={{ color: '#8a8078', textDecoration: 'none', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: '1px solid rgba(28,25,23,0.1)', paddingBottom: 2 }}>All Events →</Link>
          </div>
        </div>
      </div>

      {/* Embla — starts at content left, bleeds right to screen edge */}
      <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab' }} className="embla-events">
        <div style={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
          {displayEvents.map((e) => (
            <div key={e.id} className="embla-events-slide" style={{ flexShrink: 0, minWidth: 0 }}>
              <EventCard event={e} />
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators — mobile only */}
      <div className="embla-dots" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
        {displayEvents.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            style={{
              width: i === selectedIndex ? 20 : 6,
              height: 6,
              border: 'none',
              borderRadius: 3,
              background: i === selectedIndex ? '#c9321a' : 'rgba(28,25,23,0.2)',
              cursor: 'pointer',
              padding: 0,
              transition: 'width 0.25s ease, background 0.25s ease',
            }}
            aria-label={`Go to event ${i + 1}`}
          />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .embla-events { padding-left: max(56px, calc((100vw - 1200px) / 2)); cursor: grab; }
        .embla-events:active { cursor: grabbing; }
        .embla-events-slide { width: 420px; }
        .embla-dots { display: none; }

        @media (max-width: 640px) {
          #events { padding: 60px 0 !important; }
          .events-header { padding: 0 24px !important; }
          .embla-events { padding-left: 24px; }
          .embla-events-slide { width: 75vw; }
          .embla-dots { display: flex !important; }
        }
      ` }} />
    </section>
  )
}
