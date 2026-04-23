'use client'

import { useState, useMemo } from 'react'
import type { DJ } from '@/lib/db'
import { DJCard } from './DJCard'

const C = {
  dark: '#1c1917',
  darkCard: '#252220',
  darkBorder: 'rgba(255,255,255,0.07)',
  darkMuted: '#7a7068',
  darkText: '#f0ece6',
  red: '#c9321a',
}

type Filter = 'all' | 'residents' | 'guests'

export function DJGrid({ djs }: { djs: DJ[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = djs
    if (filter === 'residents') list = list.filter(d => d.is_resident)
    if (filter === 'guests') list = list.filter(d => !d.is_resident)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.location || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [djs, filter, search])

  // Ticker: all names repeated
  const tickerNames = djs.map(d => d.name).join(' · ') + ' · '

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All DJs' },
    { key: 'residents', label: 'Shameless Residents' },
    { key: 'guests', label: 'Guests' },
  ]

  return (
    <>
      {/* Ticker */}
      <div style={{ overflow: 'hidden', borderBottom: `1px solid ${C.darkBorder}`, marginBottom: 0 }}>
        <div style={{
          display: 'flex',
          whiteSpace: 'nowrap',
          animation: 'ss-ticker 50s linear infinite',
          padding: '10px 0',
        }}>
          {/* Double for seamless loop */}
          {[0, 1].map(n => (
            <span key={n} style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: C.darkMuted,
              paddingRight: 0,
            }}>{tickerNames}</span>
          ))}
        </div>
      </div>

      {/* Sticky filter bar */}
      <div style={{
        position: 'sticky',
        top: 64,
        zIndex: 100,
        background: 'rgba(28,25,23,0.97)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.darkBorder}`,
        marginBottom: 40,
      }}>
        <div style={{
          display: 'flex',
          gap: 0,
          alignItems: 'stretch',
          overflowX: 'auto',
        }} className="ss-filter-bar">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, flex: 1 }}>
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: filter === key ? C.darkText : 'rgba(240,236,230,0.4)',
                  padding: '16px 0',
                  marginRight: 24,
                  position: 'relative',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {label}
                <span style={{
                  position: 'absolute',
                  bottom: 0, left: 0,
                  width: filter === key ? '100%' : '0%',
                  height: 2,
                  background: C.red,
                  transition: 'width 0.28s cubic-bezier(0.22,1,0.36,1)',
                }} />
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: `1px solid ${C.darkBorder}`, padding: '0 16px', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: C.darkMuted, flexShrink: 0 }}>
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: C.darkText,
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                width: 100,
              }}
            />
          </div>

          {/* Count */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            borderLeft: `1px solid ${C.darkBorder}`,
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: C.darkMuted,
              whiteSpace: 'nowrap',
            }}>{filtered.length} artists</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ color: C.darkMuted, fontSize: 15, padding: '48px 0', textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            No DJs found
          </span>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 3,
        }}>
          {filtered.map(dj => <DJCard key={dj.id} dj={dj} />)}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ss-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ss-filter-bar { scrollbar-width: none; }
        .ss-filter-bar::-webkit-scrollbar { display: none; }
      ` }} />
    </>
  )
}
