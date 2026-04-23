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
  redMuted: 'rgba(201,50,26,0.12)',
}

function fmt(dateStr: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleDateString('en-US', opts)
}

// ── SOCIAL LINKS ─────────────────────────────────────────────────────────────

type SocialLink = { label: string; url: string; icon: React.ReactNode }

function SoundcloudIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.175 12.225c-.042 0-.08.03-.083.072l-.43 4.145.43 4.083c.003.04.04.07.083.07s.08-.03.082-.072l.488-4.082-.488-4.145c-.002-.042-.04-.072-.082-.072zm1.558-.37c-.05 0-.09.037-.093.085l-.368 4.53.368 4.42c.003.047.043.085.093.085s.09-.038.092-.085l.418-4.42-.418-4.53c-.002-.048-.042-.086-.092-.086zm1.56-.27c-.058 0-.104.044-.106.1l-.307 4.8.307 4.655c.002.056.048.1.107.1.058 0 .104-.044.106-.1l.35-4.655-.35-4.8c-.002-.057-.048-.1-.106-.1zm1.56-.108c-.066 0-.118.05-.12.115l-.246 4.908.246 4.787c.002.065.054.115.12.115.066 0 .118-.05.12-.115l.28-4.787-.28-4.908c-.002-.066-.054-.116-.12-.116zm1.56-.03c-.074 0-.133.057-.135.13l-.185 4.938.185 4.88c.002.073.06.13.135.13.074 0 .133-.057.135-.13l.21-4.88-.21-4.937c-.002-.074-.06-.13-.135-.13zm1.56.01c-.083 0-.148.065-.15.147l-.124 4.928.124 4.9c.002.082.067.147.15.147.082 0 .147-.065.15-.147l.14-4.9-.14-4.928c-.003-.082-.068-.148-.15-.148zm1.56.05c-.09 0-.162.072-.164.163l-.063 4.878.063 4.888c.002.09.074.162.164.162.09 0 .162-.072.164-.162l.07-4.888-.07-4.878c-.002-.09-.074-.162-.164-.162zm1.56.15c-.1 0-.18.08-.18.18l0 4.728 0 4.88c0 .1.08.18.18.18s.18-.08.18-.18l0-4.88 0-4.728c0-.1-.08-.18-.18-.18zm2.5-2.34c-.15-.07-.32-.11-.49-.11-.17 0-.34.04-.49.11-.22-2.5-2.32-4.44-4.87-4.44-2.69 0-4.87 2.18-4.87 4.87 0 .09 0 .18.01.27v9.37c0 .5.4.9.9.9h9.82c.5 0 .9-.4.9-.9v-5.06c.92-.46 1.55-1.41 1.55-2.52 0-1.29-.87-2.38-2.06-2.7z"/>
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function SpotifyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

function MixcloudIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.56 8.87V17h4.52c2.41 0 4.36-1.96 4.36-4.37 0-2.41-1.95-4.36-4.36-4.36-.33 0-.65.04-.96.11-.86-1.6-2.56-2.69-4.51-2.69C7.18 5.69 5 7.87 5 10.61c0 .23.01.46.04.68A3.81 3.81 0 0 0 2 15.1 3.81 3.81 0 0 0 5.81 19h1.14v-2.97H5.81A.84.84 0 0 1 5 15.1c0-.46.37-.83.81-.83l.83-.04-.18-.81a3.46 3.46 0 0 1-.08-.73c0-1.78 1.45-3.23 3.23-3.23 1.23 0 2.32.7 2.87 1.73l-.88.68z"/>
    </svg>
  )
}

function WebIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

function SocialBtn({ link }: { link: SocialLink }) {
  const [hover, setHover] = useState(false)
  return (
    <a
      href={link.url}
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
        color: hover ? C.red : C.darkMuted,
        fontFamily: 'var(--font-barlow), sans-serif',
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '9px 16px',
        textDecoration: 'none',
        transition: 'border-color 0.2s, color 0.2s',
        flexShrink: 0,
      }}
    >
      {link.icon}
      {link.label}
    </a>
  )
}

