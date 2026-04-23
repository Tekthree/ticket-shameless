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

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible] as const
}

function fmt(dateStr: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleDateString('en-US', opts)
}
function fmtTime(dateStr: string) {
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

function OutlineBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1,
        background: 'transparent',
        border: `1px solid ${hover ? C.red : C.darkBorder}`,
        color: hover ? C.red : C.darkText,
        cursor: 'pointer',
        fontFamily: 'var(--font-barlow), sans-serif',
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '10px 0',
        transition: 'border-color 0.2s, color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        ...style,
      }}
    >{children}</button>
  )
}

// ── TICKET BOX ───────────────────────────────────────────────────────────────

function TicketBox({ event, sticky = false }: { event: Event; sticky?: boolean }) {
  const [hover, setHover] = useState(false)

  if (!event.payment_link) return null

  return (
    <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, padding: '24px', ...(sticky ? { position: 'sticky', top: 84 } : {}) }}>
      <SecLabel>Tickets</SecLabel>
      <a
        href={event.payment_link}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          width: '100%',
          background: hover ? C.redDeep : C.red,
          color: '#fff',
          fontFamily: 'var(--font-barlow), sans-serif',
          fontWeight: 900,
          fontSize: 18,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          padding: '18px',
          textDecoration: 'none',
          marginBottom: 12,
          transition: 'background 0.2s',
        }}
      >
        Get Tickets
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: C.darkMuted, fontSize: 12 }}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M10 2L2 10M6 2h4v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Forwarded to Eventbrite
      </div>
    </div>
  )
}

// ── MOBILE TICKET BAR ────────────────────────────────────────────────────────

function MobileTicketBar({ event }: { event: Event }) {
  const [hover, setHover] = useState(false)
  const dateStr = fmt(event.date, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()

  if (!event.payment_link) return null

  return (
    <div className="ep-mobile-bar">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 15, color: C.darkText, textTransform: 'uppercase', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
        <div style={{ color: C.darkMuted, fontSize: 12, marginTop: 3 }}>{dateStr}</div>
      </div>
      <a
        href={event.payment_link}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ background: hover ? C.redDeep : C.red, color: '#fff', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '14px 28px', flexShrink: 0, textDecoration: 'none', transition: 'background 0.2s' }}
      >Get Tickets</a>
    </div>
  )
}

// ── LINEUP ────────────────────────────────────────────────────────────────

function LineupArtistRow({ artist }: { artist: LineupArtist }) {
  const [hover, setHover] = useState(false)
  const isHeadliner = artist.sort_order === 0 || artist.sort_order === 1
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${C.darkBorder}`, cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, background: hover ? C.red : C.darkCard, border: `1px solid ${hover ? C.red : C.darkBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative', transition: 'all 0.2s' }}>
          {artist.image_url
            ? <Image src={artist.image_url} alt={artist.name} fill style={{ objectFit: 'cover' }} />
            : <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 15, color: hover ? '#fff' : C.darkMuted, textTransform: 'uppercase' }}>{artist.name[0]}</span>
          }
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: isHeadliner ? 900 : 700, fontSize: isHeadliner ? 22 : 19, color: hover ? C.red : C.darkText, textTransform: 'uppercase', letterSpacing: '0.02em', transition: 'color 0.15s' }}>{artist.name}</div>
          {isHeadliner && <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.red, marginTop: 1 }}>Headliner</div>}
        </div>
      </div>
      {artist.time_slot && (
        <div style={{ fontSize: 13, color: C.darkMuted, textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>{artist.time_slot}</div>
      )}
    </div>
  )
}

