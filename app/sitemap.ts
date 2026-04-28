import { MetadataRoute } from 'next'
import { getEvents, getPastEvents, getDJs } from '@/lib/events'

const SITE_URL = 'https://simplyshameless.com'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [upcomingEvents, pastEvents, djs] = await Promise.all([
    getEvents(100).catch(() => []),
    getPastEvents(200).catch(() => []),
    getDJs().catch(() => []),
  ])

  const allEvents = [...upcomingEvents, ...pastEvents]

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/djs`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/shop`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ]

  const eventRoutes: MetadataRoute.Sitemap = allEvents.map(event => ({
    url: `${SITE_URL}/events/${event.slug}`,
    lastModified: new Date(event.date),
    changeFrequency: new Date(event.date) > new Date() ? 'daily' : 'monthly',
    priority: new Date(event.date) > new Date() ? 0.9 : 0.5,
  }))

  const djRoutes: MetadataRoute.Sitemap = djs.map(dj => ({
    url: `${SITE_URL}/djs/${dj.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...eventRoutes, ...djRoutes]
}
