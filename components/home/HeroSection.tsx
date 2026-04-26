'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Event } from '@/lib/db'

const HERO_VIDEO_URL = 'https://udanlcylpsvxqlihcppb.supabase.co/storage/v1/object/sign/Saves/deckd%20out%202025%20FINAL%20(1).mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jYzYyMzMyYy0yYzgwLTQ4YjctYjNiYy1lZTAzZGE2ZjUwN2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJTYXZlcy9kZWNrZCBvdXQgMjAyNSBGSU5BTCAoMSkubXA0IiwiaWF0IjoxNzU2ODM4NTY0LCJleHAiOjE3ODgzNzQ1NjR9.tsaE8yURPvlfpzt1Miz0tTLMoY1eUQYCgGYkMy7eWRc'

// Design tokens (from Design System.html)
const C = {
  dark: '#1c1917',
  darkDeep: '#111110',
  darkCard: '#252220',
  darkText: '#f0ece6',
  darkMuted: '#7a7068',
  red: '#c9321a',
  redDeep: '#a82614',
}

export default function HeroSection({ nextEvent }: { nextEvent?: Event | null }) {
  const [loaded, setLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 120)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    videoRef.current?.play().catch(() => {})
  }, [])

  const eventDate = nextEvent
    ? new Date(nextEvent.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

  return (
    <section data-hero style={{
      position: 'relative',
      width: '100%',
      minHeight: '88vh',
      background: C.darkDeep,
      overflow: 'hidden',
      display: 'flex',
    }}>
      {/* ── VIDEO LAYER (right on desktop, top on mobile) ── */}
      <div className="hero-video-wrap" style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '70%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/brand-hero.jpg"
          className="hero-video"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'scale(1)' : 'scale(1.06)',
            transition: 'opacity 1.4s cubic-bezier(0.22,1,0.36,1), transform 1.6s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>

        {/* Gradual left-edge fade — wide transition zone so the blend looks natural */}
        <div className="hero-video-fade" style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to right,
            ${C.darkDeep} 0%,
            rgba(17,17,16,0.92) 12%,
            rgba(17,17,16,0.65) 30%,
            rgba(17,17,16,0.3) 52%,
            rgba(17,17,16,0.08) 75%,
            rgba(17,17,16,0.02) 100%)`,
          pointerEvents: 'none',
        }} />

        {/* Red color wash over video — tints left side to match the gradient color */}
        <div className="hero-video-tint" style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to right,
            rgba(90,19,8,0.7) 0%,
            rgba(168,38,20,0.45) 32%,
            rgba(201,50,26,0.18) 58%,
            transparent 80%)`,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── GRADIENT LAYER (left on desktop, bottom on mobile) ── */}
      <div className="hero-gradient-wrap" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '65%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
        background: `
          linear-gradient(to right,
            ${C.darkDeep} 0%,
            #2a0c06 25%,
            #5a1308 46%,
            rgba(168,38,20,0.6) 66%,
            rgba(201,50,26,0.12) 85%,
            rgba(201,50,26,0.0) 100%)
        `,
      }}>
        {/* Blurred red halo at the blend edge */}
        <div style={{
          position: 'absolute',
          right: '-5%',
          top: '15%',
          width: '50%',
          height: '75%',
          background: `radial-gradient(circle at 60% 50%, rgba(201,50,26,0.45) 0%, rgba(122,18,8,0.2) 45%, transparent 70%)`,
          filter: 'blur(80px)',
        }} />

        {/* Subtle 45° stripe pattern (from design system "Texture Patterns") */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 14px)',
          opacity: 0.6,
        }} />
      </div>

      {/* ── BOTTOM FADE INTO NEXT SECTION ── */}
      <div className="hero-bottom-fade" style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 140,
        background: `linear-gradient(to bottom, transparent 0%, ${C.dark} 100%)`,
        pointerEvents: 'none',
        zIndex: 3,
      }} />

      {/* ── CONTENT ── */}
      <div className="hero-content-wrap" style={{
        position: 'relative',
        zIndex: 4,
        width: '100%',
        maxWidth: 1600,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div className="hero-content" style={{
          width: '52%',
          padding: '100px 64px 100px 72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          {/* Overline label (design system: Label/Overline) */}
          <div style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 900,
            fontSize: 12,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: C.red,
            marginBottom: 18,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s, transform 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s',
          }}>
            Underground since 2003
          </div>

          {/* Headline — outlined-type treatment from design system */}
          <h1 style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 0.86,
            letterSpacing: '-0.01em',
            fontSize: 'clamp(72px, 8.6vw, 144px)',
            margin: 0,
            color: C.darkText,
          }}>
            <span style={{
              display: 'block',
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(40px)',
              transition: 'opacity 0.85s cubic-bezier(0.22,1,0.36,1) 0.18s, transform 0.85s cubic-bezier(0.22,1,0.36,1) 0.18s',
            }}>Simply</span>
            <span style={{
              display: 'block',
              color: 'transparent',
              WebkitTextStroke: `2.5px ${C.darkText}`,
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(40px)',
              transition: 'opacity 0.85s cubic-bezier(0.22,1,0.36,1) 0.3s, transform 0.85s cubic-bezier(0.22,1,0.36,1) 0.3s',
            }}>Shameless.</span>
          </h1>

          {/* Red rule (design system motif) */}
          <div style={{
            width: loaded ? 56 : 0,
            height: 3,
            background: C.red,
            margin: '32px 0 28px',
            transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1) 0.55s',
          }} />

          {/* Body Large — DM Sans 300, lh 1.75 */}
          <p style={{
            fontFamily: 'var(--font-dm), sans-serif',
            fontWeight: 300,
            fontSize: 'clamp(17px, 1.25vw, 20px)',
            lineHeight: 1.7,
            color: C.darkText,
            opacity: 0.92,
            maxWidth: 460,
            margin: 0,
            transform: loaded ? 'translateY(0)' : 'translateY(24px)',
            transitionProperty: 'opacity, transform',
            transitionDuration: '0.85s',
            transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
            transitionDelay: '0.45s',
          }}>
            Seattle's underground house &amp; techno collective. We throw parties that feel like freedom.
          </p>

          {/* CTAs — design system .btn-primary + .btn-ghost */}
          <div style={{
            display: 'flex',
            gap: 12,
            marginTop: 40,
            flexWrap: 'wrap',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.85s cubic-bezier(0.22,1,0.36,1) 0.6s, transform 0.85s cubic-bezier(0.22,1,0.36,1) 0.6s',
          }}>
            <Link href="/events" className="hero-btn-primary" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: C.red,
              color: '#fff',
              textDecoration: 'none',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 800,
              fontSize: 17,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '17px 44px',
              transition: 'background 0.2s, transform 0.12s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.redDeep; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(201,50,26,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.background = C.red; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >View Events</Link>

            <Link href="/shop" className="hero-btn-ghost" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              color: C.darkText,
              border: '1px solid rgba(255,255,255,0.18)',
              textDecoration: 'none',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 800,
              fontSize: 17,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '17px 36px',
              transition: 'border-color 0.2s, transform 0.12s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >Shop Merch</Link>
          </div>

          {/* Mono token (design system: DM Mono, technical) */}
          <div style={{
            fontFamily: 'var(--font-dm), monospace',
            fontSize: 10,
            letterSpacing: '0.06em',
            color: 'rgba(240,236,230,0.3)',
            marginTop: 56,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.9s cubic-bezier(0.22,1,0.36,1) 0.85s',
          }}>
            EST · 2003 &nbsp;·&nbsp; SEATTLE WA
          </div>
        </div>
      </div>

      {/* ── NEXT EVENT CARD (bottom-right, design-system .merch-card style) ── */}
      {nextEvent && (
        <Link
          href={`/events/${nextEvent.slug}`}
          className="hero-event-card"
          style={{
            position: 'absolute',
            right: 56,
            bottom: 80,
            zIndex: 5,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            background: C.darkCard,
            border: `1px solid rgba(255,255,255,0.07)`,
            color: C.darkText,
            padding: '18px 22px',
            maxWidth: 380,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.9s cubic-bezier(0.22,1,0.36,1) 0.75s, transform 0.9s cubic-bezier(0.22,1,0.36,1) 0.75s, border-color 0.2s, box-shadow 0.2s',
            boxShadow: '0 16px 50px rgba(0,0,0,0.45)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.boxShadow = '0 18px 56px rgba(0,0,0,0.55), 0 4px 16px rgba(201,50,26,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = '0 16px 50px rgba(0,0,0,0.45)' }}
        >
          <div style={{ width: 4, alignSelf: 'stretch', background: C.red, flexShrink: 0 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 900,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: C.red,
              marginBottom: 4,
            }}>Next Event</div>
            <div style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 800,
              fontSize: 22,
              lineHeight: 1.05,
              textTransform: 'uppercase',
              color: C.darkText,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: 4,
            }}>{nextEvent.title}</div>
            <div style={{
              fontFamily: 'var(--font-dm), sans-serif',
              fontSize: 12,
              color: C.darkMuted,
            }}>
              {eventDate}{nextEvent.venue ? ` · ${nextEvent.venue}` : ''}
            </div>
          </div>
          <span style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: C.darkText,
            flexShrink: 0,
          }}>Open →</span>
        </Link>
      )}

      {/* Responsive overrides: large = side-by-side; mobile = video top + gradient/header bottom */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          section[data-hero] .hero-content { padding: 110px 40px 100px !important; width: 58% !important; }
          section[data-hero] .hero-video-wrap { width: 72% !important; }
          section[data-hero] .hero-gradient-wrap { width: 68% !important; }
          section[data-hero] .hero-event-card { right: 32px !important; bottom: 72px !important; max-width: 320px !important; }
        }
        @media (max-width: 768px) {
          /* Full-overlay layout — video is absolute background, spacer pushes content down */
          section[data-hero] {
            min-height: 100svh !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            position: relative !important;
            overflow: hidden !important;
          }
          /* Transparent spacer — guarantees at least 48vh of video above content */
          section[data-hero]::before {
            content: '';
            display: block;
            flex: 1;
            min-height: 48vh;
          }
          /* Fixed height so cover crops less aggressively (58vh ≈ 490px = less portrait extreme) */
          section[data-hero] .hero-video-wrap {
            position: absolute !important;
            top: 0 !important; left: 0 !important; right: 0 !important;
            bottom: auto !important;
            width: 100% !important;
            height: 58vh !important;
            z-index: 1;
          }
          /* Fade relative to 58vh container — go solid at 100% (bottom of video-wrap) */
          section[data-hero] .hero-video-fade {
            background: linear-gradient(to bottom,
              rgba(17,17,16,0.0) 0%,
              rgba(17,17,16,0.0) 55%,
              rgba(17,17,16,0.25) 70%,
              rgba(17,17,16,0.65) 85%,
              ${C.darkDeep} 100%) !important;
          }
          /* Warm red tint on video — lower half of the 58vh clip */
          section[data-hero] .hero-video-tint {
            background: linear-gradient(to bottom,
              transparent 0%,
              transparent 45%,
              rgba(90,19,8,0.3) 65%,
              rgba(90,19,8,0.55) 80%,
              rgba(42,12,6,0.3) 92%,
              transparent 100%) !important;
            mix-blend-mode: screen !important;
          }
          /* Main color layer — vertical version of desktop gradient + radial blob for non-linear feel */
          section[data-hero] .hero-gradient-wrap {
            display: block !important;
            width: 100% !important;
            background:
              radial-gradient(ellipse 140% 20% at 35% 40%, rgba(90,19,8,0.5) 0%, transparent 100%),
              linear-gradient(to bottom,
                transparent 0%,
                transparent 28%,
                rgba(42,12,6,0.55) 34%,
                #2a0c06 40%,
                #3d1008 47%,
                #2a0c06 55%,
                rgba(26,8,5,0.4) 64%,
                transparent 73%) !important;
          }
          /* Suppress desktop-positioned halo child — it's re-created by the radial above */
          section[data-hero] .hero-gradient-wrap > div:first-child {
            display: none !important;
          }
          section[data-hero] .hero-bottom-fade {
            display: none !important;
          }
          /* Content in normal flow at bottom (section is flex-col justify-end) */
          section[data-hero] .hero-content-wrap {
            position: relative !important;
            top: auto !important; left: auto !important; right: auto !important; bottom: auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-end !important;
            background: transparent !important;
            z-index: 4;
            max-width: 100% !important;
          }
          section[data-hero] .hero-content {
            width: 100% !important;
            padding: 28px 24px 16px !important;
            justify-content: flex-end !important;
            height: auto !important;
          }
          /* Card flows in normal order after the buttons — no positioning tricks needed */
          section[data-hero] .hero-event-card {
            position: relative !important;
            right: auto !important;
            bottom: auto !important;
            margin: 0 24px 28px !important;
            width: calc(100% - 48px) !important;
            max-width: none !important;
            transform: none !important;
            opacity: 1 !important;
            z-index: 4;
          }
        }
        @media (max-width: 480px) {
          section[data-hero] .hero-content { padding: 24px 20px 20px !important; }
          section[data-hero] h1 { font-size: clamp(52px, 15vw, 80px) !important; }
        }
      ` }} />
    </section>
  )
}