function LineupSection({ lineup }: { lineup: LineupArtist[] }) {
  const stages = Array.from(new Set(lineup.map(a => a.stage).filter(Boolean))) as string[]
  const stageLabels: Record<string, string> = { main: 'Main Room', back: 'Back Room', rooftop: 'Rooftop Stage', loft: 'Loft Stage' }
  const hasStages = stages.length > 1

  const [activeStage, setActiveStage] = useState(stages[0] ?? 'main')
  const visibleArtists = hasStages ? lineup.filter(a => a.stage === activeStage) : lineup

  return (
    <div>
      <SecLabel>Lineup</SecLabel>
      {hasStages && (
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.darkBorder}`, marginBottom: 4 }}>
          {stages.map(s => (
            <button
              key={s}
              onClick={() => setActiveStage(s)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase', color: activeStage === s ? C.darkText : C.darkMuted, padding: '10px 24px 12px', marginBottom: -1, borderBottom: activeStage === s ? `2px solid ${C.red}` : '2px solid transparent', transition: 'all 0.15s' }}
            >{stageLabels[s] ?? s}</button>
          ))}
        </div>
      )}
      {visibleArtists.map(a => <LineupArtistRow key={a.id} artist={a} />)}
    </div>
  )
}

// ── OTHER EVENT CARD ─────────────────────────────────────────────────────

function OtherEventCard({ event }: { event: Event }) {
  const [hover, setHover] = useState(false)
  const dateStr = fmt(event.date, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
  return (
    <Link href={`/events/${event.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ background: C.darkCard, border: `1px solid ${hover ? C.red : C.darkBorder}`, padding: '18px', cursor: 'pointer', transition: 'border-color 0.15s', height: '100%' }}
      >
        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.red, marginBottom: 5 }}>{dateStr}</div>
        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 20, color: C.darkText, textTransform: 'uppercase', lineHeight: 1, marginBottom: 4 }}>{event.title}</div>
        <div style={{ color: C.darkMuted, fontSize: 13, marginBottom: 14 }}>{event.venue} · Seattle</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 18, color: C.darkText }}>
            {event.suggested_price != null ? `$${event.suggested_price}` : 'Free'}
          </div>
          <span style={{ background: C.red, color: '#fff', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px' }}>Tickets</span>
        </div>
      </div>
    </Link>
  )
}

// ── RSVP ─────────────────────────────────────────────────────────────────────

function rsvpKey(eventId: string) { return `ss_rsvp_${eventId}` }

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.12)',
  color: '#f0ece6',
  fontSize: 16,
  padding: '8px 0',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

function FormField({ label, value, onChange, placeholder, type, required, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; multiline?: boolean
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.darkMuted, marginBottom: 8 }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </div>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...inputBase, resize: 'none', lineHeight: 1.5 }} />
        : <input type={type ?? 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputBase} />
      }
    </div>
  )
}

const RSVP_STATUSES = [
  { key: 'going' as const, label: 'Going', emoji: '👍' },
  { key: 'maybe' as const, label: 'Maybe', emoji: '🤔' },
  { key: 'not_going' as const, label: "Can't Go", emoji: '😢' },
]

