'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import type { Event, LineupArtist } from '@/lib/db'

const RED = '#c9321a'
const DARK = '#1c1917'
const CREAM = '#f2ede5'

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible] as const
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
}

function formatEventTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

type RsvpStatus = 'going' | 'maybe' | 'not_going'

function RsvpForm({ eventId }: { eventId: string }) {
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
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, name, email, phone, status, note }),
      })
      if (!res.ok) throw new Error('Failed')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 28, color: DARK, textTransform: 'uppercase', marginBottom: 10 }}>
          You&apos;re in
        </div>
        <div style={{ color: '#8a8078', fontSize: 15 }}>
          {status === 'going' ? "See you there." : status === 'maybe' ? "Hope you can make it." : "Maybe next time."}
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fff', border: '1px solid rgba(28,25,23,0.15)',
    padding: '12px 14px', fontSize: 15, color: DARK, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  }

  const statusOptions: { value: RsvpStatus; label: string }[] = [
    { value: 'going', label: 'Going' },
    { value: 'maybe', label: 'Maybe' },
    { value: 'not_going', label: "Can't Make It" },
  ]

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        placeholder="Name *"
        value={name}
        onChange={e => setName(e.target.value)}
        style={inputStyle}
        required
      />
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="Phone"
        type="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        style={inputStyle}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        {statusOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            style={{
              flex: 1, padding: '10px 4px', fontSize: 13, cursor: 'pointer',
              fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800,
              letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none',
              background: status === opt.value ? DARK : CREAM,
              color: status === opt.value ? '#fff' : '#8a8078',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <textarea
        placeholder="Leave a note (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={2}
        style={{ ...inputStyle, resize: 'none' }}
      />

      {error && <div style={{ color: RED, fontSize: 13 }}>{error}</div>}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? '#8a8078' : RED,
          color: '#fff', border: 'none', padding: '15px',
          fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900,
          fontSize: 15, letterSpacing: '0.18em', textTransform: 'uppercase',
          cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
        }}
      >
        {loading ? 'Sending...' : 'RSVP'}
      </button>
    </form>
  )
}

export default function EventPageClient({
  event,
  lineup,
}: {
  event: Event
  lineup: LineupArtist[]
}) {
  const [heroRef, heroVisible] = useInView()
  const [detailsRef, detailsVisible] = useInView()

  const dateStr = formatEventDate(event.date)
  const timeStr = formatEventTime(event.date)

  return (
    <div style={{ background: DARK, minHeight: '100vh', color: '#fff' }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 'clamp(360px, 55vw, 600px)', overflow: 'hidden' }}>
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            style={{ objectFit: 'cover', filter: 'brightness(0.45)' }}
            priority
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, #2a2520 0px, #2a2520 1px, #1c1917 1px, #1c1917 18px)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #1c1917 0%, transparent 60%)' }} />

        <div ref={heroRef} style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 56px 48px',
          maxWidth: 1200, margin: '0 auto',
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
          <Link href="/" style={{ color: '#8a8078', textDecoration: 'none', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', display: 'inline-block', marginBottom: 20 }}>
            ← Back
          </Link>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 13, letterSpacing: '0.22em', color: RED, textTransform: 'uppercase', marginBottom: 10 }}>
            {dateStr}
          </div>
          <h1 style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(42px, 6vw, 88px)', lineHeight: 0.9, textTransform: 'uppercase', color: '#fff', margin: 0 }}>
            {event.title}
          </h1>
        </div>
      </div>

      {/* Body */}
      <div ref={detailsRef} style={{
        maxWidth: 1200, margin: '0 auto', padding: '64px 56px',
        display: 'grid', gridTemplateColumns: '1fr 380px', gap: 64,
        opacity: detailsVisible ? 1 : 0,
        transform: detailsVisible ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        {/* Left */}
        <div>
          {/* Event info */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '0.2em', color: '#8a8078', textTransform: 'uppercase', minWidth: 80 }}>When</span>
                <span style={{ color: CREAM, fontSize: 16 }}>{dateStr} &bull; {timeStr}</span>
              </div>
              {event.venue && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '0.2em', color: '#8a8078', textTransform: 'uppercase', minWidth: 80 }}>Where</span>
                  <span style={{ color: CREAM, fontSize: 16 }}>{event.venue}{event.address ? `, ${event.address}` : ''}</span>
                </div>
              )}
              {event.suggested_price != null && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '0.2em', color: '#8a8078', textTransform: 'uppercase', minWidth: 80 }}>Cover</span>
                  <span style={{ color: CREAM, fontSize: 16 }}>${event.suggested_price} suggested</span>
                </div>
              )}
            </div>
          </div>

          {event.description && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 40 }} />
              <div style={{ marginBottom: 48 }}>
                <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.22em', color: '#8a8078', textTransform: 'uppercase', marginBottom: 20 }}>About</div>
                <p style={{ color: '#c4b8aa', fontSize: 16, lineHeight: 1.75, margin: 0 }}>{event.description}</p>
              </div>
            </>
          )}

          {lineup.length > 0 && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 40 }} />
              <div>
                <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.22em', color: '#8a8078', textTransform: 'uppercase', marginBottom: 24 }}>Lineup</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {lineup.map(artist => (
                    <div key={artist.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 52, height: 52, background: '#2a2520', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                        {artist.image_url ? (
                          <Image src={artist.image_url} alt={artist.name} fill style={{ objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 20, color: '#8a8078' }}>{artist.name[0]}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', color: '#fff' }}>{artist.name}</div>
                        {artist.time_slot && <div style={{ fontSize: 13, color: '#8a8078', marginTop: 2 }}>{artist.time_slot}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {event.tags && event.tags.length > 0 && (
            <div style={{ marginTop: 48, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {event.tags.map(tag => (
                <span key={tag} style={{ background: 'rgba(201,50,26,0.15)', color: RED, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 12px' }}>{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Right — sticky RSVP + payment card */}
        <div>
          <div style={{ position: 'sticky', top: 32 }}>
            {/* Payment link */}
            {event.payment_link && (
              <div style={{ background: '#2a2520', padding: '28px 28px 24px', marginBottom: 2 }}>
                <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.22em', color: '#8a8078', textTransform: 'uppercase', marginBottom: 10 }}>Cover</div>
                <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', marginBottom: 16 }}>
                  {event.suggested_price != null ? `$${event.suggested_price}` : 'Pay what you can'}
                  {event.suggested_price != null && <span style={{ fontSize: 14, color: '#8a8078', fontWeight: 700, marginLeft: 6 }}>suggested</span>}
                </div>
                <a
                  href={event.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center', background: RED, color: '#fff',
                    fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 14,
                    letterSpacing: '0.18em', textTransform: 'uppercase', padding: '14px',
                    textDecoration: 'none',
                  }}
                >
                  Pay Cover →
                </a>
              </div>
            )}

            {/* RSVP */}
            <div style={{ background: CREAM, padding: '28px 28px 32px' }}>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.22em', color: '#8a8078', textTransform: 'uppercase', marginBottom: 18 }}>RSVP</div>
              <RsvpForm eventId={event.id} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .event-body { grid-template-columns: 1fr !important; padding: 40px 24px !important; }
        }
      `}</style>
    </div>
  )
}
