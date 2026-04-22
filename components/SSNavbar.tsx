'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function SSNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const isEventPage = pathname?.startsWith('/events/') && pathname !== '/events'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 200,
    height: 72,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 48px',
    background: scrolled ? 'rgba(17,17,16,0.97)' : 'rgba(17,17,16,0.75)',
    backdropFilter: 'blur(20px)',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.04)',
    transition: 'background 0.35s, border-color 0.35s',
  }

  const linkStyle: React.CSSProperties = {
    color: '#f0ece6',
    textDecoration: 'none',
    fontFamily: 'var(--font-barlow), sans-serif',
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    opacity: 0.55,
    transition: 'opacity 0.2s',
  }

  return (
    <>
      <nav style={navStyle}>
        {/* Left side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/">
            <Image src="/shameless-logo.png" alt="Simply Shameless" width={120} height={38} style={{ height: 34, width: 'auto' }} priority />
          </Link>
          {isEventPage && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 18 }}>|</span>
              <Link href="/events" style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: 5 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.55')}
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                All Events
              </Link>
            </>
          )}
        </div>

        {/* Desktop right */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="hidden md:flex">
          {isEventPage ? (
            [['Merch', '/shop'], ['About', '/#about']].map(([label, href]) => (
              <Link key={label} href={href} style={linkStyle}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.55')}
              >{label}</Link>
            ))
          ) : (
            <>
              {[['Events', '/events'], ['Merch', '/shop'], ['About', '/#about']].map(([label, href]) => (
                <Link key={label} href={href} style={linkStyle}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.55')}
                >{label}</Link>
              ))}
              <Link href="/events" style={{
                display: 'inline-block',
                background: '#c9321a',
                color: '#fff',
                textDecoration: 'none',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '10px 24px',
                transition: 'background 0.2s, transform 0.12s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#a82614'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#c9321a'; e.currentTarget.style.transform = 'translateY(0)' }}
              >Get Tickets</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', color: '#f0ece6', cursor: 'pointer', padding: 8 }}
          aria-label="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 72, left: 0, right: 0, zIndex: 199,
          background: 'rgba(17,17,16,0.98)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '24px 32px 32px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }} className="md:hidden">
          {isEventPage ? (
            <>
              <Link href="/events" onClick={() => setMenuOpen(false)} style={{ ...linkStyle, opacity: 1, fontSize: 22, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                All Events
              </Link>
              {[['Merch', '/shop'], ['About', '/#about']].map(([label, href]) => (
                <Link key={label} href={href} onClick={() => setMenuOpen(false)} style={{ ...linkStyle, opacity: 1, fontSize: 22 }}>{label}</Link>
              ))}
            </>
          ) : (
            <>
              {[['Events', '/events'], ['Merch', '/shop'], ['About', '/#about']].map(([label, href]) => (
                <Link key={label} href={href} onClick={() => setMenuOpen(false)} style={{ ...linkStyle, opacity: 1, fontSize: 22 }}>{label}</Link>
              ))}
              <Link href="/events" onClick={() => setMenuOpen(false)} style={{
                display: 'inline-block', background: '#c9321a', color: '#fff', textDecoration: 'none',
                fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 16,
                letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 32px',
                textAlign: 'center', marginTop: 8,
              }}>Get Tickets</Link>
            </>
          )}
        </div>
      )}
    </>
  )
}
