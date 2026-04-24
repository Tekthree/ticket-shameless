'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { DJ } from '@/lib/db'

const C = {
  dark: '#1c1917',
  darkCard: '#252220',
  darkBorder: 'rgba(255,255,255,0.07)',
  darkText: '#f0ece6',
  darkMuted: '#7a7068',
  red: '#c9321a',
  redMuted: 'rgba(201,50,26,0.12)',
}

export function DJCard({ dj, upcomingCount = 0 }: { dj: DJ; upcomingCount?: number }) {
  const [hover, setHover] = useState(false)

  return (
    <Link href={`/djs/${dj.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: C.darkCard,
          border: `1px solid ${hover ? C.red : C.darkBorder}`,
          overflow: 'hidden',
          transition: 'border-color 0.2s, transform 0.25s cubic-bezier(0.22,1,0.36,1)',
          transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        }}
      >
        {/* Portrait image — 3:4 aspect */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '133%', background: C.dark, overflow: 'hidden' }}>
          {dj.profile_image_url ? (
            <Image
              src={dj.profile_image_url}
              alt={dj.name}
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center top',
                transform: hover ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(45deg, #252220 0px, #252220 1px, #1c1917 1px, #1c1917 24px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: 900,
                fontSize: 72,
                color: 'rgba(201,50,26,0.15)',
                textTransform: 'uppercase',
              }}>{dj.name[0]}</span>
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
            background: 'linear-gradient(to top, rgba(28,25,23,0.95) 0%, rgba(28,25,23,0.4) 60%, transparent 100%)',
          }} />

          {/* Role badge — top left */}
          {dj.is_resident && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: C.red,
              color: '#fff',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 800,
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '4px 10px',
            }}>Resident</div>
          )}

          {/* Upcoming indicator — top right */}
          {upcomingCount > 0 && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(17,17,16,0.75)',
              backdropFilter: 'blur(8px)',
              color: C.darkText,
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.red, flexShrink: 0, display: 'inline-block' }} />
              {upcomingCount} upcoming
            </div>
          )}

          {/* Name + location at bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 14px 14px' }}>
            <div style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              color: C.darkText,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              lineHeight: 1.05,
              marginBottom: 4,
            }}>{dj.name}</div>
            {dj.location && (
              <div style={{
                color: 'rgba(240,236,230,0.5)',
                fontSize: 11,
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}>{dj.location}</div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
