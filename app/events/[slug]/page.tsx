import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventBySlug, getEventLineup, getEvents } from '@/lib/events'
import EventPageClient from './EventPageClient'
import BreakfastClubPromo, { BREAKFAST_CLUB_2027 } from './BreakfastClubPromo'

export const revalidate = 86400

export async function generateStaticParams() {
  try {
    const events = await getEvents(50)
    return events.map(e => ({ slug: e.slug }))
  } catch {
    return []
  }
}

const SITE_URL = 'https://www.simplyshameless.com'
const BREAKFAST_CLUB_TITLE = 'The Breakfast Club 2027 — New Year’s Day in Seattle'
const BREAKFAST_CLUB_DESCRIPTION = 'Dance into 2027 at Monkey Loft in Seattle. The Breakfast Club runs January 1 from 4 AM to 4 PM, with DJs and live performances across three stages. 21+.'

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

  const isBreakfastClub = event.slug === BREAKFAST_CLUB_2027
  const title = isBreakfastClub ? BREAKFAST_CLUB_TITLE : event.title
  const shareTitle = isBreakfastClub ? title : `${title} | Simply Shameless`
  const dateStr = fmtDate(event.date)
  const description = (isBreakfastClub ? BREAKFAST_CLUB_DESCRIPTION : event.description)
    ?? `${dateStr} · ${event.venue}${event.address ? `, ${event.address}` : ''} · Seattle underground house and techno.`
  const rawImage = event.banner_url ?? event.image_url ?? event.square_image_url ?? 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/site/og-default.jpg'
  const imageUrl = rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`
  const url = `${SITE_URL}/events/${event.slug}`

  const image = {
    url: imageUrl,
    width: isBreakfastClub ? 1920 : 1200,
    height: isBreakfastClub ? 1005 : 630,
    alt: isBreakfastClub ? 'The Breakfast Club 2027 lineup flyer for New Year’s Day at Monkey Loft' : `${title} at ${event.venue}, Seattle`,
  }

  return {
    title,
    description,
    openGraph: {
      title: shareTitle,
      description,
      url,
      type: 'website',
      ...(isBreakfastClub ? { siteName: 'Simply Shameless', locale: 'en_US' } : {}),
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      ...(isBreakfastClub ? { site: '@simplyshameless' } : {}),
      images: [image],
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

  const isBreakfastClub = event.slug === BREAKFAST_CLUB_2027
  const [lineup, allEvents] = await Promise.all([
    getEventLineup(event.id),
    isBreakfastClub ? Promise.resolve([]) : getEvents(10),
  ])

  const otherEvents = allEvents.filter(e => e.id !== event.id).slice(0, 4)

  const isPast = new Date(event.date) < new Date()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: event.title,
    startDate: event.time_confirmed === false ? toSeattleISO(event.date).slice(0, 10) : toSeattleISO(event.date),
    ...(event.end_date && event.time_confirmed !== false ? { endDate: toSeattleISO(event.end_date) } : {}),
    eventStatus: isPast ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'MusicVenue',
      name: event.venue,
      address: {
        '@type': 'PostalAddress',
        streetAddress: isBreakfastClub ? '2915 1st Ave S' : event.address ?? '',
        ...(isBreakfastClub ? { postalCode: '98134' } : {}),
        addressLocality: 'Seattle',
        addressRegion: 'WA',
        addressCountry: 'US',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Shameless Productions',
      url: SITE_URL,
    },
    ...(lineup.length > 0 ? {
      performer: lineup.map(a => {
        const profileUrl = a.dj_slug ? `${SITE_URL}/djs/${a.dj_slug}` : null
        return {
          '@type': 'MusicGroup',
          name: isBreakfastClub && a.name === 'Magickat' ? 'MagicKat' : a.name,
          ...(profileUrl ? { url: profileUrl, sameAs: [profileUrl] } : {}),
        }
      }),
    } : {}),
    image: (() => {
      const rawImg = event.banner_url ?? event.image_url ?? event.square_image_url ?? '/shameless-logo.png'
      return rawImg.startsWith('http') ? rawImg : `${SITE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`
    })(),
    url: `${SITE_URL}/events/${event.slug}`,
    ...(event.payment_link ? {
      offers: {
        '@type': 'Offer',
        url: event.payment_link,
        ...(!isBreakfastClub || event.suggested_price != null
          ? { priceCurrency: 'USD', price: event.suggested_price ?? 0 }
          : {}),
        ...(!isBreakfastClub ? {
          validFrom: new Date(event.created_at).toISOString(),
          availability: isPast ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        } : {}),
      },
    } : {}),
    description: isBreakfastClub ? BREAKFAST_CLUB_DESCRIPTION : event.description ?? '',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {isBreakfastClub
        ? <BreakfastClubPromo event={event} lineup={lineup} />
        : <EventPageClient event={event} lineup={lineup} otherEvents={otherEvents} deferComments={new Date(event.end_date ?? event.date).getTime() < Date.now()} />}
    </>
  )
}
