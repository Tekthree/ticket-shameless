import { Metadata } from 'next'
import EventForm from '@/components/EventForm'

export const metadata: Metadata = {
  title: 'Create New Event - Shameless Admin',
  description: 'Create a new event for Shameless Productions',
}

export default function CreateEventPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Create New Event</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <EventForm />
      </div>
    </div>
  )
}
