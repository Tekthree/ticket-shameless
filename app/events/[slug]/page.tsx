import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventBySlug, getEventLineup, getEvents } from '@/lib/events'
import EventPageClient from './EventPageClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const event = await getEventBySlug(params.slug)
  if (!event) return { title: 'Event Not Found - Shameless Productions' }

  return {
    title: `${event.title} - Shameless Productions`,
    description: event.description ?? `${event.title} at ${event.venue}`,
    openGraph: {
      title: `${event.title} - Shameless Productions`,
      description: event.description ?? `${event.title} at ${event.venue}`,
      images: event.image_url ? [event.image_url] : [],
      type: 'website',
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

  return <EventPageClient event={event} lineup={lineup} otherEvents={otherEvents} />
}
