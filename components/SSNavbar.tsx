'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function SSNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const isEventPage = pathname?.startsWith('/events/') && pathname !== '/events'
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

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

  const navLinks = isEventPage
    ? [['Merch', '/shop'], ['About', '/#about']]
    : [['Events', '/events'], ['Merch', '/shop'], ['About', '/#about']]

  return (
    <>
      <nav ref={menuRef} style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 200,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(20px, 4vw, 48px)',
        background: scrolled ? 'rgba(17,17,16,0.97)' : 'rgba(17,17,16,0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.35s, border-color 0.35s',
      }}>
        {/* Left side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <Link href="/" style={{ flexShrink: 0 }}>
            <Image src="/shameless-logo.png" alt="Simply Shameless" width={120} height={38} style={{ height: 30, width: 'auto' }} priority />
          </Link>
          {isEventPage && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 16, flexShrink: 0 }}>|</span>
              <Link href="/events" style={{ ...linkStyle, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', fontSize: 13 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                All Events
              </Link>
            </>
          )}
        </div>

        {/* Desktop right */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="hidden md:flex">
          {navLinks.map(([label, href]) => (
            <Link key={label} href={href} style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.55')}
            >{label}</Link>
          ))}
          {!isEventPage && (
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
          style={{ background: 'none', border: 'none', color: '#f0ece6', cursor: 'pointer', padding: 8, flexShrink: 0 }}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </nav>

      {/* Mobile menu — slides down from nav */}
      <div className="md:hidden" style={{
        position: 'fixed',
        top: 64,
        left: 0,
        right: 0,
        zIndex: 199,
        background: 'rgba(17,17,16,0.98)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
        maxHeight: menuOpen ? 400 : 0,
        transition: 'max-height 0.35s cubic-bezier(0.22,1,0.36,1)',
        pointerEvents: menuOpen ? 'auto' : 'none',
      }}>
        <div style={{ padding: '28px 28px 36px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {isEventPage && (
            <Link href="/events" onClick={() => setMenuOpen(false)} style={{
              ...linkStyle, opacity: 1, fontSize: 24, letterSpacing: '0.1em',
              paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              All Events
            </Link>
          )}
          {navLinks.map(([label, href], i) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)} style={{
              ...linkStyle, opacity: 1, fontSize: 24, letterSpacing: '0.1em',
              paddingBottom: i < navLinks.length - 1 ? 20 : 0,
              borderBottom: i < navLinks.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              marginBottom: i < navLinks.length - 1 ? 20 : 0,
            }}>{label}</Link>
          ))}
          {!isEventPage && (
            <Link href="/events" onClick={() => setMenuOpen(false)} style={{
              display: 'block', background: '#c9321a', color: '#fff', textDecoration: 'none',
              fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 16,
              letterSpacing: '0.12em', textTransform: 'uppercase', padding: '16px 0',
              textAlign: 'center', marginTop: 24,
            }}>Get Tickets</Link>
          )}
        </div>
      </div>
    </>
  )
}
