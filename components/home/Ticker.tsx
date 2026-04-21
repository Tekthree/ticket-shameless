'use client'

const items = ['Simply Shameless', 'Seattle', 'Underground House', 'Techno', 'Community', 'Est. 2003', 'All Ages', 'No Regrets']

export default function Ticker() {
  const doubled = [...items, ...items]
  return (
    <div style={{ overflow: 'hidden', background: '#c9321a', padding: '14px 0' }}>
      <div style={{
        display: 'flex',
        width: 'max-content',
        animation: 'ss-ticker 22s linear infinite',
      }}>
        {doubled.map((t, i) => (
          <span key={i} style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 900,
            fontSize: 15,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.9)',
            padding: '0 40px',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 40,
          }}>
            {t}
            <span style={{ width: 5, height: 5, background: 'rgba(255,255,255,0.5)', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ss-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
