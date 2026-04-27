'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { DJ, Event } from '@/lib/db'

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

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
}

// ── SOCIAL BUTTON ─────────────────────────────────────────────────────────────
function SocialBtn({ label, url, icon }: { label: string; url: string; icon: React.ReactNode }) {
  const [hover, setHover] = useState(false)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'transparent',
        border: `1px solid ${hover ? C.red : C.darkBorder}`,
        color: hover ? C.red : 'rgba(240,236,230,0.6)',
        fontFamily: 'var(--font-barlow), sans-serif',
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '10px 18px',
        textDecoration: 'none',
        transition: 'border-color 0.2s, color 0.2s, transform 0.2s',
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
        flexShrink: 0,
      }}
    >
      {icon}
      {label}
    </a>
  )
}

// ── EVENT ROW ─────────────────────────────────────────────────────────────────
function EventRow({ event }: { event: Event }) {
  const [hover, setHover] = useState(false)
  const isPast = new Date(event.date) < new Date()
  return (
    <Link href={`/events/${event.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '18px 0',
          borderBottom: `1px solid ${C.darkBorder}`,
          transition: 'background 0.15s',
          cursor: 'pointer',
        }}
      >
        <div style={{ width: 4, alignSelf: 'stretch', background: isPast ? C.darkBorder : C.red, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.2em', color: isPast ? C.darkMuted : C.red, textTransform: 'uppercase', marginBottom: 5 }}>
            {fmt(event.date)}
          </div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 22, color: hover ? C.red : C.darkText, textTransform: 'uppercase', lineHeight: 1, marginBottom: 4, transition: 'color 0.15s' }}>
            {event.title}
          </div>
          {event.venue && <div style={{ color: C.darkMuted, fontSize: 14 }}>{event.venue}</div>}
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: hover ? C.red : C.darkBorder, transition: 'color 0.15s' }}>
          <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 12

type Tab = 'upcoming' | 'past'

export default function DJProfileClient({ dj, events }: { dj: DJ; events: Event[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')
  const [pastPage, setPastPage] = useState(1)

  const now = new Date()
  const upcoming = events.filter(e => new Date(e.date) >= now)
  const past = events.filter(e => new Date(e.date) < now)
  const nextShow = upcoming[0] ?? null

  const socials = [
    dj.soundcloud_url && {
      label: 'SoundCloud', url: dj.soundcloud_url,
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 10.5C1 12.43 2.57 14 4.5 14H12a3 3 0 0 0 0-6h-.27A5 5 0 0 0 2 10.5Z" stroke="currentColor" strokeWidth="1.3"/><path d="M1 10.5V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    },
    dj.instagram_url && {
      label: 'Instagram', url: dj.instagram_url,
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/><circle cx="11.5" cy="4.5" r="0.8" fill="currentColor"/></svg>,
    },
    dj.spotify_url && {
      label: 'Spotify', url: dj.spotify_url,
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 10.5c2.5-1 5-0.8 6 0M5 8c3-1.2 6-0.8 6.5 0.5M5.5 5.5c3-1 6.5-0.5 7 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    },
    dj.youtube_url && {
      label: 'YouTube', url: dj.youtube_url,
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 5.5L10.5 8L6.5 10.5V5.5Z" fill="currentColor"/></svg>,
    },
    dj.mixcloud_url && {
      label: 'Mixcloud', url: dj.mixcloud_url,
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 11C2 9.34 3.34 8 5 8C5 5.79 6.79 4 9 4C11.21 4 13 5.79 13 8H13.5C14.33 8 15 8.67 15 9.5S14.33 11 13.5 11H5C3.34 11 2 11 2 11Z" stroke="currentColor" strokeWidth="1.3"/></svg>,
    },
    dj.website_url && {
      label: 'Website', url: dj.website_url,
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.5C8 1.5 6 4 6 8C6 12 8 14.5 8 14.5M8 1.5C8 1.5 10 4 10 8C10 12 8 14.5 8 14.5M1.5 8H14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    },
  ].filter(Boolean) as { label: string; url: string; icon: React.ReactNode }[]

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { key: 'past', label: 'Past Shows', count: past.length },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.dark }}>

      {/* ── HERO — split 2 col ───────────────────────────────────────── */}
      <div style={{ paddingTop: 64, minHeight: 'min(70vh, 600px)', display: 'grid' }} className="djp-hero-grid">

        {/* Left: info */}
        <div style={{ padding: 'clamp(40px, 6vw, 80px) clamp(20px, 4vw, 56px) clamp(36px, 5vw, 60px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>

          {/* Role + location */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
            {dj.is_resident ? (
              <div style={{ background: C.red, color: '#fff', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '5px 12px' }}>
                Shameless Resident
              </div>
            ) : (
              <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, color: C.darkMuted, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '5px 12px' }}>
                Guest
              </div>
            )}
            {dj.location && (
              <div style={{ color: C.darkMuted, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {dj.location}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(52px, 8vw, 108px)',
            lineHeight: 0.88,
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            color: C.darkText,
            margin: '0 0 28px',
          }}>{dj.name}</h1>

          {/* Socials */}
          {socials.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {socials.map(s => <SocialBtn key={s.label} {...s} />)}
            </div>
          )}
        </div>

        {/* Right: photo */}
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 280 }} className="djp-photo-col">
          {dj.profile_image_url ? (
            <Image
              src={dj.profile_image_url}
              alt={dj.name}
              fill
              priority
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(45deg, #252220 0px, #252220 1px, #1c1917 1px, #1c1917 24px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 120, color: 'rgba(255,255,255,0.06)', textTransform: 'uppercase' }}>
                {dj.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </span>
            </div>
          )}
          {/* Gradient fade to left on desktop */}
          <div className="djp-photo-fade" style={{ position: 'absolute', inset: 0 }} />
        </div>
      </div>

      {/* ── EVENTS count bar ─────────────────────────────────────────── */}
      <div style={{ background: C.darkCard, borderTop: `1px solid ${C.darkBorder}`, borderBottom: `1px solid ${C.darkBorder}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px, 4vw, 56px)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {[
            ['Shameless Events', events.length],
            ['Upcoming', upcoming.length],
          ].map(([label, val], i) => (
            <div key={i} style={{ padding: '24px 0', textAlign: 'center', borderRight: i === 0 ? `1px solid ${C.darkBorder}` : 'none' }}>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 36, color: C.red, lineHeight: 1, marginBottom: 4 }}>{val}</div>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.darkMuted }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px, 5vw, 60px) clamp(20px, 4vw, 56px) 80px' }} className="djp-body-grid">

        {/* Left: bio + tabs */}
        <div>
          {/* Bio */}
          {dj.bio && (
            <div style={{ marginBottom: 48 }}>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.red, marginBottom: 16 }}>About</div>
              {dj.bio.split('\n\n').map((p, i) => (
                <p key={i} style={{ color: i === 0 ? C.darkText : C.darkMuted, fontSize: 17, lineHeight: 1.8, fontWeight: 300, marginBottom: 16, margin: '0 0 16px' }}>{p}</p>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{ borderBottom: `1px solid ${C.darkBorder}`, marginBottom: 28, display: 'flex', gap: 28 }}>
            {tabs.map(({ key, label, count }) => (
              <button key={key} onClick={() => { setActiveTab(key); if (key === 'past') setPastPage(1) }} style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: activeTab === key ? C.darkText : 'rgba(240,236,230,0.4)',
                padding: '16px 0',
                position: 'relative',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap',
              }}>
                {label} <span style={{ opacity: 0.5, fontSize: 12 }}>({count})</span>
                <span style={{ position: 'absolute', bottom: 0, left: 0, width: activeTab === key ? '100%' : '0%', height: 2, background: C.red, transition: 'width 0.28s cubic-bezier(0.22,1,0.36,1)' }} />
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'upcoming' && (
            upcoming.length === 0
              ? <div style={{ padding: '32px 0', color: C.darkMuted, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.08em', textTransform: 'uppercase' }}>No upcoming shows</div>
              : upcoming.map(e => <EventRow key={e.id} event={e} />)
          )}

          {activeTab === 'past' && (
            past.length === 0
              ? <div style={{ padding: '32px 0', color: C.darkMuted, fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.08em', textTransform: 'uppercase' }}>No past shows</div>
              : <>
                  {past.slice(0, pastPage * PAGE_SIZE).map(e => <EventRow key={e.id} event={e} />)}
                  {pastPage * PAGE_SIZE < past.length && (
                    <button
                      onClick={() => setPastPage(p => p + 1)}
                      style={{
                        marginTop: 24,
                        width: '100%',
                        background: 'transparent',
                        border: `1px solid ${C.darkBorder}`,
                        color: C.darkMuted,
                        fontFamily: 'var(--font-barlow), sans-serif',
                        fontWeight: 700,
                        fontSize: 13,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, color 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.darkBorder; e.currentTarget.style.color = C.darkMuted }}
                    >
                      Show more ({past.length - pastPage * PAGE_SIZE} remaining)
                    </button>
                  )}
                </>
          )}

          {/* SoundCloud link */}
          {dj.soundcloud_url && (
            <div style={{ marginTop: 32, padding: '20px', border: `1px dashed rgba(201,50,26,0.2)`, textAlign: 'center' }}>
              <a href={dj.soundcloud_url} target="_blank" rel="noopener noreferrer" style={{ color: C.red, textDecoration: 'none', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Listen on SoundCloud ↗
              </a>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div>
          {/* Next show CTA */}
          {nextShow && (
            <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, padding: '24px', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.red, marginBottom: 14 }}>Next Show</div>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.red, marginBottom: 6 }}>
                {fmt(nextShow.date)}
              </div>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 22, color: C.darkText, textTransform: 'uppercase', lineHeight: 1, marginBottom: 6 }}>
                {nextShow.title}
              </div>
              {nextShow.venue && <div style={{ color: C.darkMuted, fontSize: 14, marginBottom: 20 }}>{nextShow.venue}</div>}
              <Link href={`/events/${nextShow.slug}`} style={{
                display: 'block',
                background: C.red,
                color: '#fff',
                textDecoration: 'none',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: 900,
                fontSize: 15,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '15px',
                textAlign: 'center',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = C.redDeep)}
                onMouseLeave={e => (e.currentTarget.style.background = C.red)}
              >Get Tickets</Link>
            </div>
          )}

          {/* Back link */}
          <Link href="/djs" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: C.darkMuted,
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = C.red)}
            onMouseLeave={e => (e.currentTarget.style.color = C.darkMuted)}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            All DJs
          </Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .djp-hero-grid {
          grid-template-columns: 1fr 1fr;
        }
        .djp-photo-col {
          position: relative;
        }
        .djp-photo-fade {
          background: linear-gradient(to right, #1c1917 0%, transparent 30%);
        }
        .djp-body-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 64px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .djp-hero-grid {
            grid-template-columns: 1fr;
          }
          .djp-photo-col {
            min-height: 260px;
            order: -1;
          }
          .djp-photo-fade {
            background: linear-gradient(to bottom, transparent 40%, #1c1917 100%);
          }
          .djp-body-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .djp-body-grid > div:last-child {
            order: -1;
          }
        }
      ` }} />
    </div>
  )
}
