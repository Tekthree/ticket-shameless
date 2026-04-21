import { NextResponse } from 'next/server'
import { getEventById, updateEvent, deleteEvent } from '@/lib/events'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  
  try {
    const event = await getEventById(id)
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' }, 
        { status: 404 }
      )
    }
    
    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' }, 
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  
  try {
    const updates = await request.json()
    console.log('Received update request for event:', id, updates)
    
    // Check if the event exists first
    const existingEvent = await getEventById(id)
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Update the event with the provided data
    const updatedEvent = await updateEvent(id, updates)
    
    if (!updatedEvent) {
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }
    
    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error('Error updating event:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  
  try {
    // Check if the event exists first
    const existingEvent = await getEventById(id)
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Delete the event
    const success = await deleteEvent(id)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}