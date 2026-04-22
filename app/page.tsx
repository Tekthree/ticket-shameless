import { getEvents } from '@/lib/events'

export const dynamic = 'force-dynamic'
import HeroSection from '@/components/home/HeroSection'
import Ticker from '@/components/home/Ticker'
import EventsSection from '@/components/home/EventsSection'
import AboutSection from '@/components/home/AboutSection'
import GallerySection from '@/components/home/GallerySection'
import NewsletterSection from '@/components/home/NewsletterSection'
import HomeClient from '@/components/home/HomeClient'

export default async function Home() {
  let events: any[] = []
  try {
    const result = await Promise.race([
      getEvents(4),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
    events = result as any[]
  } catch {
    // Supabase not connected or timed out — renders with placeholder events
  }

  return (
    <div style={{ background: '#1c1917' }}>
      <HomeClient />
      <HeroSection />
      <Ticker />
      <EventsSection events={events} />
      <AboutSection />
      <GallerySection />
      <NewsletterSection />
    </div>
  )
}
