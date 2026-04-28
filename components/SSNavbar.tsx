'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const C = {
  darkDeep: '#111110',
  darkBorder: 'rgba(255,255,255,0.07)',
  darkText: '#f0ece6',
  darkMuted: '#7a7068',
  red: '#c9321a',
  redDeep: '#a82614',
}

const NAV_LINKS: [string, string][] = [
  ['Events',  '/events'],
  ['DJs',     '/djs'],
  ['Gallery', '/gallery'],
  ['Merch',   '/shop'],
  ['About',   '/#about'],
]

const SOCIALS = [
  { label: 'Instagram',        href: 'https://www.instagram.com/shamelessseattle/' },
  { label: 'Facebook',         href: 'https://www.facebook.com/shamelessinseattle/' },
  { label: 'SoundCloud',       href: 'https://soundcloud.com/shamelessinseattle' },
  { label: 'Resident Advisor', href: 'https://ra.co/promoters/13758' },
]

export default function SSNavbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [menuKey,   setMenuKey]   = useState(0)
  const pathname = usePathname()

  const isEventPage = !!pathname?.match(/^\/events\/.+/)
  const isDJPage    = !!pathname?.match(/^\/djs\/.+/)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    if (menuOpen) setMenuKey(k => k + 1)
  }, [menuOpen])

  const navBg     = scrolled || menuOpen ? 'rgba(17,17,16,0.97)' : 'transparent'
  const navBlur   = scrolled || menuOpen ? 'blur(24px)' : 'none'
  const navBorder = scrolled ? `1px solid ${C.darkBorder}` : '1px solid transparent'

  function isActive(href: string) {
    if (href === '/#about') return false
    if (href === '/events') return pathname === '/events' || isEventPage
    if (href === '/djs')    return pathname === '/djs'    || isDJPage
    return pathname === href
  }

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 4vw, 56px)',
        background: navBg,
        backdropFilter: navBlur,
        borderBottom: navBorder,
        transition: 'background 0.35s, backdrop-filter 0.35s, border-color 0.35s',
      }}>

        {/* ── LEFT: logo + back-breadcrumb on detail pages ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <Link href="/" style={{ flexShrink: 0 }}>
            <Image src="/shameless-logo.png" alt="Simply Shameless" width={120} height={38}
              style={{ height: 30, width: 'auto' }} priority />
          </Link>
          {(isEventPage || isDJPage) && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 16 }}>|</span>
              <Link
                href={isEventPage ? '/events' : '/djs'}
                style={{
                  color: C.darkText, textDecoration: 'none',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontWeight: 700, fontSize: 13,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  opacity: 0.7,
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {isEventPage ? 'All Events' : 'All DJs'}
              </Link>
            </>
          )}
        </div>

        {/* ── CENTER: desktop nav links ── */}
        <div className="ss-desktop-links" style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          gap: 36, alignItems: 'center',
        }}>
          {NAV_LINKS.map(([label, href]) => (
            <Link key={label} href={href} style={{
              color: isActive(href) ? C.darkText : 'rgba(240,236,230,0.5)',
              textDecoration: 'none',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 700, fontSize: 15,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              position: 'relative', paddingBottom: 2,
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = C.darkText)}
              onMouseLeave={e => (e.currentTarget.style.color = isActive(href) ? C.darkText : 'rgba(240,236,230,0.5)')}
            >
              {label}
              {isActive(href) && (
                <span style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: 2, background: C.red,
                }} />
              )}
            </Link>
          ))}
        </div>

        {/* ── RIGHT: Get Tickets (desktop) + hamburger (mobile) ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

          {/* Get Tickets — shown only on desktop via CSS */}
          <Link href="/events" className="ss-get-tickets" style={{
            background: C.red, color: '#fff', textDecoration: 'none',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 900, fontSize: 14,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            padding: '11px 28px',
            transition: 'background 0.2s, transform 0.12s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = C.redDeep; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = C.red; e.currentTarget.style.transform = 'translateY(0)' }}
          >Get Tickets</Link>

          {/* Hamburger — shown only on mobile via CSS (no inline display so CSS wins) */}
          <button
            className="ss-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 8, flexDirection: 'column', gap: 5, alignItems: 'flex-end',
            }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span style={{
              display: 'block', width: 24, height: 2, background: C.darkText,
              transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
              transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
            }} />
            <span style={{
              display: 'block', width: 16, height: 2, background: C.darkText,
              transition: 'opacity 0.2s',
              opacity: menuOpen ? 0 : 1,
            }} />
            <span style={{
              display: 'block', width: 24, height: 2, background: C.darkText,
              transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
              transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
            }} />
          </button>
        </div>
      </nav>

      {/* ── MOBILE FULLSCREEN OVERLAY — hidden on desktop via CSS ── */}
      <div className="ss-mobile-overlay" style={{
        position: 'fixed', inset: 0, zIndex: 290,
        background: C.darkDeep,
        flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        opacity: menuOpen ? 1 : 0,
        pointerEvents: menuOpen ? 'auto' : 'none',
        transition: 'opacity 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Logo top-left */}
        <div style={{ position: 'absolute', top: 18, left: 20 }}>
          <Image src="/shameless-logo.png" alt="Simply Shameless" width={120} height={38}
            style={{ height: 30, width: 'auto' }} />
        </div>

        {/* Stagger-animated links — remount on each open via key */}
        <div key={menuKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {NAV_LINKS.map(([label, href], i) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)} style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(40px, 12vw, 56px)',
              lineHeight: 1,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
              color: isActive(href) ? C.red : C.darkText,
              textDecoration: 'none',
              padding: '10px 0',
              transition: 'color 0.2s',
              animation: `ssNavFadeIn 0.35s ease ${i * 0.06}s both`,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = C.red)}
              onMouseLeave={e => (e.currentTarget.style.color = isActive(href) ? C.red : C.darkText)}
            >{label}</Link>
          ))}

          <Link href="/events" onClick={() => setMenuOpen(false)} style={{
            marginTop: 32,
            background: C.red, color: '#fff', textDecoration: 'none',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 900, fontSize: 18,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            padding: '18px 52px',
            animation: `ssNavFadeIn 0.35s ease ${NAV_LINKS.length * 0.06 + 0.04}s both`,
          }}>Get Tickets</Link>
        </div>

        {/* Socials at bottom */}
        <div style={{
          position: 'absolute', bottom: 40,
          display: 'flex', gap: 24, flexWrap: 'wrap',
          justifyContent: 'center', padding: '0 20px',
        }}>
          {SOCIALS.map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              style={{
                color: C.darkMuted, textDecoration: 'none',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: 700, fontSize: 13,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = C.darkText)}
              onMouseLeave={e => (e.currentTarget.style.color = C.darkMuted)}
            >{label}</a>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Mobile-first: hamburger + overlay visible, desktop links hidden */
        .ss-hamburger      { display: flex; }
        .ss-mobile-overlay { display: flex; }
        .ss-desktop-links  { display: none; }
        .ss-get-tickets    { display: none; }

        /* Desktop: flip everything */
        @media (min-width: 768px) {
          .ss-hamburger      { display: none; }
          .ss-mobile-overlay { display: none; }
          .ss-desktop-links  { display: flex; }
          .ss-get-tickets    { display: inline-block; }
        }

        @keyframes ssNavFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </>
  )
}
