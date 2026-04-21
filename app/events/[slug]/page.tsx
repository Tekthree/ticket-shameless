import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventBySlug, getEventLineup } from '@/lib/events'
import EventPageClient from './EventPageClient'

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
  const [event, lineup] = await Promise.all([
    getEventBySlug(params.slug),
    getEventBySlug(params.slug).then(e => e ? getEventLineup(e.id) : []),
  ])

  if (!event) notFound()

  return <EventPageClient event={event} lineup={lineup} />
}
