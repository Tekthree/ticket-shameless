import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import EventForm from '@/components/EventForm'
import { getEventById } from '@/lib/events'
import { Card } from '@/components/ui/card'

export async function generateMetadata({ 
  params 
}: { 
  params: { id: string } 
}): Promise<Metadata> {
  const event = await getEventById(params.id)
  
  if (!event) {
    return {
      title: 'Event Not Found - Shameless Admin',
    }
  }
  
  return {
    title: `Edit ${event.title} - Shameless Admin`,
    description: `Edit details for ${event.title}`,
  }
}

export default async function EditEventPage({ 
  params 
}: { 
  params: { id: string }
}) {
  const event = await getEventById(params.id)
  
  if (!event) {
    notFound()
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Edit Event: {event.title}</h1>
      
      <Card className="p-6">
        <EventForm event={event} />
      </Card>
    </div>
  )
}
