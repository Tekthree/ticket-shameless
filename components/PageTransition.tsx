'use client'

import { useEffect, useRef, useState } from 'react'

export default function PageTransition() {
  const [active, setActive] = useState(true)
  const [fade, setFade] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (sessionStorage.getItem('ss-sting-seen')) {
      setActive(false) // already seen — instant hide, no transition
      return
    }
    sessionStorage.setItem('ss-sting-seen', '1')
    setFade(true) // enable fade-out for this session
    const v = videoRef.current
    if (!v) return
    v.play().catch(() => setActive(false))
  }, [])

  function dismiss() {
    setActive(false)
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#1c1917',
        opacity: active ? 1 : 0,
        pointerEvents: active ? 'all' : 'none',
        transition: fade ? 'opacity 0.5s ease' : 'none',
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        onEnded={dismiss}
        onError={dismiss}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      >
        <source src="/video/sting.webm" type="video/webm" />
        <source src="/video/sting.mp4" type="video/mp4" />
      </video>
    </div>
  )
}
