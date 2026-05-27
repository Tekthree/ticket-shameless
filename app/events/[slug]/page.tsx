import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventBySlug, getEventLineup, getEvents } from '@/lib/events'
import EventPageClient from './EventPageClient'

export const revalidate = 60

const SITE_URL = 'https://simplyshameless.com'

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' })
}

// Convert a UTC date string to a Seattle-local ISO 8601 string with offset (e.g. 2025-06-14T21:00:00-07:00)
function toSeattleISO(dateStr: string): string {
  const date = new Date(dateStr)
  const local = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date).replace(' ', 'T')
  const utcMs = date.getTime()
  const laMs = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getTime()
  const offsetMin = Math.round((laMs - utcMs) / 60000)
  const sign = offsetMin >= 0 ? '+' : '-'
  const absMin = Math.abs(offsetMin)
  const hh = String(Math.floor(absMin / 60)).padStart(2, '0')
  const mm = String(absMin % 60).padStart(2, '0')
  return `${local}${sign}${hh}:${mm}`
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

  const isPast = new Date(event.date) < new Date()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: event.title,
    startDate: toSeattleISO(event.date),
    ...(event.end_date ? { endDate: toSeattleISO(event.end_date) } : {}),
    eventStatus: isPast ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
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
      performer: lineup.map(a => {
        const profileUrl = a.dj_slug ? `${SITE_URL}/djs/${a.dj_slug}` : null
        return {
          '@type': 'MusicGroup',
          name: a.name,
          ...(profileUrl ? { url: profileUrl, sameAs: [profileUrl] } : {}),
        }
      }),
    } : {}),
    ...(event.banner_url ?? event.image_url ? { image: event.banner_url ?? event.image_url } : {}),
    url: `${SITE_URL}/events/${event.slug}`,
    ...(event.payment_link ? {
      offers: {
        '@type': 'Offer',
        url: event.payment_link,
        priceCurrency: 'USD',
        ...(event.suggested_price != null ? { price: event.suggested_price } : {}),
        availability: isPast ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
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
