'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

const ALLOWED_HOST = 'pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'

function safeUrl(url: string): string | null {
  try {
    const { hostname } = new URL(url)
    return hostname === ALLOWED_HOST ? url : null
  } catch { return null }
}

function pickRandom(arr: string[], n: number): string[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

export default function EventPhotoStrip({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null

  const [display, setDisplay] = useState(images.slice(0, 10))
  useEffect(() => { setDisplay(pickRandom(images, Math.min(10, images.length))) }, [])

  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps',
  })

  return (
    <div style={{ margin: '28px 0', width: '100%' }}>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {display.map((url, i) => {
              const safe = safeUrl(url) ?? url
              return (
                <div
                  key={i}
                  style={{
                    flexShrink: 0,
                    width: 260,
                    height: 200,
                    borderRadius: 'var(--ss-radius)',
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#252220',
                  }}
                >
                  <Image
                    src={safe}
                    alt={`Event photo ${i + 1}`}
                    fill
                    sizes="260px"
                    style={{ objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)' }}
                    className="ep-strip-img"
                  />
                </div>
              )
            })}
          </div>
        </div>
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 80,
          background: 'linear-gradient(to right, transparent, #1c1917)',
          pointerEvents: 'none', zIndex: 2,
        }} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.ep-strip-img:hover { transform: scale(1.04); }` }} />
    </div>
  )
}
