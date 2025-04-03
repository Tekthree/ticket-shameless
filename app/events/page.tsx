import { Metadata } from 'next'
import EventCard from '@/components/EventCard'
import { getEvents } from '@/lib/events'

export const metadata: Metadata = {
  title: 'Events - Shameless Productions',
  description: 'Browse upcoming Shameless electronic music events in Seattle',
}

export default async function EventsPage() {
  const events = await getEvents()
  
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-12 text-center">Upcoming Events</h1>
      
      {events.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No events currently scheduled</h2>
          <p className="text-lg text-gray-600">
            Check back soon for upcoming Shameless Productions events!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
