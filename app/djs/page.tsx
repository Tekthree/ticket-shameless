import { getDJs, type DJ } from '@/lib/db'
import type { Metadata } from 'next'
import { DJCard } from './DJCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'DJs | Simply Shameless',
  description: 'The artists behind Simply Shameless events. Seattle underground music collective.',
}

const C = {
  dark: '#1c1917',
  darkMuted: '#7a7068',
  darkBorder: 'rgba(255,255,255,0.07)',
  darkText: '#f0ece6',
  red: '#c9321a',
}

export default async function DJsPage() {
  let djs: DJ[] = []
  try {
    djs = await getDJs()
  } catch {
    // DB not connected
  }

  return (
    <div style={{ minHeight: '100vh', background: C.dark, paddingTop: 64 }}>

      {/* Header */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) clamp(20px, 4vw, 48px) 0' }}>
        <div style={{
          fontFamily: 'var(--font-barlow), sans-serif',
          fontWeight: 900,
          fontSize: 11,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: C.red,
          marginBottom: 14,
        }}>Simply Shameless</div>
        <h1 style={{
          fontFamily: 'var(--font-barlow), sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(48px, 8vw, 96px)',
          lineHeight: 0.88,
          color: C.darkText,
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          marginBottom: 20,
        }}>The DJs</h1>
        <div style={{ height: 1, background: C.darkBorder, marginBottom: 40 }} />
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 4vw, 48px) 80px' }}>
        {djs.length === 0 ? (
          <div style={{ color: C.darkMuted, fontSize: 15, padding: '40px 0' }}>No DJs added yet.</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 2,
          }}>
            {djs.map(dj => <DJCard key={dj.id} dj={dj} />)}
          </div>
        )}
      </div>
    </div>
  )
}
