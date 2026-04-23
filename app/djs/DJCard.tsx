'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { DJ } from '@/lib/db'

const C = {
  dark: '#1c1917',
  darkCard: '#252220',
  darkBorder: 'rgba(255,255,255,0.07)',
  darkText: '#f0ece6',
  darkMuted: '#7a7068',
  red: '#c9321a',
}

export function DJCard({ dj }: { dj: DJ }) {
  return (
    <Link href={`/djs/${dj.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        style={{
          background: C.darkCard,
          border: `1px solid ${C.darkBorder}`,
          overflow: 'hidden',
          transition: 'border-color 0.2s',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = C.red)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = C.darkBorder)}
      >
        <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: C.dark, overflow: 'hidden' }}>
          {dj.profile_image_url ? (
            <Image
              src={dj.profile_image_url}
              alt={dj.name}
              fill
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'repeating-linear-gradient(45deg, #252220 0px, #252220 1px, #1c1917 1px, #1c1917 20px)',
            }}>
              <span style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(48px, 10vw, 72px)',
                color: 'rgba(201,50,26,0.25)',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
              }}>{dj.name[0]}</span>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(28,25,23,0.85) 0%, transparent 100%)' }} />
        </div>

        <div style={{ padding: '14px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: C.darkText,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            lineHeight: 1,
            marginBottom: 6,
          }}>{dj.name}</div>
          {dj.location && (
            <div style={{ color: C.darkMuted, fontSize: 12, letterSpacing: '0.08em' }}>{dj.location}</div>
          )}
          {dj.is_resident && (
            <div style={{ marginTop: 10 }}>
              <span style={{
                background: 'rgba(201,50,26,0.1)',
                border: '1px solid rgba(201,50,26,0.2)',
                color: C.red,
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '3px 8px',
              }}>Shameless Resident</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
