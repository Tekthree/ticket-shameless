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

export function DJGrid({ djs, upcomingCounts = {} }: { djs: DJ[]; upcomingCounts?: Record<string, number> }) {
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

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All DJs' },
    { key: 'residents', label: 'Shameless Residents' },
    { key: 'guests', label: 'Guests' },
  ]

  return (
    <>
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
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }} className="ss-filter-bar">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 28, flexShrink: 0 }}>
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
                  fontSize: 14,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: filter === key ? C.darkText : 'rgba(240,236,230,0.4)',
                  padding: '14px 0',
                  position: 'relative',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
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
          <div style={{ flex: 1, minWidth: 180, position: 'relative', padding: '10px 0' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.darkMuted }}>
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search artists..."
              className="ss-search-input"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.darkBorder}`,
                color: C.darkText,
                fontFamily: 'var(--font-dm), sans-serif',
                fontSize: 15,
                padding: '10px 36px 10px 40px',
                outline: 'none',
                width: '100%',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: C.darkMuted, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
              >×</button>
            )}
          </div>

          {/* Count */}
          <div style={{ flexShrink: 0, paddingLeft: 16, borderLeft: `1px solid ${C.darkBorder}`, paddingTop: 14, paddingBottom: 14 }}>
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
        <div className="ss-dj-grid" style={{ display: 'grid', gap: 'var(--ss-card-gap)' }}>
          {filtered.map(dj => <DJCard key={dj.id} dj={dj} upcomingCount={upcomingCounts[dj.id] ?? 0} />)}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .ss-filter-bar { scrollbar-width: none; }
        .ss-filter-bar::-webkit-scrollbar { display: none; }
        .ss-dj-grid { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 900px) { .ss-dj-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px) { .ss-dj-grid { grid-template-columns: repeat(2, 1fr); } }
        .ss-search-input::placeholder { color: #7a7068; }
        .ss-search-input:focus { border-color: #c9321a !important; background: rgba(255,255,255,0.06) !important; }
      ` }} />
    </>
  )
}
