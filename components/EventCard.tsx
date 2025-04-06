import Link from 'next/link'
import Image from 'next/image'
import { Event } from '@/lib/events'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Badge } from '@/components/ui/badge'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  // Use a default image if the event image is an external URL that might cause issues
  const imageUrl = event.image.startsWith('http') ? event.image : '/images/logo.png';

  return (
    <Link href={`/events/${event.slug}`} className="block h-full">
      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
        <div className="relative h-64 bg-muted">
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            className="object-cover transition-opacity hover:opacity-90"
          />
          
          {event.soldOut && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              Sold Out
            </Badge>
          )}
        </div>
        
        <CardContent className="pt-6 pb-2 flex-grow">
          <h3 className="text-xl font-bold mb-2 group-hover:text-shameless-red transition-colors">
            {event.title}
          </h3>
          
          <div className="text-muted-foreground mb-4 space-y-1">
            <p className="flex items-center">
              <Icons.calendar className="mr-2 h-4 w-4" />
              {formatDate(event.date)}
            </p>
            <p className="flex items-center">
              <Icons.mapPin className="mr-2 h-4 w-4" />
              {event.venue}
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between items-center pt-0 pb-6">
          <span className="font-bold text-shameless-red">${event.price.toFixed(2)}</span>
          
          <Button variant="outline" size="sm" className="gap-1">
            View Details
            <Icons.arrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
