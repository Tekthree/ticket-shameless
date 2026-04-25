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
  const isDJPage = pathname?.startsWith('/djs/') && pathname !== '/djs'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  const mainLinks: [string, string][] = [
    ['Events', '/events'],
    ['DJs', '/djs'],
    ['Merch', '/shop'],
    ['Gallery', '/gallery'],
    ['About', '/#about'],
  ]

  const navLinks = isEventPage
    ? mainLinks.filter(([l]) => l !== 'Events')
    : isDJPage
    ? mainLinks.filter(([l]) => l !== 'DJs')
    : mainLinks

  const linkBase: React.CSSProperties = {
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
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 300,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(20px, 4vw, 56px)',
        background: scrolled ? 'rgba(17,17,16,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'background 0.35s, border-color 0.35s, backdrop-filter 0.35s',
      }}>
        {/* Left: logo + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ flexShrink: 0 }}>
            <Image src="/shameless-logo.png" alt="Simply Shameless" width={120} height={38} style={{ height: 30, width: 'auto' }} priority />
          </Link>
          {(isEventPage || isDJPage) && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 16 }}>|</span>
              <Link href={isEventPage ? '/events' : '/djs'} style={{ ...linkBase, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {isEventPage ? 'All Events' : 'All DJs'}
              </Link>
            </>
          )}
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex" style={{ gap: 32, alignItems: 'center' }}>
          {navLinks.map(([label, href]) => (
            <Link key={label} href={href} style={linkBase}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.55')}
            >{label}</Link>
          ))}
          {!isEventPage && !isDJPage && (
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
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, flexShrink: 0, position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span style={{
            position: 'absolute', width: 22, height: 2, background: '#f0ece6', borderRadius: 1,
            top: '50%', left: '50%',
            transform: menuOpen
              ? 'translate(-50%, -50%) rotate(45deg)'
              : 'translate(-50%, calc(-50% - 5px))',
            transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
          }} />
          <span style={{
            position: 'absolute', width: 22, height: 2, background: '#f0ece6', borderRadius: 1,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: menuOpen ? 0 : 1,
            transition: 'opacity 0.2s',
          }} />
          <span style={{
            position: 'absolute', width: 22, height: 2, background: '#f0ece6', borderRadius: 1,
            top: '50%', left: '50%',
            transform: menuOpen
              ? 'translate(-50%, -50%) rotate(-45deg)'
              : 'translate(-50%, calc(-50% + 5px))',
            transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </button>
      </nav>

      {/* Mobile full-screen overlay */}
      <div className="md:hidden" style={{
        position: 'fixed',
        inset: 0,
        zIndex: 290,
        background: 'rgba(17,17,16,0.98)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '80px clamp(28px, 8vw, 60px) 40px',
        opacity: menuOpen ? 1 : 0,
        pointerEvents: menuOpen ? 'auto' : 'none',
        transition: 'opacity 0.3s cubic-bezier(0.22,1,0.36,1)',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {navLinks.map(([label, href], i) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)} style={{
              color: '#f0ece6',
              textDecoration: 'none',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(38px, 10vw, 60px)',
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
              lineHeight: 1.1,
              paddingBottom: 20,
              marginBottom: 20,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              transition: 'color 0.15s, transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.3s',
              transform: menuOpen ? 'translateY(0)' : 'translateY(16px)',
              opacity: menuOpen ? 1 : 0,
              transitionDelay: `${80 + i * 40}ms`,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c9321a')}
              onMouseLeave={e => (e.currentTarget.style.color = '#f0ece6')}
            >{label}</Link>
          ))}
        </div>

        <Link href="/events" onClick={() => setMenuOpen(false)} style={{
          display: 'block',
          background: '#c9321a',
          color: '#fff',
          textDecoration: 'none',
          fontFamily: 'var(--font-barlow), sans-serif',
          fontWeight: 900,
          fontSize: 18,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '18px 0',
          textAlign: 'center',
          marginTop: 16,
          transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.3s',
          transitionDelay: `${80 + navLinks.length * 40}ms`,
          transform: menuOpen ? 'translateY(0)' : 'translateY(16px)',
          opacity: menuOpen ? 1 : 0,
        }}>Get Tickets</Link>

        <div style={{ marginTop: 'auto', paddingTop: 48 }}>
          <Image src="/shameless-logo.png" alt="Simply Shameless" width={100} height={32} style={{ height: 22, width: 'auto', opacity: 0.3 }} />
        </div>
      </div>
    </>
  )
}
