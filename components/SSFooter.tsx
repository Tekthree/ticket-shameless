'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function SSFooter() {
  const socials = [
    { label: 'Instagram', href: 'https://www.instagram.com/shamelessseattle/' },
    { label: 'Facebook', href: 'https://www.facebook.com/shamelessinseattle/' },
    { label: 'SoundCloud', href: 'https://soundcloud.com/shamelessinseattle' },
    { label: 'Resident Advisor', href: 'https://ra.co/promoters/13758' },
  ]

  return (
    <footer style={{ background: '#111110', padding: '52px 56px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
          <Image src="/shameless-logo.png" alt="Simply Shameless" width={120} height={34} style={{ height: 34, width: 'auto' }} />
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {socials.map(s => (
              <Link key={s.label} href={s.href} style={{
                color: 'rgba(240,236,230,0.3)', textDecoration: 'none',
                fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700,
                fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c9321a')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,236,230,0.3)')}
              >{s.label}</Link>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ color: 'rgba(240,236,230,0.2)', fontFamily: 'var(--font-dm), sans-serif', fontSize: 13 }}>
            © {new Date().getFullYear()} Simply Shameless Productions · Seattle, WA
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Contact', href: '/contact' }].map(l => (
              <Link key={l.label} href={l.href} style={{
                color: 'rgba(240,236,230,0.25)', textDecoration: 'none',
                fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700,
                fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f0ece6')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,236,230,0.25)')}
              >{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
