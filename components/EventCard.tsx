import Link from 'next/link'
import Image from 'next/image'
import { Event } from '@/lib/events'
import { formatDate } from '@/lib/utils'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  // Use a default image if the event image is an external URL that might cause issues
  const imageUrl = event.image.startsWith('http') ? event.image : '/images/logo.png';

  return (
    <Link href={`/events/${event.slug}`} className="block">
      <div className="card group h-full flex flex-col">
        <div className="relative h-64 bg-gray-200">
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            className="object-cover group-hover:opacity-90 transition"
          />
          
          {event.soldOut && (
            <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 text-xs font-bold rounded">
              Sold Out
            </div>
          )}
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-xl font-bold mb-2 group-hover:text-red-600 transition">
            {event.title}
          </h3>
          
          <div className="text-gray-600 mb-4 flex-grow">
            <p>{formatDate(event.date)}</p>
            <p>{event.venue}</p>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-bold text-red-600">${event.price.toFixed(2)}</span>
            
            <span className="bg-black text-white text-sm px-3 py-1 rounded-full group-hover:bg-red-600 transition">
              View Details
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
