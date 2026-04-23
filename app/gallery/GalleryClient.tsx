'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const C = {
  dark: '#1c1917',
  darkDeep: '#111110',
  darkCard: '#252220',
  darkBorder: 'rgba(255,255,255,0.07)',
  darkText: '#f0ece6',
  darkMuted: '#7a7068',
  red: '#c9321a',
  redDeep: '#a82614',
}

type Photo = {
  id: string
  src: string | null
  alt: string
  aspect: number
}

type GalleryEvent = {
  id: string
  title: string
  date: string
  venue: string
  photographer: { name: string; url: string }
  photos: Photo[]
}

// Placeholder events — swap `src` fields for real R2 photo URLs as they're uploaded
const EVENTS: GalleryEvent[] = [
  {
    id: 'reverie-apr-26',
    title: 'Reverie Society',
    date: 'Apr 26, 2026',
    venue: 'Monkey Loft, Seattle',
    photographer: { name: 'Photographer TBD', url: '#' },
    photos: Array.from({ length: 12 }, (_, i) => ({
      id: `rv-${i}`,
      src: null,
      alt: `Reverie Society Apr 26 — photo ${i + 1}`,
      aspect: [1, 1.2, 0.85, 1, 1.3, 1, 0.9, 1.1, 1, 0.85, 1.2, 1][i],
    })),
  },
  {
    id: 'reverie-may-3',
    title: 'Reverie Society',
    date: 'May 3, 2026',
    venue: 'Monkey Loft, Seattle',
    photographer: { name: 'Photographer TBD', url: '#' },
    photos: Array.from({ length: 10 }, (_, i) => ({
      id: `rv2-${i}`,
      src: null,
      alt: `Reverie Society May 3 — photo ${i + 1}`,
      aspect: [1, 0.9, 1.1, 1, 1.2, 1, 0.85, 1.1, 1, 0.9][i],
    })),
  },
  {
    id: 'memorial-day',
    title: 'Memorial Day Hijinks',
    date: 'May 25, 2026',
    venue: 'Monkey Loft, Seattle',
    photographer: { name: 'Photographer TBD', url: '#' },
    photos: Array.from({ length: 14 }, (_, i) => ({
      id: `md-${i}`,
      src: null,
      alt: `Memorial Day Hijinks — photo ${i + 1}`,
      aspect: [1, 1.1, 0.9, 1, 1.2, 1, 1, 0.8, 1.1, 1, 0.9, 1.2, 1, 1][i],
    })),
  },
]

