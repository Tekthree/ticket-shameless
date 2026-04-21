'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <section style={{
      minHeight: '100vh',
      background: '#1c1917',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* LEFT */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '140px 72px 80px 56px' }}>
        <div style={{
          fontFamily: 'var(--font-barlow), sans-serif',
          fontWeight: 900,
          textTransform: 'uppercase',
          lineHeight: 0.86,
          overflow: 'hidden',
        }}>
          {[
            { text: 'Simply', color: '#f0ece6', stroke: false },
            { text: 'Shame', color: '#c9321a', stroke: false },
            { text: 'less.', color: 'transparent', stroke: true },
          ].map((line, i) => (
            <div key={i} style={{
              fontSize: 'clamp(88px, 11vw, 152px)',
              letterSpacing: '-0.01em',
              color: line.color,
              WebkitTextStroke: line.stroke ? '3px #f0ece6' : undefined,
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0) skewY(0)' : 'translateY(48px) skewY(2deg)',
              transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.12}s, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.12}s`,
            }}>{line.text}</div>
          ))}
        </div>

        <div style={{
          width: loaded ? 48 : 0,
          height: 3,
          background: '#c9321a',
          margin: '28px 0',
          transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1) 0.55s',
        }} />

        <p style={{
          color: '#7a7068',
          fontSize: 18,
          lineHeight: 1.7,
          maxWidth: 360,
          fontWeight: 300,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(32px)',
          transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.65s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.65s',
        }}>
          Seattle's underground house & techno collective. We throw parties that feel like freedom.
        </p>

        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 48,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(32px)',
          transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.8s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.8s',
        }}>
          <Link href="/events" style={{
            display: 'inline-block',
            background: '#c9321a',
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
            onMouseEnter={e => { e.currentTarget.style.background = '#a82614'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(201,50,26,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#c9321a'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >View Events</Link>
          <Link href="/shop" style={{
            display: 'inline-block',
            background: 'transparent',
            color: '#f0ece6',
            border: '1px solid rgba(255,255,255,0.1)',
            textDecoration: 'none',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 800,
            fontSize: 17,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '17px 36px',
            transition: 'border-color 0.2s, transform 0.12s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >Shop Merch</Link>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'scale(1)' : 'scale(1.04)',
        transition: 'opacity 1.2s cubic-bezier(0.22,1,0.36,1) 0.05s, transform 1.2s cubic-bezier(0.22,1,0.36,1) 0.05s',
      }}>
        <Image
          src="/brand-hero.jpg"
          alt="Simply Shameless"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(28,25,23,0.55) 0%, transparent 35%, transparent 65%, rgba(28,25,23,0.3) 100%)' }} />

        {/* Next event card */}
        <div style={{
          position: 'absolute',
          bottom: 48,
          left: 40,
          right: 40,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(32px)',
          transition: 'opacity 0.9s cubic-bezier(0.22,1,0.36,1) 0.9s, transform 0.9s cubic-bezier(0.22,1,0.36,1) 0.9s',
        }}>
          <div style={{
            background: 'rgba(17,17,16,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '24px 28px',
            display: 'flex',
            gap: 24,
            alignItems: 'center',
          }}>
            <div style={{ width: 4, alignSelf: 'stretch', background: '#c9321a', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.2em', color: '#c9321a', textTransform: 'uppercase', marginBottom: 6 }}>Next Event</div>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 26, color: '#f0ece6', lineHeight: 1.05, textTransform: 'uppercase' }}>Desert Hearts × Shameless</div>
              <div style={{ color: '#7a7068', fontSize: 14, marginTop: 5 }}>Mon May 25 · Monkey Loft, Seattle · 2PM–10PM</div>
            </div>
            <Link href="/events" style={{
              marginLeft: 'auto',
              display: 'inline-block',
              background: '#c9321a',
              color: '#fff',
              textDecoration: 'none',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '12px 22px',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#a82614')}
              onMouseLeave={e => (e.currentTarget.style.background = '#c9321a')}
            >Tickets</Link>
          </div>
        </div>
      </div>

      {/* Mobile fallback — stack vertically */}
      <style>{`
        @media (max-width: 768px) {
          section[data-hero] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
