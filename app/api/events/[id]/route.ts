import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateEvent, getEventById } from '@/lib/events'

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
  const supabase = createClient()
  
  try {
    const updates = await request.json()
    console.log('Received update request for event:', id, updates)
    
    // Extract lineup to handle separately
    const { lineup, ...eventUpdatesWithoutLineup } = updates
    
    // Check if the event exists
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Map our client-side data structure to the database column names
    const dbData: Record<string, any> = {
      title: eventUpdatesWithoutLineup.title,
      description: eventUpdatesWithoutLineup.description,
      date: eventUpdatesWithoutLineup.date,
      time: eventUpdatesWithoutLineup.time,
      venue: eventUpdatesWithoutLineup.venue,
      address: eventUpdatesWithoutLineup.address,
      image: eventUpdatesWithoutLineup.image,
      price: eventUpdatesWithoutLineup.price,
      tickets_total: eventUpdatesWithoutLineup.ticketsTotal,
      tickets_remaining: eventUpdatesWithoutLineup.ticketsRemaining,
      sold_out: eventUpdatesWithoutLineup.soldOut,
      promoter: eventUpdatesWithoutLineup.promoter,
      age_restriction: eventUpdatesWithoutLineup.ageRestriction
    }
    
    // Remove undefined values
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key]
      }
    })
    
    // Update the event
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(dbData)
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating event:', updateError)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }
    
    // Handle lineup updates if provided
    if (lineup && Array.isArray(lineup)) {
      // First, delete existing lineup entries
      const { error: deleteError } = await supabase
        .from('event_artists')
        .delete()
        .eq('event_id', id)
      
      if (deleteError) {
        console.error('Error deleting existing lineup:', deleteError)
        // Continue anyway, as the event was updated successfully
      }
      
      // Then, insert new lineup entries
      if (lineup.length > 0) {
        const eventArtistInserts = lineup.map(artist => ({
          event_id: id,
          artist_id: artist.id,
          performance_time: artist.time || null
        }))
        
        const { error: insertError } = await supabase
          .from('event_artists')
          .insert(eventArtistInserts)
        
        if (insertError) {
          console.error('Error inserting new lineup:', insertError)
          // Continue anyway, as the event was updated successfully
        }
      }
    }
    
    // Fetch the event with lineup
    const event = await getEventById(id)
    
    return NextResponse.json(event)
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
  const supabase = createClient()
  
  try {
    // Delete event (cascade will take care of event_artists)
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting event:', error)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
