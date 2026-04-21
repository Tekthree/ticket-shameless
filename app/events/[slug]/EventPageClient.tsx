'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import type { Event, LineupArtist } from '@/lib/db'

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

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible] as const
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }).toUpperCase()
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const Divider = () => <div style={{ height: 1, background: C.darkBorder, margin: '32px 0' }} />

const SecLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.red, marginBottom: 14 }}>
    {children}
  </div>
)

function MetaRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
      <div style={{ color: C.darkMuted, marginTop: 2, flexShrink: 0, width: 18 }}>{icon}</div>
      <div style={{ color: C.darkMuted, fontSize: 15, lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

function LineupRow({ artist }: { artist: LineupArtist }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${C.darkBorder}`, cursor: 'default' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, background: hover ? C.red : C.darkCard, border: `1px solid ${hover ? C.red : C.darkBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', transition: 'all 0.2s', position: 'relative' }}>
          {artist.image_url
            ? <Image src={artist.image_url} alt={artist.name} fill style={{ objectFit: 'cover' }} />
            : <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 15, color: hover ? '#fff' : C.darkMuted, textTransform: 'uppercase' }}>{artist.name[0]}</span>
          }
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 20, color: hover ? C.red : C.darkText, textTransform: 'uppercase', letterSpacing: '0.02em', transition: 'color 0.15s' }}>{artist.name}</div>
          {artist.bio && <div style={{ color: C.darkMuted, fontSize: 12, marginTop: 2 }}>{artist.bio}</div>}
        </div>
      </div>
      {artist.time_slot && (
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: C.darkMuted, textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>{artist.time_slot}</div>
      )}
    </div>
  )
}

type RsvpStatus = 'going' | 'maybe' | 'not_going'

function RsvpCard({ event, compact = false }: { event: Event; compact?: boolean }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<RsvpStatus>('going')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, name, email, phone, status, note }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: C.dark, border: `1px solid ${C.darkBorder}`,
    padding: '11px 14px', fontSize: 14, color: C.darkText, fontFamily: 'DM Sans, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }

  if (submitted) {
    return (
      <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 28, color: C.darkText, textTransform: 'uppercase', marginBottom: 8 }}>You&apos;re in</div>
        <div style={{ color: C.darkMuted, fontSize: 14 }}>
          {status === 'going' ? 'See you there.' : status === 'maybe' ? 'Hope you can make it.' : 'Maybe next time.'}
        </div>
      </div>
    )
  }

  const statusOpts: { value: RsvpStatus; label: string }[] = [
    { value: 'going', label: 'Going' },
    { value: 'maybe', label: 'Maybe' },
    { value: 'not_going', label: "Can't Go" },
  ]

  return (
    <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, padding: '24px' }}>
      {event.payment_link && (
        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${C.darkBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 32, color: C.darkText, lineHeight: 1 }}>
              {event.suggested_price != null ? `$${event.suggested_price}` : 'Free'}
              {event.suggested_price != null && <span style={{ fontSize: 15, color: C.darkMuted, fontWeight: 700 }}> suggested</span>}
            </div>
          </div>
          <a
            href={event.payment_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: C.red, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 17, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '17px', textDecoration: 'none' }}
          >
            Pay Cover
          </a>
        </div>
      )}

      <SecLabel>RSVP</SecLabel>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Name *" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input placeholder="Phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />

        <div style={{ display: 'flex', borderBottom: `1px solid ${C.darkBorder}`, marginBottom: 4 }}>
          {statusOpts.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 4px', marginBottom: -1, color: status === opt.value ? C.darkText : C.darkMuted, borderBottom: status === opt.value ? `2px solid ${C.red}` : '2px solid transparent', transition: 'color 0.15s' }}
            >{opt.label}</button>
          ))}
        </div>

        {!compact && (
          <textarea
            placeholder="Leave a note (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'none' }}
          />
        )}

        {error && <div style={{ color: C.red, fontSize: 13 }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{ background: loading ? C.darkMuted : C.red, color: '#fff', border: 'none', padding: '15px', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 16, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Sending...' : 'RSVP Now'}
        </button>
      </form>
    </div>
  )
}

function RsvpSheet({ event, onClose }: { event: Event; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: C.dark, borderTop: `1px solid ${C.darkBorder}`, padding: '0 20px 40px', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.35s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 8px' }}>
          <div style={{ width: 36, height: 4, background: C.darkBorder, borderRadius: 2 }} />
        </div>
        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 20, textTransform: 'uppercase', color: C.darkText, marginBottom: 20 }}>RSVP</div>
        <RsvpCard event={event} compact />
        <button onClick={onClose} style={{ marginTop: 12, width: '100%', background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkMuted, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '13px' }}>Cancel</button>
      </div>
    </div>
  )
}

