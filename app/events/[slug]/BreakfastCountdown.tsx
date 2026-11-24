'use client'

import { useEffect, useState } from 'react'
import styles from './breakfast-club.module.css'

const DOORS = Date.parse('2027-01-01T04:00:00-08:00')

export default function BreakfastCountdown() {
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, DOORS - Date.now()))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  if (left === 0) return <p className={styles.count}>Breakfast is served</p>
  const seconds = left === null ? null : Math.floor(left / 1000)
  const parts = [
    ['D', seconds === null ? null : Math.floor(seconds / 86400)],
    ['H', seconds === null ? null : Math.floor(seconds / 3600) % 24],
    ['M', seconds === null ? null : Math.floor(seconds / 60) % 60],
    ['S', seconds === null ? null : seconds % 60],
  ] as const

  return <p className={styles.count} aria-hidden="true">
    {parts.map(([unit, value]) => (
      <span key={unit}>{value === null ? '--' : String(value).padStart(2, '0')}<small>{unit}</small></span>
    ))}
  </p>
}
