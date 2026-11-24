'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './breakfast-club.module.css'

export default function FlyerVideo() {
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const element = video.current
    if (!element) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      if (motion.matches) element.pause()
      else void element.play().catch(() => {})
    }
    motion.addEventListener('change', sync)
    sync()
    return () => motion.removeEventListener('change', sync)
  }, [])

  return <>
    <video ref={video} muted loop playsInline preload="none"
      poster="/breakfast-club-2027/square-flyer.webp"
      aria-label="Animated Breakfast Club 2027 flyer"
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
      <source src="/breakfast-club-2027/square-flyer.mp4" type="video/mp4" />
    </video>
    <button className={styles.motion} type="button" aria-label={playing ? 'Pause animation' : 'Play animation'} onClick={() => {
      const element = video.current
      if (!element) return
      if (element.paused) void element.play().catch(() => {})
      else element.pause()
    }}><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d={playing ? 'M6 4h4v16H6zM14 4h4v16h-4z' : 'M7 4l13 8-13 8z'} />
    </svg></button>
  </>
}