// ── EVENT CARD ────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: Event }) {
  const [hover, setHover] = useState(false)
  const dateStr = fmt(event.date, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
  const isPast = new Date(event.date) < new Date()

  return (
    <Link href={`/events/${event.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 0',
          borderBottom: `1px solid ${C.darkBorder}`,
          transition: 'all 0.15s',
        }}
      >
        {event.image_url && (
          <div style={{ width: 56, height: 56, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
            <Image src={event.image_url} alt={event.title} fill style={{ objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 900,
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: isPast ? C.darkMuted : C.red,
            marginBottom: 3,
          }}>{dateStr}</div>
          <div style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 800,
            fontSize: 18,
            color: hover ? C.red : C.darkText,
            textTransform: 'uppercase',
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s',
          }}>{event.title}</div>
          {event.venue && (
            <div style={{ color: C.darkMuted, fontSize: 12, marginTop: 3 }}>{event.venue}</div>
          )}
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: hover ? C.red : C.darkMuted, transition: 'color 0.15s' }}>
          <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function DJProfileClient({ dj, events }: { dj: DJ; events: Event[] }) {
  const socialLinks: SocialLink[] = [
    dj.soundcloud_url && { label: 'SoundCloud', url: dj.soundcloud_url, icon: <SoundcloudIcon /> },
    dj.instagram_url && { label: 'Instagram', url: dj.instagram_url, icon: <InstagramIcon /> },
    dj.spotify_url && { label: 'Spotify', url: dj.spotify_url, icon: <SpotifyIcon /> },
    dj.youtube_url && { label: 'YouTube', url: dj.youtube_url, icon: <YoutubeIcon /> },
    dj.mixcloud_url && { label: 'Mixcloud', url: dj.mixcloud_url, icon: <MixcloudIcon /> },
    dj.website_url && { label: 'Website', url: dj.website_url, icon: <WebIcon /> },
  ].filter(Boolean) as SocialLink[]

  const pastEvents = events.filter(e => new Date(e.date) < new Date())
  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date())

  return (
    <div style={{ minHeight: '100vh', background: C.dark }}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: 64, minHeight: 320 }}>
        {/* Banner background */}
        {dj.banner_image_url ? (
          <div style={{ position: 'absolute', inset: 0 }}>
            <Image src={dj.banner_image_url} alt="" fill style={{ objectFit: 'cover', objectPosition: 'center 30%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(17,17,16,0.55) 0%, rgba(28,25,23,0.92) 100%)' }} />
          </div>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(45deg, #252220 0px, #252220 1px, #1c1917 1px, #1c1917 24px)',
            opacity: 0.6,
          }} />
        )}

        <div className="djp-hero-inner">
          {/* Left: name + meta */}
          <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
            <h1 style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(52px, 8vw, 96px)',
              lineHeight: 0.88,
              color: C.darkText,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              marginBottom: 20,
            }}>{dj.name}</h1>

            {/* Location + genres */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {dj.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.darkMuted, fontSize: 13 }}>
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1C4.24 1 2 3.24 2 6c0 3.5 5 8 5 8s5-4.5 5-8c0-2.76-2.24-5-5-5Z" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="7" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                  {dj.location}
                </div>
              )}
              {dj.is_resident && (
                <span style={{
                  background: 'rgba(201,50,26,0.12)',
                  border: '1px solid rgba(201,50,26,0.2)',
                  color: C.red,
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '3px 9px',
                }}>Shameless Resident</span>
              )}
            </div>
          </div>

          {/* Right: circular profile photo */}
          {dj.profile_image_url && (
            <div style={{
              position: 'relative', zIndex: 1,
              width: 'clamp(120px, 18vw, 200px)',
              height: 'clamp(120px, 18vw, 200px)',
              flexShrink: 0,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid rgba(201,50,26,0.4)`,
              boxShadow: '0 0 40px rgba(0,0,0,0.5)',
            }}>
              <Image src={dj.profile_image_url} alt={dj.name} fill style={{ objectFit: 'cover', objectPosition: 'center top' }} />
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 4vw, 48px) clamp(20px, 4vw, 48px) 80px' }}>

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 36 }}>
            {socialLinks.map(l => <SocialBtn key={l.label} link={l} />)}
          </div>
        )}

        <div style={{ height: 1, background: C.darkBorder, marginBottom: 36 }} />

        {/* Two-col layout on desktop */}
        <div className="djp-body-grid">

          {/* Left: bio */}
          <div>
            {dj.bio && (
              <div style={{ marginBottom: 40 }}>
                <div style={{
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontWeight: 900,
                  fontSize: 11,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: C.red,
                  marginBottom: 14,
                }}>About</div>
                <p style={{
                  color: C.darkMuted,
                  fontSize: 16,
                  lineHeight: 1.8,
                  margin: 0,
                  whiteSpace: 'pre-line',
                }}>{dj.bio}</p>
              </div>
            )}

            {/* Upcoming events */}
            {upcomingEvents.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <div style={{
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontWeight: 900,
                  fontSize: 11,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: C.red,
                  marginBottom: 14,
                }}>Upcoming at Shameless</div>
                {upcomingEvents.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            )}

            {/* Past events */}
            {pastEvents.length > 0 && (
              <div>
                <div style={{
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontWeight: 900,
                  fontSize: 11,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: C.red,
                  marginBottom: 14,
                }}>Past Shameless Events</div>
                {pastEvents.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            )}

            {events.length === 0 && (
              <div style={{ color: C.darkMuted, fontSize: 14, padding: '8px 0' }}>No Shameless events yet.</div>
            )}
          </div>

          {/* Right: back link */}
          <div>
            <Link href="/djs" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: C.darkMuted,
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = C.red)}
              onMouseLeave={e => (e.currentTarget.style.color = C.darkMuted)}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              All DJs
            </Link>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .djp-hero-inner {
          position: relative;
          max-width: 1100px;
          margin: 0 auto;
          padding: clamp(32px, 5vw, 60px) clamp(20px, 4vw, 48px) clamp(32px, 5vw, 60px);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 32px;
          min-height: 260px;
        }

        .djp-body-grid {
          display: grid;
          grid-template-columns: 1fr 200px;
          gap: 60px;
          align-items: start;
        }

        @media (max-width: 640px) {
          .djp-body-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .djp-body-grid > div:last-child {
            order: -1;
          }
        }
      ` }} />
    </div>
  )
}
