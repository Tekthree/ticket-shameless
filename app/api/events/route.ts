import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })
  
  if (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
  
  return NextResponse.json(events)
}

export async function POST(request: Request) {
  const supabase = createClient()
  
  try {
    const eventData = await request.json()
    console.log('Received event data:', eventData)
    
    // Extract lineup to handle separately
    const { lineup, ...eventDataWithoutLineup } = eventData
    
    // Generate a slug from the title
    const slug = eventData.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
    
    // Convert camelCase to snake_case for database columns
    const dbData = {
      title: eventDataWithoutLineup.title,
      slug,
      description: eventDataWithoutLineup.description,
      date: eventDataWithoutLineup.date,
      time: eventDataWithoutLineup.time,
      venue: eventDataWithoutLineup.venue,
      address: eventDataWithoutLineup.address,
      image: eventDataWithoutLineup.image,
      price: eventDataWithoutLineup.price,
      tickets_total: eventDataWithoutLineup.ticketsTotal,
      tickets_remaining: eventDataWithoutLineup.ticketsRemaining,
      sold_out: eventDataWithoutLineup.soldOut || false,
      promoter: eventDataWithoutLineup.promoter,
      age_restriction: eventDataWithoutLineup.ageRestriction
    }
    
    console.log('Inserting into database:', dbData)
    
    // Insert event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert([dbData])
      .select()
      .single()
    
    if (eventError) {
      console.error('Error creating event:', eventError)
      return NextResponse.json({ error: eventError }, { status: 500 })
    }
    
    // Insert lineup if provided
    if (lineup && Array.isArray(lineup) && lineup.length > 0) {
      const eventArtistInserts = lineup.map(artist => ({
        event_id: event.id,
        artist_id: artist.id,
        performance_time: artist.time || null
      }))
      
      const { error: lineupError } = await supabase
        .from('event_artists')
        .insert(eventArtistInserts)
      
      if (lineupError) {
        console.error('Error inserting lineup:', lineupError)
        // Continue anyway, as the event was created successfully
      }
    }
    
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
  }
}
