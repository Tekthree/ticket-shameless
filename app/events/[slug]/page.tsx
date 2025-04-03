import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getEventBySlug } from '@/lib/events'
import BuyTicketButton from '@/components/BuyTicketButton'
import { formatDate } from '@/lib/utils'

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
  }
}

export default async function EventPage({ 
  params 
}: { 
  params: { slug: string }
}) {
  const event = await getEventBySlug(params.slug)
  
  if (!event) {
    notFound()
  }
  
  // Use a default image if the event image is an external URL that might cause issues
  const imageUrl = event.image.startsWith('http') ? event.image : '/images/logo.png';
  
  return (
    <div>
      {/* Hero Image */}
      <div className="relative h-[50vh] bg-black">
        <Image
          src={imageUrl}
          alt={event.title}
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Event Title & Basic Info */}
          <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
          <p className="text-xl mb-6">
            {event.venue} • {formatDate(event.date)}, {event.time}
          </p>
          
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            {/* Event Description */}
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold mb-4">About This Event</h2>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: event.description }} />
            </div>
            
            {/* Ticket Information */}
            <div className="md:w-1/3 bg-gray-100 p-6 rounded-lg">
              <p className="text-2xl font-bold mb-4">${event.price.toFixed(2)}</p>
              
              {event.soldOut ? (
                <div>
                  <p className="text-gray-600 mb-6">This event is sold out</p>
                  <button 
                    className="w-full py-2 bg-gray-400 text-white font-bold rounded cursor-not-allowed"
                    disabled
                  >
                    Sold Out
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    {event.ticketsRemaining <= 20 
                      ? `Only ${event.ticketsRemaining} tickets remaining!` 
                      : 'Tickets are available'}
                  </p>
                  
                  <BuyTicketButton 
                    eventId={event.id} 
                    price={event.price}
                    title={event.title}
                  />
                </>
              )}
              
              <div className="mt-6 text-sm text-gray-500">
                {event.ageRestriction && (
                  <p className="mb-2">This is a {event.ageRestriction} event</p>
                )}
                <p className="mb-2">Presented by {event.promoter}</p>
              </div>
            </div>
          </div>
          
          {/* Lineup */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Lineup</h2>
            {event.lineup.map((artist) => (
              <div key={artist.id} className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                  {artist.image ? (
                    <Image
                      src={artist.image}
                      alt={artist.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300" />
                  )}
                </div>
                <div>
                  <p className="font-bold">{artist.name}</p>
                  {artist.time && <p className="text-gray-600">{artist.time}</p>}
                </div>
              </div>
            ))}
          </div>
          
          {/* Venue */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Venue</h2>
            <p className="font-bold mb-1">{event.venue}</p>
            <p className="text-gray-600 mb-4">{event.address}</p>
            
            <div className="h-64 bg-gray-200 rounded-lg mb-8">
              {/* Map would go here */}
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-gray-500">Map view of {event.venue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