export default function EventPageClient({ event, lineup }: { event: Event; lineup: LineupArtist[] }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [heroRef, heroVisible] = useInView()
  const [bodyRef, bodyVisible] = useInView()

  const dateStr = formatDate(event.date)
  const timeStr = formatTime(event.date)
  const endTimeStr = event.end_date ? formatTime(event.end_date) : null

  return (
    <div style={{ minHeight: '100vh', background: C.dark }}>

      {/* Hero */}
      <div className="ep-hero">
        {event.image_url ? (
          <Image src={event.image_url} alt={event.title} fill style={{ objectFit: 'cover', objectPosition: 'center 30%' }} priority />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(45deg, #252220 0px, #252220 1px, #1c1917 1px, #1c1917 22px)` }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(28,25,23,0.1) 0%, rgba(28,25,23,0.65) 60%, #1c1917 100%)' }} />
        <div ref={heroRef} style={{ position: 'absolute', bottom: 28, left: 48, display: 'flex', gap: 6, flexWrap: 'wrap', opacity: heroVisible ? 1 : 0, transition: 'opacity 0.6s ease' }} className="ep-hero-tags">
          {event.tags?.map(tag => (
            <span key={tag} style={{ background: 'rgba(17,17,16,0.75)', backdropFilter: 'blur(8px)', border: `1px solid ${C.darkBorder}`, color: 'rgba(240,236,230,0.6)', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px' }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div ref={bodyRef} className="ep-body" style={{ opacity: bodyVisible ? 1 : 0, transform: bodyVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>

        {/* LEFT */}
        <div style={{ paddingTop: 40 }}>

          <div style={{ marginBottom: 28 }}>
            <Link href="/" style={{ color: C.darkMuted, textDecoration: 'none', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 20 }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              All Events
            </Link>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.red, marginBottom: 10 }}>Shameless Presents</div>
            <h1 style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(44px, 7vw, 80px)', lineHeight: 0.88, color: C.darkText, textTransform: 'uppercase', marginBottom: 20 }}>
              {event.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="11" rx="1" stroke={C.red} strokeWidth="1.4" /><path d="M5 2V5M11 2V5M2 8H14" stroke={C.red} strokeWidth="1.4" strokeLinecap="round" /></svg>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 'clamp(16px, 2.5vw, 21px)', color: C.red }}>
                {dateStr} &bull; {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ''}
              </div>
            </div>
            {event.venue && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="6" r="3" stroke={C.darkMuted} strokeWidth="1.3" /><path d="M7 1C4.24 1 2 3.24 2 6c0 3.5 5 8 5 8s5-4.5 5-8c0-2.76-2.24-5-5-5Z" stroke={C.darkMuted} strokeWidth="1.3" /></svg>
                <span style={{ color: C.darkMuted, fontSize: 14 }}>{event.venue}{event.address ? ` · ${event.address}` : ''}</span>
              </div>
            )}
          </div>

          <Divider />

          <div>
            <SecLabel>About</SecLabel>
            <MetaRow icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" /><path d="M8 5V8.5L10 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>}>
              Doors open at <strong style={{ color: C.darkText }}>{timeStr}</strong>
            </MetaRow>
            {event.description && (
              <div style={{ color: C.darkMuted, fontSize: 15, lineHeight: 1.75, marginTop: 16 }}>{event.description}</div>
            )}
          </div>

          {lineup.length > 0 && (
            <>
              <Divider />
              <div>
                <SecLabel>Lineup</SecLabel>
                {lineup.map(a => <LineupRow key={a.id} artist={a} />)}
              </div>
            </>
          )}

          {event.venue && (
            <>
              <Divider />
              <div>
                <SecLabel>Venue</SecLabel>
                <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 26, color: C.darkText, textTransform: 'uppercase', marginBottom: 4 }}>{event.venue}</div>
                {event.address && <div style={{ color: C.darkMuted, fontSize: 14, marginBottom: 18 }}>{event.address}</div>}
                {event.address && (
                  <div style={{ marginBottom: 20 }}>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkText, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 18px', textDecoration: 'none' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M6.5 12S1 7.686 1 4.5a5.5 5.5 0 1 1 11 0C12 7.686 6.5 12 6.5 12Z" stroke="currentColor" strokeWidth="1.4" /><circle cx="6.5" cy="4.5" r="1.75" stroke="currentColor" strokeWidth="1.4" /></svg>
                      Open in Maps
                    </a>
                  </div>
                )}
                <div style={{ width: '100%', height: 200, background: C.darkCard, border: `1px solid ${C.darkBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(0deg, ${C.darkBorder} 0, ${C.darkBorder} 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, ${C.darkBorder} 0, ${C.darkBorder} 1px, transparent 1px, transparent 32px)` }} />
                  <div style={{ position: 'relative', textAlign: 'center' }}>
                    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" style={{ display: 'block', margin: '0 auto 8px' }}>
                      <path d="M14 26S3 17.372 3 10a11 11 0 1 1 22 0c0 7.372-11 16-11 16Z" stroke={C.red} strokeWidth="1.8" fill={C.redMuted} />
                      <circle cx="14" cy="10" r="3.5" stroke={C.red} strokeWidth="1.8" />
                    </svg>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.darkMuted }}>{event.venue} · Seattle</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT — hidden on mobile via CSS */}
        <div className="ep-sidebar">
          <div style={{ position: 'sticky', top: 80 }}>
            <RsvpCard event={event} />
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              {['Share', 'Save'].map(l => (
                <button key={l} style={{ flex: 1, background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkText, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 0' }}>
                  {l}
                </button>
              ))}
            </div>
            {lineup.filter(a => a.sort_order === 0).length > 0 && (
              <div style={{ marginTop: 20, background: C.darkCard, border: `1px solid ${C.darkBorder}`, padding: '20px 22px' }}>
                <SecLabel>Headliner</SecLabel>
                {lineup.filter(a => a.sort_order === 0).map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, background: C.dark, border: `1px solid ${C.darkBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                      {a.image_url
                        ? <Image src={a.image_url} alt={a.name} fill style={{ objectFit: 'cover' }} />
                        : <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 16, color: C.darkMuted, textTransform: 'uppercase' }}>{a.name[0]}</span>
                      }
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 17, color: C.darkText, textTransform: 'uppercase' }}>{a.name}</div>
                      {a.bio && <div style={{ color: C.darkMuted, fontSize: 12 }}>{a.bio}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile RSVP card — shown only on mobile via CSS, below content */}
      <div className="ep-mobile-rsvp">
        <RsvpCard event={event} />
      </div>

      {/* Mobile sticky bar — always rendered, shown via CSS */}
      <div className="ep-mobile-bar">
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 20, color: C.darkText, lineHeight: 1 }}>
            {event.suggested_price != null ? `$${event.suggested_price} suggested` : 'Free entry'}
          </div>
          <div style={{ color: C.darkMuted, fontSize: 12, marginTop: 2 }}>{event.venue || 'Seattle'}</div>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          style={{ background: C.red, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '14px 28px', flexShrink: 0 }}
        >RSVP</button>
      </div>

      {sheetOpen && <RsvpSheet event={event} onClose={() => setSheetOpen(false)} />}

      {/* Footer */}
      <footer style={{ background: C.darkDeep, borderTop: `1px solid ${C.darkBorder}` }} className="ep-footer">
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Link href="/" style={{ color: C.darkMuted, textDecoration: 'none', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 16, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Simply Shameless</Link>
          <div style={{ color: 'rgba(240,236,230,0.2)', fontFamily: 'DM Sans, sans-serif', fontSize: 12 }}>© 2025 Simply Shameless Productions</div>
        </div>
      </footer>

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .ep-hero {
          position: relative;
          height: 420px;
          overflow: hidden;
          margin-top: 60px;
        }

        .ep-body {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 48px 60px;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 60px;
          align-items: start;
        }

        .ep-sidebar { padding-top: 40px; }
        .ep-mobile-rsvp { display: none; }
        .ep-mobile-bar { display: none; }
        .ep-footer { padding: 36px 48px; }

        @media (max-width: 768px) {
          .ep-hero { height: 260px; }
          .ep-hero-tags { left: 20px !important; bottom: 20px !important; }
          .ep-body { grid-template-columns: 1fr; gap: 0; padding: 0 20px 120px; }
          .ep-sidebar { display: none; }
          .ep-mobile-rsvp { display: block; padding: 0 20px 40px; }
          .ep-mobile-bar {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 150;
            background: rgba(17,17,16,0.97);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255,255,255,0.07);
            padding: 14px 20px;
            align-items: center;
            gap: 16px;
          }
          .ep-footer { padding: 36px 20px; }
        }
      `}</style>
    </div>
  )
}