function RSVPModal({ event, onClose, onSuccess }: {
  event: Event;
  onClose: () => void;
  onSuccess: (name: string, status: 'going' | 'maybe' | 'not_going') => void;
}) {
  const [status, setStatus] = useState<'going' | 'maybe' | 'not_going'>('going')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [attendeeCount, setAttendeeCount] = useState(1)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleSubmit() {
    if (!name.trim()) { setError('Name is required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, name: name.trim(), phone, status, note: message || null, attendee_count: attendeeCount }),
      })
      if (!res.ok) throw new Error()
      localStorage.setItem(rsvpKey(event.id), JSON.stringify({ name: name.trim(), status }))
      onSuccess(name.trim(), status)
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', background: C.dark, borderTop: `1px solid ${C.darkBorder}`, padding: '0 24px 48px', maxHeight: '92vh', overflowY: 'auto', animation: 'slideUp 0.35s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 24px' }}>
          <div style={{ width: 36, height: 4, background: C.darkBorder, borderRadius: 2 }} />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
          {RSVP_STATUSES.map(s => (
            <button
              key={s.key}
              onClick={() => setStatus(s.key)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 0 }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: status === s.key ? C.red : C.darkCard,
                border: `2px solid ${status === s.key ? C.red : C.darkBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, transition: 'all 0.2s',
                boxShadow: status === s.key ? `0 0 0 4px ${C.redMuted}` : 'none',
              }}>{s.emoji}</div>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: status === s.key ? C.darkText : C.darkMuted, transition: 'color 0.2s' }}>{s.label}</div>
            </button>
          ))}
        </div>

        <FormField label="Your Name" value={name} onChange={setName} placeholder="First and last" required />
        <FormField label="Phone Number" value={phone} onChange={setPhone} placeholder="For event updates. No spam." type="tel" />

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.darkMuted, marginBottom: 8 }}>Attendees</div>
          <select
            value={attendeeCount}
            onChange={e => setAttendeeCount(Number(e.target.value))}
            style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, color: C.darkText, fontSize: 15, padding: '10px 14px', outline: 'none', width: '100%', fontFamily: 'inherit' }}
          >
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'attendee' : 'attendees'}</option>
            ))}
          </select>
        </div>

        <FormField label="Your Message" value={message} onChange={setMessage} placeholder="Can't wait!" multiline />
        <div style={{ color: C.darkMuted, fontSize: 12, marginBottom: 24 }}>Your comment will be posted on this page</div>

        {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', background: loading ? C.darkCard : C.red, color: '#fff', border: 'none', cursor: loading ? 'default' : 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 17, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '17px', marginBottom: 12, transition: 'background 0.2s' }}
        >{loading ? 'Sending...' : 'Continue'}</button>

        <button
          onClick={onClose}
          style={{ width: '100%', background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkMuted, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '13px' }}
        >Cancel</button>
      </div>
    </div>
  )
}

type RsvpCounts = { going: number; maybe: number; not_going: number }
type CommentRow = { id: string; name: string; message: string; created_at: string }

function RSVPSection({ event, onOpenModal, myRsvp }: {
  event: Event;
  onOpenModal: () => void;
  myRsvp: { name: string; status: string } | null;
}) {
  const [counts, setCounts] = useState<RsvpCounts>({ going: 0, maybe: 0, not_going: 0 })

  useEffect(() => {
    fetch(`/api/rsvp?event_id=${event.id}`)
      .then(r => r.json())
      .then(d => setCounts(d.counts ?? { going: 0, maybe: 0, not_going: 0 }))
      .catch(() => {})
  }, [event.id, myRsvp?.status])

  const statusLabel: Record<string, string> = {
    going: "You're going",
    maybe: "You might go",
    not_going: "You can't make it",
  }
  const avatarColors = ['#3d2b2b', '#2b3d2b', '#2b2b3d', '#3d3b2b', '#3d2b3a']

  return (
    <div>
      <SecLabel>Guest List</SecLabel>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        {counts.going > 0 && (
          <div style={{ display: 'flex' }}>
            {Array.from({ length: Math.min(counts.going, 5) }).map((_, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: avatarColors[i % avatarColors.length],
                border: `2px solid ${C.dark}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: i > 0 ? -10 : 0,
                fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 12, color: C.darkMuted,
              }}>?</div>
            ))}
          </div>
        )}
        <div style={{ color: C.darkMuted, fontSize: 14 }}>
          {counts.going > 0 ? <span style={{ color: C.darkText, fontWeight: 600 }}>{counts.going}</span> : '0'} Going
          {counts.maybe > 0 && <> &middot; <span style={{ color: C.darkText, fontWeight: 600 }}>{counts.maybe}</span> Maybe</>}
        </div>
      </div>

      {myRsvp ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.darkCard, border: `1px solid ${C.darkBorder}`, padding: '14px 18px' }}>
          <div style={{ color: C.darkText, fontSize: 14 }}>{statusLabel[myRsvp.status] ?? "You RSVPd"}</div>
          <button onClick={onOpenModal} style={{ background: 'transparent', border: 'none', color: C.darkMuted, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Change</button>
        </div>
      ) : (
        <>
          <button
            onClick={onOpenModal}
            style={{ width: '100%', background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkText, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px', transition: 'border-color 0.2s' }}
          >RSVP</button>
          <div style={{ marginTop: 10, color: C.darkMuted, fontSize: 13 }}>RSVP to see who else is going.</div>
        </>
      )}
    </div>
  )
}

