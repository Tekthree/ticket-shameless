import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventBySlug, getEventLineup, getEvents } from '@/lib/events'
import EventPageClient from './EventPageClient'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://simplyshameless.com'

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const event = await getEventBySlug(params.slug)
  if (!event) return { title: 'Event Not Found' }

  const dateStr = fmtDate(event.date)
  const description = event.description
    ?? `${dateStr} · ${event.venue}${event.address ? `, ${event.address}` : ''} · Seattle underground house and techno.`
  const image = event.banner_url ?? event.image_url
  const url = `${SITE_URL}/events/${event.slug}`

  return {
    title: event.title,
    description,
    openGraph: {
      title: `${event.title} | Simply Shameless`,
      description,
      url,
      type: 'website',
      images: image ? [{ url: image, width: 1200, height: 630, alt: `${event.title} at ${event.venue}, Seattle` }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${event.title} | Simply Shameless`,
      description,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function EventPage({
  params,
}: {
  params: { slug: string }
}) {
  const event = await getEventBySlug(params.slug)
  if (!event) notFound()

  const [lineup, allEvents] = await Promise.all([
    getEventLineup(event.id),
    getEvents(10),
  ])

  const otherEvents = allEvents.filter(e => e.id !== event.id).slice(0, 4)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: event.title,
    startDate: event.date,
    ...(event.end_date ? { endDate: event.end_date } : {}),
    location: {
      '@type': 'MusicVenue',
      name: event.venue,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.address ?? '',
        addressLocality: 'Seattle',
        addressRegion: 'WA',
        addressCountry: 'US',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Simply Shameless',
      url: SITE_URL,
    },
    ...(lineup.length > 0 ? {
      performer: lineup.map(a => ({
        '@type': 'MusicGroup',
        name: a.name,
        ...(a.dj_slug ? { url: `${SITE_URL}/djs/${a.dj_slug}` } : {}),
      })),
    } : {}),
    ...(event.banner_url ?? event.image_url ? { image: event.banner_url ?? event.image_url } : {}),
    url: `${SITE_URL}/events/${event.slug}`,
    ...(event.payment_link ? {
      offers: {
        '@type': 'Offer',
        url: event.payment_link,
        priceCurrency: 'USD',
        ...(event.suggested_price != null ? { price: event.suggested_price } : {}),
        availability: 'https://schema.org/InStock',
      },
    } : {}),
    description: event.description ?? '',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventPageClient event={event} lineup={lineup} otherEvents={otherEvents} />
    </>
  )
}
