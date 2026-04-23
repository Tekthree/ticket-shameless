'use client'

import { useState } from 'react'
import type { DJ } from '@/lib/db'
import { DJCard } from './DJCard'

const C = {
  darkBorder: 'rgba(255,255,255,0.07)',
  darkMuted: '#7a7068',
  darkText: '#f0ece6',
  red: '#c9321a',
}

export function DJGrid({ djs }: { djs: DJ[] }) {
  const [residentsOnly, setResidentsOnly] = useState(false)

  const filtered = residentsOnly ? djs.filter(d => d.is_resident) : djs

  return (
    <div>
      {/* Description + filter row */}
      <div style={{ marginBottom: 40 }}>
        <p style={{
          color: C.darkMuted,
          fontSize: 16,
          lineHeight: 1.8,
          margin: '0 0 24px',
          maxWidth: 640,
        }}>
          Every selector who&apos;s moved the room at a Shameless event. Local underground lifers, desert pilgrims, and the selectors we keep calling back — these are the DJs that have played our nights.
        </p>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setResidentsOnly(false)}
            style={{
              background: residentsOnly ? 'transparent' : C.red,
              border: `1px solid ${residentsOnly ? C.darkBorder : C.red}`,
              color: residentsOnly ? C.darkMuted : '#fff',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '8px 18px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            All DJs
          </button>
          <button
            onClick={() => setResidentsOnly(true)}
            style={{
              background: residentsOnly ? C.red : 'transparent',
              border: `1px solid ${residentsOnly ? C.red : C.darkBorder}`,
              color: residentsOnly ? '#fff' : C.darkMuted,
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '8px 18px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Shameless Residents
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ color: C.darkMuted, fontSize: 15, padding: '40px 0' }}>No DJs found.</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 2,
          alignItems: 'stretch',
        }}>
          {filtered.map(dj => <DJCard key={dj.id} dj={dj} />)}
        </div>
      )}
    </div>
  )
}
