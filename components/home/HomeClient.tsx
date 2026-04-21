'use client'

import { useState, useEffect } from 'react'
import PageLoader from './PageLoader'

export default function HomeClient() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 800)
    return () => clearTimeout(t)
  }, [])

  return <PageLoader done={loaded} />
}
