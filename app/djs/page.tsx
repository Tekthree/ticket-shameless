import { getDJs } from '@/lib/db'
import type { DJ } from '@/lib/db'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'DJs | Simply Shameless',
  description: 'The artists behind Simply Shameless events. Seattle underground music collective.',
}

const C = {
  dark: '#1c1917',
  darkCard: '#252220',
  darkBorder: 'rgba(255,255,255,0.07)',
  darkText: '#f0ece6',
  darkMuted: '#7a7068',
  red: '#c9321a',
}

function DJCard({ dj }: { dj: DJ }) {
  return (
    <Link href={`/djs/${dj.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: C.darkCard,
        border: `1px solid ${C.darkBorder}`,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = C.red)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = C.darkBorder)}
      >
        {/* Photo */}
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
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(28,25,23,0.85) 0%, transparent 100%)' }} />
        </div>

        {/* Name block */}
        <div style={{ padding: '14px 16px 18px' }}>
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
          {dj.genres && dj.genres.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
              {dj.genres.slice(0, 3).map(g => (
                <span key={g} style={{
                  background: 'rgba(201,50,26,0.1)',
                  border: `1px solid rgba(201,50,26,0.2)`,
                  color: C.red,
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                }}>{g}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
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
