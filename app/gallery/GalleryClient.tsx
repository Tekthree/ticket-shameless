'use client'

import Image from 'next/image'
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
  redMuted: 'rgba(201,50,26,0.12)',
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
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 'var(--ss-card-gap)' }} className="ss-gallery-grid">
      {columns.map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ss-card-gap)' }}>
          {col.map(({ photo, index }) => (
            <div
              key={photo.id}
              onClick={() => onOpen(index)}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--ss-radius)', cursor: 'pointer', background: C.darkCard, aspectRatio: photo.aspect || 1 }}
              className="ss-photo-cell"
            >
              {photo.src ? (
                <Image src={photo.src} alt={photo.alt} fill loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw" style={{ objectFit: 'cover' }} />
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

function ReportModal({ photo, event, onClose }: { photo: Photo; event: GalleryEvent; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('face')
  const [details, setDetails] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.dark, border: `1px solid ${C.darkBorder}`, padding: 'clamp(28px,5vw,36px) clamp(20px,5vw,40px)', width: '100%', maxWidth: 480 }}>
        {step === 1 ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.red, marginBottom: 8 }}>Image Removal Request</div>
                <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 22, color: C.darkText, textTransform: 'uppercase', lineHeight: 1 }}>Report This Photo</div>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.darkMuted, cursor: 'pointer', fontSize: 22, marginLeft: 16, flexShrink: 0 }}>×</button>
            </div>
            <p style={{ color: C.darkMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              We take privacy seriously. If you appear in this photo and would like it removed, fill out the form below and we&apos;ll respond within 48 hours.
            </p>
            <form onSubmit={e => { e.preventDefault(); setStep(2) }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.darkMuted, display: 'block', marginBottom: 6 }}>Your Name *</label>
                <input required className="report-input" placeholder="First Last" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.darkMuted, display: 'block', marginBottom: 6 }}>Email *</label>
                <input required type="email" className="report-input" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.darkMuted, display: 'block', marginBottom: 6 }}>Reason *</label>
                <select className="report-input" value={reason} onChange={e => setReason(e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value="face">My face appears in this photo</option>
                  <option value="consent">I did not consent to being photographed</option>
                  <option value="minor">This photo contains a minor</option>
                  <option value="other">Other privacy concern</option>
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.darkMuted, display: 'block', marginBottom: 6 }}>Additional details</label>
                <textarea className="report-input" rows={3} placeholder="Describe where you appear in the photo or any other relevant details..." value={details} onChange={e => setDetails(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, background: C.red, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', padding: 15 }}>Submit Request</button>
                <button type="button" onClick={onClose} style={{ padding: '15px 20px', background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkMuted, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Cancel</button>
              </div>
            </form>
            <p style={{ color: 'rgba(122,112,104,0.5)', fontSize: 11, lineHeight: 1.6, marginTop: 16 }}>
              Photo: {event.title} · {event.date} · Photographer: {event.photographer.name}<br />
              We will never share your personal information. Requests are reviewed within 48 hours.
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, background: C.redMuted, border: `2px solid ${C.red}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24, color: C.red }}>✓</div>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 28, color: C.darkText, textTransform: 'uppercase', marginBottom: 12 }}>Request Received</div>
            <p style={{ color: C.darkMuted, fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              Thanks {name.split(' ')[0]}. We&apos;ve logged your request and will review it within 48 hours. You&apos;ll hear from us at <strong style={{ color: C.darkText }}>{email}</strong>.
            </p>
            <button onClick={onClose} style={{ background: C.red, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '14px 36px' }}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}

function PhotoModal({
  photo, photoIndex, allPhotos, event, onClose, onNav,
}: {
  photo: Photo; photoIndex: number; allPhotos: Photo[]; event: GalleryEvent; onClose: () => void; onNav: (d: number) => void
}) {
  const [reporting, setReporting] = useState(false)
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
            <div style={{ position: 'relative', width: '100%', aspectRatio: photo.aspect || 1, maxHeight: '72vh' }}>
              <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 1024px) 100vw, 1000px" style={{ objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: photo.aspect || 1, maxHeight: '72vh', position: 'relative' }}>
              <PhotoPlaceholder index={photoIndex} eventId={event.id} />
            </div>
          )}
        </div>

        {/* Info bar */}
        <div style={{ background: C.dark, border: `1px solid ${C.darkBorder}`, borderTop: 'none', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke={C.red} strokeWidth="1.3"/><circle cx="8" cy="8" r="2.5" stroke={C.red} strokeWidth="1.3"/><path d="M5.5 5.5L4 4M10.5 5.5L12 4M10.5 10.5L12 12M5.5 10.5L4 12" stroke={C.red} strokeWidth="1.1" strokeLinecap="round"/></svg>
              <div>
                <span style={{ color: C.darkMuted, fontSize: 11, fontFamily: 'var(--font-barlow), sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>Photo by </span>
                <a href={event.photographer.url} target="_blank" rel="noopener noreferrer" style={{ color: C.darkText, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', textDecoration: 'none', borderBottom: `1px solid ${C.darkBorder}`, paddingBottom: 1 }}>
                  {event.photographer.name} ↗
                </a>
              </div>
            </div>
            <span style={{ color: C.darkMuted, fontSize: 12, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {event.title} · {event.date}
            </span>
            <span style={{ color: 'rgba(122,112,104,0.5)', fontSize: 12 }}>{photoIndex + 1} / {allPhotos.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setReporting(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkMuted, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 14px' }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v6M7 10v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/></svg>
              Report Image
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkMuted, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 14px' }}>
              Close ×
            </button>
          </div>
        </div>
      </div>

      {reporting && <ReportModal photo={photo} event={event} onClose={() => setReporting(false)} />}

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

export default function GalleryClient({ events }: { events: GalleryEvent[] }) {
  const [activeEvent, setActiveEvent] = useState(events[0].id)
  const [modal, setModal] = useState<{ photoIndex: number } | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)

  const event = events.find(e => e.id === activeEvent) ?? events[0]

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const eventParam = params.get('event')
    if (eventParam && events.find(e => e.id === eventParam)) {
      setActiveEvent(eventParam)
    }
  }, [events])

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

  useEffect(() => {
    const el = tabsRef.current
    if (!el) return
    let isDown = false
    let startX = 0
    let scrollLeft = 0
    const onDown = (e: PointerEvent) => {
      isDown = true
      startX = e.pageX - el.offsetLeft
      scrollLeft = el.scrollLeft
      el.setPointerCapture(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const onUp = () => { isDown = false; el.style.cursor = '' }
    const onMove = (e: PointerEvent) => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      el.scrollLeft = scrollLeft - (x - startX) * 1.5
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointermove', onMove)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointermove', onMove)
    }
  }, [])

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
        <div style={{ padding: 'clamp(40px, 6vw, 60px) clamp(20px, 4vw, 56px) 0', maxWidth: 1312, margin: '0 auto' }}>
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
          <div style={{ maxWidth: 1312, margin: '0 auto', padding: `0 clamp(20px, 4vw, 56px)`, display: 'flex', alignItems: 'stretch' }}>
            <div ref={tabsRef} style={{ flex: 1, display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {events.map(e => (
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
                  <span style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 2, background: C.red, transform: `scaleX(${activeEvent === e.id ? 1 : 0})`, transformOrigin: 'left', transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)' }} />
                </button>
              ))}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: 12, borderLeft: `1px solid ${C.darkBorder}` }}>
              <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', color: C.darkMuted, whiteSpace: 'nowrap' }}>
                {event.photos.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Event info strip */}
      <div style={{ maxWidth: 1312, margin: '0 auto', padding: `24px clamp(20px, 4vw, 56px)`, borderBottom: `1px solid ${C.darkBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 24, color: C.darkText, textTransform: 'uppercase', lineHeight: 1 }}>{event.title}</div>
          <div style={{ color: C.darkMuted, fontSize: 14, marginTop: 4 }}>{event.date} · {event.venue}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke={C.red} strokeWidth="1.3"/><circle cx="8" cy="8" r="2.5" stroke={C.red} strokeWidth="1.3"/></svg>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.darkMuted }}>
            Photography by{' '}
            <a href={event.photographer.url} target="_blank" rel="noopener noreferrer" style={{ color: C.red, textDecoration: 'none', borderBottom: '1px solid rgba(201,50,26,0.3)', paddingBottom: 1 }}>
              {event.photographer.name} ↗
            </a>
          </div>
        </div>
      </div>

      {/* Photo grid */}
      <div style={{ maxWidth: 1312, margin: '0 auto', padding: `20px clamp(20px, 4vw, 56px) 80px` }}>
        <PhotoGrid photos={event.photos} event={event} onOpen={openModal} />

        {/* Privacy notice */}
        <div style={{ marginTop: 48, padding: '20px 24px', background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 'var(--ss-radius)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
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
        .report-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #f0ece6; font-family: var(--font-dm), sans-serif; font-size: 15px; padding: 12px 14px; outline: none; transition: border-color 0.2s; resize: none; box-sizing: border-box; }
        .report-input:focus { border-color: #c9321a; }
        .report-input::placeholder { color: #7a7068; }
      ` }} />
    </div>
  )
}
