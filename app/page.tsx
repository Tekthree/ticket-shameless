import { Metadata } from 'next'
import { getEvents } from '@/lib/events'
import type { Event } from '@/lib/db'
import { getGalleryImages } from '@/lib/r2'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Simply Shameless — Seattle Underground House & Techno',
  description: "Seattle's underground house and techno collective since 2003. Upcoming events, DJ nights, and day parties at Monkey Loft, Massive Club, and venues across Seattle.",
  openGraph: {
    title: 'Simply Shameless — Seattle Underground House & Techno',
    description: "Seattle's underground house and techno collective since 2003. Upcoming events at Monkey Loft and beyond.",
    url: 'https://simplyshameless.com',
    type: 'website',
    images: [{ url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/site/og-default.jpg', width: 1280, height: 1080, alt: 'Simply Shameless — Seattle Underground House & Techno' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simply Shameless — Seattle Underground House & Techno',
    description: "Seattle's underground house and techno collective since 2003.",
  },
  alternates: {
    canonical: 'https://simplyshameless.com',
  },
}
import HeroSection from '@/components/home/HeroSection'
import Ticker from '@/components/home/Ticker'
import EventsSection from '@/components/home/EventsSection'
import AboutSection from '@/components/home/AboutSection'
import GallerySection from '@/components/home/GallerySection'
import NewsletterSection from '@/components/home/NewsletterSection'
import HomeClient from '@/components/home/HomeClient'

const FOLDER_EVENT_MAP: Record<string, string> = {
  'Deckd-Out-Pride-2026-images': 'deckd-out-pride-2026',
  'Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images': 'club-yes-anniversary',
  'Picflow%20Images%20Dec%2010': 'breakfast-club-dec',
  'Reverie%20Society-image-collette%204-12-26': 'reverie-society-apr-26',
  'The%20Breakfast%20Club%202024%20Part%201%20images': 'breakfast-club-2024',
}

function toGalleryImage(url: string) {
  const folder = url.split('/r2.dev/')[1]?.split('/')[0] ?? ''
  return { src: url, eventId: FOLDER_EVENT_MAP[folder] ?? 'club-yes-anniversary' }
}

export default async function Home() {
  let events: Event[] = []
  let galleryImages: string[] = []
  try {
    const result = await Promise.race([
      getEvents(50),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
    events = result as Event[]
  } catch {
    // DB not connected or timed out — renders with placeholder events
  }
  try {
    galleryImages = await getGalleryImages('', 100)
  } catch {
    // R2 not configured — renders placeholder gallery
  }

  const galleryImageObjects = galleryImages
    .filter(url => !url.includes('/about/'))
    .map(toGalleryImage)

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Simply Shameless',
    url: 'https://simplyshameless.com',
    logo: 'https://simplyshameless.com/shameless-logo.png',
    description: "Seattle's underground house and techno collective since 2003.",
    foundingDate: '2003',
    location: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Seattle', addressRegion: 'WA', addressCountry: 'US' } },
    sameAs: [
      'https://www.instagram.com/simplyshameless',
      'https://www.facebook.com/simplyshameless',
      'https://soundcloud.com/simplyshameless',
    ],
  }

  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Simply Shameless',
    url: 'https://simplyshameless.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: 'https://simplyshameless.com/events?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      <div style={{ background: '#1c1917' }}>
        <HomeClient />
        <HeroSection nextEvent={events[0] ?? null} />
        <Ticker />
        <EventsSection events={events.slice(0, 6)} />
        <AboutSection />
        <GallerySection images={galleryImageObjects} />
        <NewsletterSection />
      </div>
    </>
  )
}
