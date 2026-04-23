'use client'

import { useState, useRef, useEffect } from 'react'

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible] as const
}

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ref, visible] = useInView()

  const revealStyle = (delay = 0): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="signup" style={{ padding: '120px 56px', background: '#c9321a', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 18px)' }} />
      <div ref={ref} style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div style={revealStyle()}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 13, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>Stay in the Loop</div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(56px,8vw,100px)', lineHeight: 0.86, color: '#fff', textTransform: 'uppercase', marginBottom: 28 }}>
            Never Miss<br />a Party.
          </div>
        </div>
        <div style={revealStyle(100)}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1.7, fontWeight: 300, marginBottom: 52 }}>
            First access to tickets, merch drops & lineup announcements. No spam, ever.
          </p>
        </div>
        <div style={revealStyle(180)}>
          {submitted ? (
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 32, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              You're in. See you on the floor. ✓
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} style={{ display: 'flex', maxWidth: 560, margin: '0 auto' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="your@email.com"
                  style={{
                    flex: 1, border: 'none', borderBottom: '2px solid rgba(255,255,255,0.4)',
                    background: 'transparent', color: '#fff', outline: 'none',
                    fontFamily: 'var(--font-dm), sans-serif', fontSize: 17,
                    padding: '14px 20px 14px 0', transition: 'border-color 0.25s',
                    opacity: loading ? 0.6 : 1,
                  }}
                  onFocus={e => (e.target.style.borderBottomColor = '#fff')}
                  onBlur={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.4)')}
                />
                <button type="submit" disabled={loading} style={{
                  background: '#fff', color: '#c9321a', border: 'none', cursor: loading ? 'default' : 'pointer',
                  fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 16,
                  letterSpacing: '0.15em', textTransform: 'uppercase', padding: '14px 40px',
                  marginLeft: 16, flexShrink: 0, transition: 'transform 0.12s, opacity 0.2s',
                  opacity: loading ? 0.7 : 1,
                }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = loading ? '0.7' : '1'; e.currentTarget.style.transform = 'translateY(0)' }}
                  onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.96)' }}
                  onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                >{loading ? '...' : 'Subscribe'}</button>
              </form>
              {error && (
                <div style={{ marginTop: 14, color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: 'var(--font-dm), sans-serif' }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          #signup { padding: 80px 24px !important; }
          #signup form { flex-direction: column !important; gap: 16px; }
          #signup form button { margin-left: 0 !important; }
        }
        #signup input::placeholder { color: rgba(255,255,255,0.5); }
      ` }} />
    </section>
  )
}
