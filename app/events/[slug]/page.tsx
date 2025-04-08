import { Metadata } from 'next'
import { getEventBySlug } from '@/lib/events'
import { formatDate } from '@/lib/utils'
import EventPageClient from './EventPageClient'

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const event = await getEventBySlug(params.slug)
  
  if (!event) {
    return {
      title: 'Event Not Found - Shameless Productions',
    }
  }
  
  return {
    title: `${event.title} - Shameless Productions`,
    description: `${event.title} at ${event.venue} on ${formatDate(event.date)}`,
    openGraph: {
      title: `${event.title} - Shameless Productions`,
      description: `${event.title} at ${event.venue} on ${formatDate(event.date)}`,
      images: [event.image],
      type: 'website',
    },
  }
}

export default async function EventPage({ 
  params 
}: { 
  params: { slug: string }
}) {
  const event = await getEventBySlug(params.slug)
  
  if (!event) {
    return null // This will be handled by the notFound() in the client component
  }
  
  return (
    <EventPageClient event={event} />
  )
}
