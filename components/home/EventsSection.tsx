'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import type { Event } from '@/lib/db'


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

function EventCard({ event }: { event: Event }) {
  const [hover, setHover] = useState(false)

  const dateStr = new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' }).toUpperCase()

  const tags = Array.isArray(event.tags) ? event.tags : []
  const imageUrl = event.banner_url || event.image_url || null
  const href = event.slug ? `/events/${event.slug}` : '/events'
  const isSoon = false

  return (
    <div style={{ height: '100%' }}>
      <Link href={href} style={{ display: 'flex', height: '100%', textDecoration: 'none' }}>
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: 'flex', flexDirection: 'column', width: '100%',
            background: '#faf8f6',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 'var(--ss-radius)',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            cursor: 'pointer',
          }}
        >
          {/* Image area — inset from card edges */}
          <div style={{ padding: '12px 12px 0', flexShrink: 0 }}>
            <div style={{ aspectRatio: '16/9', background: '#e0dbd5', overflow: 'hidden', position: 'relative', borderRadius: 'calc(var(--ss-radius) - 4px)' }}>
              {imageUrl ? (
                <Image src={imageUrl} fill sizes="(max-width: 640px) 85vw, 420px" loading="lazy" style={{ objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)', transform: hover ? 'scale(1.06)' : 'scale(1)' }} alt={event.title} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 14px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(0,0,0,0.3)' }}>event art</span>
                </div>
              )}
              {isSoon && (
                <div style={{ position: 'absolute', top: 10, right: 10, background: '#e8e3dc', color: '#6b6460', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 12px' }}>Coming Soon</div>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.10em', color: '#c9321a', textTransform: 'uppercase', marginBottom: 7 }}>{dateStr}</div>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 22, color: '#1c1917', textTransform: 'uppercase', lineHeight: 1.05, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.title}</div>
            <div style={{ color: 'rgba(28,25,23,0.5)', fontSize: 14, marginBottom: 14 }}>{event.venue}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              {tags.map((tag: string) => (
                <span key={tag} style={{ background: 'rgba(28,25,23,0.07)', color: 'rgba(28,25,23,0.6)', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', alignSelf: 'flex-start', borderRadius: 999 }}>{tag}</span>
              ))}
            </div>
            <button
              style={{
                marginTop: 'auto',
                width: '100%',
                cursor: isSoon ? 'default' : 'pointer',
                background: isSoon ? 'transparent' : (hover ? '#c9321a' : 'transparent'),
                border: isSoon ? '1px solid rgba(28,25,23,0.15)' : '1px solid #c9321a',
                color: isSoon ? '#8a8078' : (hover ? '#fff' : '#c9321a'),
                fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 14,
                letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px',
                borderRadius: 'var(--ss-radius-btn)',
                transition: 'color 0.2s, background 0.2s, border-color 0.2s',
              }}
            >{isSoon ? 'Coming Soon' : 'View Event →'}</button>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default function EventsSection({ events }: { events: Event[] }) {
  if (events.length === 0) return null
  const displayEvents = events
  const [headerRef, headerVisible] = useInView()

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps',
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
    <section id="events" style={{ padding: '100px 0', background: '#f0ece6', overflow: 'hidden' }}>
      {/* Header — aligned to content boundary */}
      <div className="events-header" style={{ maxWidth: 1312, margin: '0 auto', padding: '0 clamp(20px, 4vw, 56px)' }}>
        <div ref={headerRef} style={{
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c9321a', marginBottom: 14 }}>Upcoming Shows</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(52px,6vw,88px)', lineHeight: 0.88, color: '#1c1917', textTransform: 'uppercase' }}>Events</div>
            <Link href="/events" style={{ color: 'rgba(28,25,23,0.5)', textDecoration: 'none', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid rgba(28,25,23,0.2)', paddingBottom: 2 }}>All Events →</Link>
          </div>
        </div>
      </div>

      {/* Embla — clipped at content left boundary, bleeds right to viewport */}
      <div className="embla-events-outer">
        <div style={{ position: 'relative', paddingTop: 16, paddingBottom: 20, marginTop: -16, marginBottom: -20 }}>
          <div ref={emblaRef} style={{ cursor: 'grab' }} className="embla-events">
            <div style={{ display: 'flex', gap: 'var(--ss-card-gap)', alignItems: 'stretch' }}>
              {displayEvents.map((e) => (
                <div key={e.id} className="embla-events-slide" style={{ flexShrink: 0, minWidth: 0 }}>
                  <EventCard event={e} />
                </div>
              ))}
            </div>
          </div>
          {/* Right fade — positioned on wrapper so it covers full card height */}
          <div className="embla-events-fade" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 140, background: 'linear-gradient(to right, transparent, #f0ece6)', pointerEvents: 'none', zIndex: 2 }} />
        </div>
      </div>

      {/* Dot indicators — mobile only, centered within content area */}
      <div className="embla-dots" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
        {displayEvents.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            style={{
              width: 20,
              height: 6,
              border: 'none',
              borderRadius: 3,
              background: i === selectedIndex ? '#c9321a' : 'rgba(28,25,23,0.15)',
              cursor: 'pointer',
              padding: 0,
              transform: `scaleX(${i === selectedIndex ? 1 : 0.3})`,
              transformOrigin: 'center',
              transition: 'transform 0.25s ease, background 0.25s ease',
            }}
            aria-label={`Go to event ${i + 1}`}
          />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /*
          Content boundary = same as navbar: maxWidth 1312px centered + clamp(20px,4vw,56px) padding.
          Left/right margins resolve to exactly that boundary at every viewport width.
          max() handles the transition: when viewport < 1312px the centering term goes negative,
          so max() falls back to just the padding value.
        */
        .embla-events-outer {
          overflow: visible;
          margin-left: max(clamp(20px, 4vw, 56px), calc((100vw - 1312px) / 2 + clamp(20px, 4vw, 56px)));
          margin-right: max(clamp(20px, 4vw, 56px), calc((100vw - 1312px) / 2 + clamp(20px, 4vw, 56px)));
        }
        .embla-events { cursor: grab; overflow: hidden; }
        .embla-events:active { cursor: grabbing; }
        .embla-events-slide { width: 380px; }
        .embla-dots { display: none; }

        @media (max-width: 640px) {
          #events { padding: 60px 0 !important; }
          .embla-events-slide { width: 78vw; }
          .embla-dots { display: flex !important; }
          .embla-events-fade { right: -20px !important; width: 80px !important; }
        }
      ` }} />
    </section>
  )
}
