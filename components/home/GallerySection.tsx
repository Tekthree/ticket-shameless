'use client'

import { useRef, useState, useEffect } from 'react'

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible] as const
}

const cells = [
  { cols: 2, rows: 2, label: 'crowd shot' },
  { cols: 1, rows: 1, label: 'DJ set' },
  { cols: 1, rows: 1, label: 'venue' },
  { cols: 1, rows: 1, label: 'detail' },
  { cols: 1, rows: 1, label: 'crowd' },
  { cols: 2, rows: 1, label: 'stage wide' },
]
const angles = [30, 45, 60, 20, 50, 35]

function GalleryCell({ cell, index }: { cell: typeof cells[0]; index: number }) {
  const [ref, visible] = useInView()
  const [hover, setHover] = useState(false)

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        gridColumn: `span ${cell.cols}`,
        gridRow: `span ${cell.rows}`,
        background: '#252220',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        transform: hover ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
        opacity: visible ? 1 : 0,
        transitionDelay: `${index * 60}ms`,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(${angles[index]}deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent ${14 + index * 4}px)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: hover ? 'rgba(201,50,26,0.08)' : 'rgba(201,50,26,0)',
        transition: 'background 0.25s',
      }} />
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        fontFamily: 'monospace', fontSize: 9,
        color: '#7a7068', letterSpacing: '0.06em',
      }}>{cell.label}</div>
    </div>
  )
}

export default function GallerySection() {
  const [headerRef, headerVisible] = useInView()

  return (
    <section id="gallery" style={{ padding: '100px 56px', background: '#1c1917' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div ref={headerRef} style={{
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <div style={{
            fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900,
            fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase',
            color: '#c9321a', marginBottom: 14,
          }}>From the Floor</div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', marginBottom: 48,
          }}>
            <div style={{
              fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900,
              fontSize: 'clamp(52px,6vw,88px)', lineHeight: 0.88,
              color: '#f0ece6', textTransform: 'uppercase',
            }}>Gallery</div>
            <a href="#" style={{
              color: '#7a7068', textDecoration: 'none',
              fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700,
              fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase',
              borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 2,
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0ece6')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7a7068')}
            >See All →</a>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(2, 220px)',
          gap: 3,
        }}>
          {cells.map((cell, i) => (
            <GalleryCell key={i} cell={cell} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #gallery { padding: 60px 24px !important; }
          #gallery > div > div:last-child {
            grid-template-columns: repeat(2, 1fr) !important;
            grid-template-rows: repeat(3, 180px) !important;
          }
          #gallery > div > div:last-child > div {
            grid-column: span 1 !important;
            grid-row: span 1 !important;
          }
        }
      `}</style>
    </section>
  )
}
