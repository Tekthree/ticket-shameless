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
    
    // Generate a slug from the title
    const slug = eventData.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
    
    const { data, error } = await supabase
      .from('events')
      .insert([{ ...eventData, slug }])
      .select()
    
    if (error) {
      console.error('Error creating event:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }
    
    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
  }
}
