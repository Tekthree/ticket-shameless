import { getDJs, getUpcomingCountsByDJ, type DJ } from '@/lib/db'
import type { Metadata } from 'next'
import { DJGrid } from './DJGrid'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'DJs | Simply Shameless',
  description: 'The artists behind Simply Shameless events. Seattle underground music collective.',
}

const C = {
  dark: '#1c1917',
  darkBorder: 'rgba(255,255,255,0.07)',
  darkMuted: '#7a7068',
  darkText: '#f0ece6',
  red: '#c9321a',
}

export default async function DJsPage() {
  let djs: DJ[] = []
  let upcomingCounts: Record<string, number> = {}
  try {
    ;[djs, upcomingCounts] = await Promise.all([getDJs(), getUpcomingCountsByDJ()])
  } catch {
    // DB not connected
  }

  return (
    <div style={{ minHeight: '100vh', background: C.dark, paddingTop: 64 }}>

      {/* Page header */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) clamp(20px, 4vw, 56px) 0' }}>
        <div style={{
          fontFamily: 'var(--font-barlow), sans-serif',
          fontWeight: 900,
          fontSize: 12,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: C.red,
          marginBottom: 12,
        }}>The Collaborators and Crew</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
          <h1 style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(52px, 9vw, 110px)',
            lineHeight: 0.86,
            color: C.darkText,
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            margin: 0,
          }}>Your Selectors</h1>
          <p style={{
            color: C.darkMuted,
            fontSize: 15,
            lineHeight: 1.7,
            maxWidth: 340,
            fontWeight: 300,
            margin: 0,
          }}>
            Every selector who&apos;s moved the room at a Shameless event. Local underground lifers, desert pilgrims, and the names we keep calling back.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px, 4vw, 56px) 80px' }}>
        <DJGrid djs={djs} upcomingCounts={upcomingCounts} />
      </div>
    </div>
  )
}
