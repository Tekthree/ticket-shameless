'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible] as const
}

function StatCounter({ value, label }: { value: string; label: string }) {
  const [ref, visible] = useInView()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!visible) return
    const num = parseInt(value.replace(/\D/g, ''))
    const suffix = value.replace(/[0-9]/g, '')
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / 1200, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * num))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [visible, value])

  const suffix = value.replace(/[0-9]/g, '')

  return (
    <div ref={ref}>
      <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 56, color: '#c9321a', lineHeight: 1 }}>{count}{suffix}</div>
      <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8078', marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function AboutSection() {
  const [leftRef, leftVisible] = useInView()
  const [r1, v1] = useInView()
  const [r2, v2] = useInView()
  const [r3, v3] = useInView()
  const [r4, v4] = useInView()

  const revealStyle = (visible: boolean, delay = 0): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  })

  return (
    <section id="about" style={{ padding: '120px 56px', background: '#faf7f2' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 100, alignItems: 'start' }}>

        {/* LEFT sticky */}
        <div ref={leftRef} style={{ position: 'sticky', top: 100 }}>
          <div style={revealStyle(leftVisible)}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c9321a', marginBottom: 14 }}>Who We Are</div>
          </div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(60px,7vw,96px)', lineHeight: 0.86, textTransform: 'uppercase' }}>
            {[
              { text: 'Born', color: '#1c1917', stroke: false, delay: 0 },
              { text: 'to be', color: '#1c1917', stroke: false, delay: 80 },
              { text: 'Shame', color: 'transparent', stroke: true, delay: 160 },
              { text: 'less.', color: '#c9321a', stroke: false, delay: 240 },
            ].map((line, i) => (
              <div key={i} style={{
                color: line.color,
                WebkitTextStroke: line.stroke ? '3px #1c1917' : undefined,
                opacity: leftVisible ? 1 : 0,
                transform: leftVisible ? 'translateY(0)' : 'translateY(28px)',
                transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${line.delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${line.delay}ms`,
              }}>{line.text}</div>
            ))}
          </div>
          <div style={{ marginTop: 48, display: 'flex', gap: 56 }}>
            {[['100+', 'Events'], ['20+', 'Years'], ['10K+', 'Community']].map(([n, l]) => (
              <StatCounter key={l} value={n} label={l} />
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <div ref={r1} style={revealStyle(v1)}>
            <p style={{ color: '#1c1917', fontSize: 22, lineHeight: 1.75, fontWeight: 300, marginBottom: 36 }}>
              Simply Shameless is a Seattle-based event collective built on the belief that the underground deserves a home — where house music, community, and pure freedom of expression meet on the dance floor.
            </p>
          </div>
          <div ref={r2} style={revealStyle(v2, 100)}>
            <p style={{ color: '#8a8078', fontSize: 18, lineHeight: 1.8, fontWeight: 300, marginBottom: 36 }}>
              In 2003, Shameless first took shape as a weekly indie dance night in the basement of the Alibi Room in Seattle's historic Pike Place Market. It quickly became one of the city's most respected underground dance music collectives.
            </p>
          </div>
          <div ref={r3} style={revealStyle(v3, 160)}>
            <p style={{ color: '#8a8078', fontSize: 18, lineHeight: 1.8, fontWeight: 300 }}>
              Every event is handcrafted. Every lineup is intentional. And every ticket is a promise — that you'll leave changed.
            </p>
          </div>
          <div ref={r4} style={revealStyle(v4, 220)}>
            <div style={{ width: 48, height: 3, background: '#c9321a', margin: '28px 0' }} />
            <Link href="/events" style={{
              display: 'inline-block',
              background: '#1c1917',
              color: '#fff',
              textDecoration: 'none',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '16px 40px',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2e2a27')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1c1917')}
            >Upcoming Events</Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #about > div { grid-template-columns: 1fr !important; gap: 48px !important; }
          #about > div > div:first-child { position: static !important; }
        }
        @media (max-width: 640px) {
          #about { padding: 60px 24px !important; }
        }
      `}</style>
    </section>
  )
}
