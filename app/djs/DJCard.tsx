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

            {/* Role badge — top left */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: dj.is_resident ? C.red : C.darkCard,
            color: '#fff',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            border: dj.is_resident ? 'none' : `1px solid ${C.darkBorder}`,
          }}>{dj.is_resident ? 'Resident' : 'Guest'}</div>

          {/* Upcoming indicator — top right */}
          {upcomingCount > 0 && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(17,17,16,0.85)',
              border: `1px solid ${C.darkBorder}`,
              color: C.darkMuted,
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.red, flexShrink: 0, display: 'inline-block' }} />
              {upcomingCount} upcoming
            </div>
          )}
        </div>

        {/* Info section below photo */}
        <div style={{ padding: '16px 18px 20px', borderTop: `1px solid ${C.darkBorder}` }}>
          <div style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 900,
            fontSize: 22,
            color: C.darkText,
            textTransform: 'uppercase',
            lineHeight: 1,
            marginBottom: 6,
          }}>{dj.name}</div>
          {dj.location && (
            <div style={{ color: C.darkMuted, fontSize: 13 }}>{dj.location}</div>
          )}
        </div>
      </div>
    </Link>
  )
}