function CommentsSection({ event, myRsvp, onOpenModal }: {
  event: Event;
  myRsvp: { name: string; status: string } | null;
  onOpenModal: () => void;
}) {
  const [comments, setComments] = useState<CommentRow[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [posting, setPosting] = useState(false)

  function loadComments() {
    fetch(`/api/comment?event_id=${event.id}`)
      .then(r => r.json())
      .then(d => setComments(Array.isArray(d) ? d : []))
      .catch(() => {})
  }

  useEffect(() => { loadComments() }, [event.id, myRsvp?.status])

  async function handlePost() {
    if (!newMsg.trim() || !myRsvp) return
    setPosting(true)
    try {
      await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, name: myRsvp.name, message: newMsg.trim() }),
      })
      setNewMsg('')
      loadComments()
    } finally {
      setPosting(false)
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div>
      <SecLabel>Message Board</SecLabel>

      {!myRsvp ? (
        <div style={{ position: 'relative', minHeight: 120 }}>
          {comments.slice(0, 2).map(c => (
            <div key={c.id} style={{ padding: '14px 0', borderBottom: `1px solid ${C.darkBorder}`, filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.darkCard, border: `1px solid ${C.darkBorder}`, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 14, color: C.darkText }}>Someone</div>
                  <div style={{ color: C.darkMuted, fontSize: 13, marginTop: 3 }}>{c.message}</div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(28,25,23,0.85) 40%, #1c1917 100%)', display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ color: C.darkMuted, fontSize: 13, marginBottom: 12 }}>RSVP to see the conversation</div>
              <button onClick={onOpenModal} style={{ background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkText, cursor: 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '10px 24px' }}>RSVP to unlock</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Inline post box */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 14, color: '#fff', textTransform: 'uppercase' }}>
              {myRsvp.name[0]}
            </div>
            <div style={{ flex: 1, borderBottom: `1px solid ${C.darkBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePost()}
                placeholder="Say something..."
                style={{ flex: 1, background: 'transparent', border: 'none', color: C.darkText, fontSize: 15, padding: '8px 0', outline: 'none', fontFamily: 'inherit' }}
              />
              <button
                onClick={handlePost}
                disabled={posting || !newMsg.trim()}
                style={{ background: 'transparent', border: 'none', color: newMsg.trim() ? C.red : C.darkMuted, cursor: newMsg.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 0', transition: 'color 0.15s', flexShrink: 0 }}
              >{posting ? '...' : 'Post'}</button>
            </div>
          </div>

          {comments.length === 0 ? (
            <div style={{ color: C.darkMuted, fontSize: 14, padding: '8px 0' }}>No messages yet. Be the first.</div>
          ) : (
            <div>
              {comments.map(c => (
                <div key={c.id} style={{ padding: '14px 0', borderBottom: `1px solid ${C.darkBorder}` }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.darkCard, border: `1px solid ${C.darkBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 14, color: C.darkMuted, textTransform: 'uppercase' }}>
                      {c.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 14, color: C.darkText }}>{c.name}</span>
                        <span style={{ color: C.darkMuted, fontSize: 12 }}>{timeAgo(c.created_at)}</span>
                      </div>
                      <div style={{ color: C.darkMuted, fontSize: 14, lineHeight: 1.5 }}>{c.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── PAGE ─────────────────────────────────────────────────────────────────

export default function EventPageClient({ event, lineup, otherEvents }: { event: Event; lineup: LineupArtist[]; otherEvents: Event[] }) {
  const [heroRef, heroVisible] = useInView()
  const [bodyRef, bodyVisible] = useInView(0.02)
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false)
  const [myRsvp, setMyRsvp] = useState<{ name: string; status: string } | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem(rsvpKey(event.id))
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const dateStr = fmt(event.date, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
  const timeStr = fmtTime(event.date)
  const endTimeStr = event.end_date ? fmtTime(event.end_date) : null
  const headliners = lineup.filter(a => a.sort_order === 0 || a.sort_order === 1)

  // Split title on " × " for outline effect on second part
  const titleParts = event.title.includes(' × ') ? event.title.split(' × ') : null

  // Figure out stages for the "Two stages" meta row
  const stages = Array.from(new Set(lineup.map(a => a.stage).filter(Boolean))) as string[]
  const stageLabels: Record<string, string> = { main: 'Main Room', back: 'Back Room', rooftop: 'Rooftop', loft: 'Loft' }
  const stagesLabel = stages.length > 1 ? stages.map(s => stageLabels[s] ?? s).join(' + ') : null

  return (
    <div style={{ minHeight: '100vh', background: C.dark }}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="ep-hero">
        {event.image_url ? (
          <Image src={event.image_url} alt={event.title} fill style={{ objectFit: 'cover', objectPosition: 'center 30%' }} priority />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, #252220 0px, #252220 1px, #1c1917 1px, #1c1917 22px)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(28,25,23,0.1) 0%, rgba(28,25,23,0.65) 60%, #1c1917 100%)' }} />
        <div ref={heroRef} className="ep-hero-tags" style={{ position: 'absolute', bottom: 28, display: 'flex', gap: 6, flexWrap: 'wrap', opacity: heroVisible ? 1 : 0, transition: 'opacity 0.6s ease' }}>
          {event.tags?.map(tag => (
            <span key={tag} style={{ background: 'rgba(17,17,16,0.75)', backdropFilter: 'blur(8px)', border: `1px solid ${C.darkBorder}`, color: 'rgba(240,236,230,0.6)', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px' }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* ── MAIN GRID ────────────────────────────────────────────────── */}
      <div ref={bodyRef} className="ep-body" style={{ opacity: bodyVisible ? 1 : 0, transform: bodyVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>

        {/* ── LEFT COLUMN ────────────────────────────────────────────── */}
        <div style={{ paddingTop: 40 }}>

          {/* Title block */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.red, marginBottom: 10 }}>Shameless Presents</div>
            <h1 style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(44px, 7vw, 80px)', lineHeight: 0.88, color: C.darkText, textTransform: 'uppercase', marginBottom: 16 }}>
              {titleParts ? (
                <>
                  {titleParts[0]}<br />
                  <span style={{ WebkitTextStroke: `2px ${C.darkText}`, color: 'transparent' }}>× {titleParts[1]}</span>
                </>
              ) : event.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="11" rx="1" stroke={C.red} strokeWidth="1.4" /><path d="M5 2V5M11 2V5M2 8H14" stroke={C.red} strokeWidth="1.4" strokeLinecap="round" /></svg>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 'clamp(17px, 2.5vw, 22px)', color: C.red }}>
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

          {/* Mobile share row */}
          <div className="ep-share-mobile">
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <OutlineBtn>Share</OutlineBtn>
              <OutlineBtn>Save</OutlineBtn>
              <OutlineBtn>♡ 142</OutlineBtn>
            </div>
          </div>

          <Divider />

          {/* About */}
          <div>
            <SecLabel>About</SecLabel>
            <MetaRow icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" /><path d="M8 5V8.5L10 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>}>
              Doors open at <strong style={{ color: C.darkText }}>{timeStr}</strong>{endTimeStr ? <> · Show ends <strong style={{ color: C.darkText }}>{endTimeStr}</strong></> : null}
            </MetaRow>
            <MetaRow icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1a4 4 0 1 1 0 8A4 4 0 0 1 8 1ZM2 15c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>}>
              All ages
            </MetaRow>
            <MetaRow icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8Z" stroke="currentColor" strokeWidth="1.3" /><path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>}>
              Presented by Simply Shameless
            </MetaRow>
            {stagesLabel && (
              <MetaRow icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 14s-6-4.686-6-8a6 6 0 1 1 12 0c0 3.314-6 8-6 8Z" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="6" r="2" stroke="currentColor" strokeWidth="1.3" /></svg>}>
                {stages.length} stages: {stagesLabel}
              </MetaRow>
            )}
            {event.description && (
              <div style={{ color: C.darkMuted, fontSize: 15, lineHeight: 1.75, marginTop: 8 }}>{event.description}</div>
            )}
          </div>

          {/* RSVP */}
          <Divider />
          <RSVPSection event={event} onOpenModal={() => setRsvpModalOpen(true)} myRsvp={myRsvp} />

          {/* Lineup */}
          {lineup.length > 0 && (
            <>
              <Divider />
              <LineupSection lineup={lineup} />
            </>
          )}

          {/* Venue */}
          {event.venue && (
            <>
              <Divider />
              <div>
                <SecLabel>Venue</SecLabel>
                <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 26, color: C.darkText, textTransform: 'uppercase', marginBottom: 4 }}>{event.venue}</div>
                {event.address && <div style={{ color: C.darkMuted, fontSize: 14, marginBottom: 18 }}>{event.address}</div>}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  {event.address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline-link"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${C.darkBorder}`, color: C.darkText, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 18px', textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M6.5 12S1 7.686 1 4.5a5.5 5.5 0 1 1 11 0C12 7.686 6.5 12 6.5 12Z" stroke="currentColor" strokeWidth="1.4" /><circle cx="6.5" cy="4.5" r="1.75" stroke="currentColor" strokeWidth="1.4" /></svg>
                      Open in Maps
                    </a>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.darkMuted, fontSize: 13 }}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" /><path d="M7 4V7.5L9 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    Doors open {timeStr}
                  </div>
                </div>
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

          {/* Message Board */}
          <Divider />
          <CommentsSection event={event} myRsvp={myRsvp} onOpenModal={() => setRsvpModalOpen(true)} />

          {/* More from Simply Shameless */}
          {otherEvents.length > 0 && (
            <>
              <Divider />
              <div>
                <SecLabel>More from Simply Shameless</SecLabel>
                <div className="ep-more-grid">
                  {otherEvents.map(e => <OtherEventCard key={e.id} event={e} />)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT SIDEBAR (desktop) ───────────────────────────────── */}
        <div className="ep-sidebar" style={{ paddingTop: 40 }}>
          <TicketBox event={event} sticky />
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <OutlineBtn>Share</OutlineBtn>
            <OutlineBtn>Save</OutlineBtn>
            <OutlineBtn>♡ 142</OutlineBtn>
          </div>
          {headliners.length > 0 && (
            <div style={{ marginTop: 20, background: C.darkCard, border: `1px solid ${C.darkBorder}`, padding: '20px 22px' }}>
              <SecLabel>{headliners.length > 1 ? 'Headliners' : 'Headliner'}</SecLabel>
              {headliners.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: i < headliners.length - 1 ? 14 : 0 }}>
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

      {/* Mobile sticky bar */}
      <MobileTicketBar event={event} />

      {rsvpModalOpen && (
        <RSVPModal
          event={event}
          onClose={() => setRsvpModalOpen(false)}
          onSuccess={(name, status) => {
            setMyRsvp({ name, status })
            setRsvpModalOpen(false)
          }}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .ep-hero {
          position: relative;
          height: 420px;
          overflow: hidden;
          margin-top: 64px;
        }
        .ep-hero-tags {
          left: 48px;
          bottom: 28px;
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

        .ep-sidebar { display: block; }
        .ep-share-mobile { display: none; }
        .ep-more-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }

        .ep-mobile-bar { display: none; }

        .btn-outline-link:hover { border-color: #c9321a !important; color: #c9321a !important; }

        @media (max-width: 768px) {
          .ep-hero { height: 260px; margin-top: 64px; }
          .ep-hero-tags { left: 20px; bottom: 20px; }

          .ep-body {
            grid-template-columns: 1fr;
            gap: 0;
            padding: 0 20px 120px;
          }

          .ep-body > div:first-child { padding-top: 28px; }

          .ep-sidebar { display: none; }
          .ep-share-mobile { display: block; margin-bottom: 8px; }
          .ep-more-grid { grid-template-columns: 1fr; }

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
            animation: slideUp 0.35s cubic-bezier(0.22,1,0.36,1);
          }
        }
      ` }} />
    </div>
  )
}
