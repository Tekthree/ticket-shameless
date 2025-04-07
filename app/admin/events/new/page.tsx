import { Metadata } from 'next'
import EventForm from '@/components/EventForm'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Create New Event - Shameless Admin',
  description: 'Create a new event for Shameless Productions',
}

export default function CreateEventPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl mb-8 font-qikober">Create New Event</h1>
      
      <Card className="p-6">
        <EventForm />
      </Card>
    </div>
  )
}
