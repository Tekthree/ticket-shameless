'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import placeholders from './archive-placeholders.json'
import styles from './breakfast-club.module.css'

const blurBySource: Record<string, string> = placeholders
const photoSizes = '(max-width: 730px) 248px, (max-width: 1270px) 34vw, 432px'

export default function ArchiveMarquee({ photos }: { photos: { src: string; alt: string }[] }) {
  const strip = useRef<HTMLDivElement>(null)
  const repeat = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [warm, setWarm] = useState(false)

  useEffect(() => {
    const rail = strip.current
    if (!rail) return
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      setWarm(true)
      observer.disconnect()
    }, { rootMargin: '1400px 0px' })
    observer.observe(rail)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setPlaying(!motion.matches)
    sync()
    motion.addEventListener('change', sync)
    return () => motion.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const rail = strip.current
    const copy = repeat.current
    if (!rail || !copy || !playing) return
    let frame = 0
    let previous = 0
    let position = rail.scrollLeft
    let visible = false
    const observer = new IntersectionObserver(entries => { visible = entries[entries.length - 1].isIntersecting })
    observer.observe(rail)
    const tick = (now: number) => {
      if (visible && previous && !rail.matches(':hover, :focus-within')) {
        const length = copy.offsetLeft - (rail.firstElementChild as HTMLElement).offsetLeft
        if (length > 0) {
          position = (position + Math.min(now - previous, 40) * .035) % length
          rail.scrollLeft = position
        }
      }
      previous = now
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [playing])

  function photoProps(src: string) {
    const blur = blurBySource[src]
    return {
      sizes: photoSizes,
      loading: warm ? 'eager' as const : 'lazy' as const,
      placeholder: blur ? 'blur' as const : 'empty' as const,
      blurDataURL: blur,
    }
  }

  function move(direction: number) {
    const rail = strip.current
    if (!rail) return
    setPlaying(false)
    rail.scrollBy({ left: direction * rail.clientWidth * .8, behavior: 'auto' })
  }

  return <>
    <div ref={strip} className={styles.photos} aria-label="Past Breakfast Club photos" role="region" tabIndex={0}
      onPointerDown={() => setPlaying(false)} onWheel={() => setPlaying(false)} onKeyDown={() => setPlaying(false)}>
      <div className={styles.photoRow}>
        {photos.map(({ src, alt }, index) => <a key={src} href={src} data-analytics-event="festival_photo_click" data-analytics-target={index + 1}><Image src={src} alt={alt} fill {...photoProps(src)} /></a>)}
      </div>
      <div ref={repeat} className={styles.photoRow} aria-hidden="true">
        {photos.map(({ src }) => <div key={src}><Image src={src} alt="" fill {...photoProps(src)} /></div>)}
      </div>
    </div>
    <div className={styles.archiveControls}>
      <button type="button" onClick={() => move(-1)} aria-label="Scroll photos left">←</button>
      <button type="button" onClick={() => setPlaying(value => !value)}>{playing ? 'Pause photos' : 'Play photos'}</button>
      <button type="button" onClick={() => move(1)} aria-label="Scroll photos right">→</button>
    </div>
  </>
}