function PhotoPlaceholder({ index, eventId }: { index: number; eventId: string }) {
  const hues: Record<string, number> = { 'reverie-apr-26': 220, 'reverie-may-3': 250, 'memorial-day': 30 }
  const hue = hues[eventId] ?? 220
  const lightness = 9 + (index % 5) * 2
  const angles = [30, 45, 60, 20, 15, 50]
  const angle = angles[index % angles.length]
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: `hsl(${hue},18%,${lightness}%)` }}>
      <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(${angle}deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent ${14 + index * 3}px)` }} />
    </div>
  )
}

function PhotoGrid({ photos, event, onOpen }: { photos: Photo[]; event: GalleryEvent; onOpen: (i: number) => void }) {
  const cols = 3
  const columns: { photo: Photo; index: number }[][] = Array.from({ length: cols }, () => [])
  photos.forEach((photo, i) => columns[i % cols].push({ photo, index: i }))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 3 }} className="ss-gallery-grid">
      {columns.map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {col.map(({ photo, index }) => (
            <div
              key={photo.id}
              onClick={() => onOpen(index)}
              style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', background: C.darkCard, aspectRatio: photo.aspect || 1 }}
              className="ss-photo-cell"
            >
              {photo.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.src} alt={photo.alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <PhotoPlaceholder index={index} eventId={event.id} />
              )}
              <div className="ss-photo-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(28,25,23,0)', transition: 'background 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12 }}>
                <div className="ss-photo-credit" style={{ opacity: 0, transform: 'translateY(4px)', transition: 'opacity 0.2s, transform 0.2s' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {event.photographer.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function PhotoModal({
  photo, photoIndex, allPhotos, event, onClose, onNav,
}: {
  photo: Photo; photoIndex: number; allPhotos: Photo[]; event: GalleryEvent; onClose: () => void; onNav: (d: number) => void
}) {
  const hasPrev = photoIndex > 0
  const hasNext = photoIndex < allPhotos.length - 1

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onNav(-1)
      if (e.key === 'ArrowRight') onNav(1)
    }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose, onNav])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(8,7,6,0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'ss-fadeIn 0.2s ease' }} onClick={onClose}>
      <div style={{ position: 'relative', maxWidth: 1000, width: '100%', animation: 'ss-scaleIn 0.3s cubic-bezier(0.22,1,0.36,1)' }} onClick={e => e.stopPropagation()}>
        {/* Image */}
        <div style={{ position: 'relative', background: C.darkCard, maxHeight: '72vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {photo.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.src} alt={photo.alt} style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: photo.aspect || 1, maxHeight: '72vh', position: 'relative' }}>
              <PhotoPlaceholder index={photoIndex} eventId={event.id} />
            </div>
          )}
        </div>

        {/* Info bar */}
        <div style={{ background: C.dark, border: `1px solid ${C.darkBorder}`, borderTop: 'none', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: C.darkMuted, fontSize: 11, fontFamily: 'var(--font-barlow), sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>Photo by </span>
              <a href={event.photographer.url} target="_blank" rel="noopener noreferrer" style={{ color: C.darkText, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', textDecoration: 'none', borderBottom: `1px solid ${C.darkBorder}`, paddingBottom: 1 }}>
                {event.photographer.name} ↗
              </a>
            </div>
            <span style={{ color: C.darkMuted, fontSize: 12, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {event.title} · {event.date}
            </span>
            <span style={{ color: 'rgba(122,112,104,0.5)', fontSize: 12 }}>{photoIndex + 1} / {allPhotos.length}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkMuted, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 14px' }}>
            Close ×
          </button>
        </div>
      </div>

      {/* Nav arrows */}
      {hasPrev && (
        <button onClick={e => { e.stopPropagation(); onNav(-1) }} style={{ position: 'fixed', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(28,25,23,0.8)', border: `1px solid ${C.darkBorder}`, color: C.darkText, cursor: 'pointer', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 510 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      {hasNext && (
        <button onClick={e => { e.stopPropagation(); onNav(1) }} style={{ position: 'fixed', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(28,25,23,0.8)', border: `1px solid ${C.darkBorder}`, color: C.darkText, cursor: 'pointer', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 510 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </div>
  )
}

export default function GalleryClient() {
  const [activeEvent, setActiveEvent] = useState(EVENTS[0].id)
  const [modal, setModal] = useState<{ photoIndex: number } | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)

  const event = EVENTS.find(e => e.id === activeEvent) ?? EVENTS[0]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const tabs = tabsRef.current
    if (!tabs) return
    const active = tabs.querySelector<HTMLElement>('.ss-tab-active')
    if (active) active.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [activeEvent])

  const openModal = (index: number) => setModal({ photoIndex: index })
  const closeModal = useCallback(() => setModal(null), [])
  const navModal = useCallback((dir: number) => {
    setModal(m => {
      if (!m) return null
      const next = m.photoIndex + dir
      if (next < 0 || next >= event.photos.length) return m
      return { photoIndex: next }
    })
  }, [event.photos.length])

  return (
    <div style={{ minHeight: '100vh', background: C.dark }}>
      {/* Page header */}
      <div style={{ paddingTop: 64, background: C.dark }}>
        <div style={{ padding: 'clamp(40px, 6vw, 60px) clamp(20px, 4vw, 56px) 0', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.red, marginBottom: 12 }}>From the Floor</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(52px, 8vw, 100px)', lineHeight: 0.86, textTransform: 'uppercase', color: C.darkText, margin: 0 }}>
              Gallery
            </h1>
            <p style={{ color: C.darkMuted, fontSize: 15, lineHeight: 1.7, maxWidth: 340, fontWeight: 300, margin: 0 }}>
              All photography is credited to the original artist. Photos are taken at our public events.
            </p>
          </div>
        </div>

        {/* Event tabs */}
        <div style={{ position: 'sticky', top: 64, zIndex: 100, background: 'rgba(28,25,23,0.97)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.darkBorder}`, marginTop: 32 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: `0 clamp(20px, 4vw, 56px)`, display: 'flex', alignItems: 'stretch' }}>
            <div ref={tabsRef} style={{ flex: 1, display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {EVENTS.map(e => (
                <button
                  key={e.id}
                  className={activeEvent === e.id ? 'ss-tab-active' : ''}
                  onClick={() => { setActiveEvent(e.id); window.scrollTo({ top: 200, behavior: 'smooth' }) }}
                  style={{
                    flexShrink: 0,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-barlow), sans-serif',
                    fontWeight: 800,
                    fontSize: 15,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: activeEvent === e.id ? C.darkText : 'rgba(240,236,230,0.4)',
                    padding: '16px 24px',
                    position: 'relative',
                    transition: 'color 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {e.title}
                  <span style={{ color: activeEvent === e.id ? 'rgba(240,236,230,0.4)' : 'rgba(240,236,230,0.2)', fontWeight: 600, marginLeft: 6, fontSize: 13 }}>
                    {e.date.split(',')[0]}
                  </span>
                  <span style={{ position: 'absolute', bottom: 0, left: 0, width: activeEvent === e.id ? '100%' : '0%', height: 2, background: C.red, transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1)' }} />
                </button>
              ))}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: 20, borderLeft: `1px solid ${C.darkBorder}` }}>
              <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.darkMuted, whiteSpace: 'nowrap' }}>
                {event.photos.length} photos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Event info strip */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `24px clamp(20px, 4vw, 56px)`, borderBottom: `1px solid ${C.darkBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 24, color: C.darkText, textTransform: 'uppercase', lineHeight: 1 }}>{event.title}</div>
          <div style={{ color: C.darkMuted, fontSize: 14, marginTop: 4 }}>{event.date} · {event.venue}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.darkMuted }}>
            Photography by{' '}
            <a href={event.photographer.url} target="_blank" rel="noopener noreferrer" style={{ color: C.red, textDecoration: 'none', borderBottom: '1px solid rgba(201,50,26,0.3)', paddingBottom: 1 }}>
              {event.photographer.name} ↗
            </a>
          </div>
        </div>
      </div>

      {/* Photo grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `20px clamp(20px, 4vw, 56px) 80px` }}>
        <PhotoGrid photos={event.photos} event={event} onOpen={openModal} />

        {/* Privacy notice */}
        <div style={{ marginTop: 48, padding: '20px 24px', background: C.darkCard, border: `1px solid ${C.darkBorder}`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="10" cy="10" r="8.5" stroke={C.red} strokeWidth="1.4"/><path d="M10 7v4M10 13v.5" stroke={C.red} strokeWidth="1.8" strokeLinecap="round"/></svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.darkText, marginBottom: 6 }}>Privacy & Image Removal</div>
            <div style={{ color: C.darkMuted, fontSize: 14, lineHeight: 1.7 }}>
              All photos are taken at our public events by credited photographers. If you appear in any image and would like it removed, email{' '}
              <a href="mailto:privacy@simplyshameless.com" style={{ color: C.red, textDecoration: 'none' }}>privacy@simplyshameless.com</a>. We process all requests within 48 hours.
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <PhotoModal
          photo={event.photos[modal.photoIndex]}
          photoIndex={modal.photoIndex}
          allPhotos={event.photos}
          event={event}
          onClose={closeModal}
          onNav={navModal}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ss-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ss-scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .ss-photo-cell:hover .ss-photo-overlay { background: rgba(28,25,23,0.5) !important; }
        .ss-photo-cell:hover .ss-photo-credit { opacity: 1 !important; transform: translateY(0) !important; }
        @media (max-width: 640px) {
          .ss-gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      ` }} />
    </div>
  )
}
