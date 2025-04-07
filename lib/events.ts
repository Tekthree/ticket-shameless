import { createClient } from '@/lib/supabase/server'

export type Artist = {
  id: string
  name: string
  image?: string
  time?: string
  bio?: string
  mix_url?: string
}

export type Event = {
  id: string
  title: string
  slug: string
  description: string
  date: string
  time: string
  venue: string
  address: string
  image: string
  price: number
  ticketsTotal: number
  ticketsRemaining: number
  soldOut: boolean
  promoter: string
  ageRestriction?: string
  lineup: Artist[]
  created_at: string
}

// Mock data to use only as a fallback if Supabase fails completely
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'An Evening With Shameless - 22nd Anniversary',
    slug: 'an-evening-with-shameless-22nd-anniversary',
    description: 'Join us for a special night celebrating 22 years of Shameless Productions. Featuring classic underground sounds and guest DJs.',
    date: '2025-07-18T20:00:00.000Z',
    time: '20:00',
    venue: 'The Sunset Tavern',
    address: '5433 Ballard Avenue Northwest, Seattle, WA 98107',
    image: '/images/logo.png', 
    price: 25.0,
    ticketsTotal: 200,
    ticketsRemaining: 150,
    soldOut: false,
    promoter: 'Shameless Productions',
    ageRestriction: '21+',
    lineup: [
      {
        id: '101',
        name: 'DJ Shameless',
        time: '20:00 - 22:00',
        bio: 'Founder of Shameless Productions and Seattle underground dance music legend.',
        mix_url: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3'
      },
      {
        id: '102',
        name: 'Guest DJ',
        time: '22:00 - 00:00'
      }
    ],
    created_at: '2025-01-15T12:00:00.000Z'
  },
  {
    id: '2',
    title: 'Shameless Underground: Deep Beats',
    slug: 'shameless-underground-deep-beats',
    description: 'Dive into the depths of electronic music with deep house, techno and ambient sounds.',
    date: '2025-08-15T21:00:00.000Z',
    time: '21:00',
    venue: 'Substation',
    address: '645 NW 45th St, Seattle, WA 98107',
    image: '/images/logo.png',
    price: 15.0,
    ticketsTotal: 150,
    ticketsRemaining: 100,
    soldOut: false,
    promoter: 'Shameless Productions',
    ageRestriction: '21+',
    lineup: [
      {
        id: '201',
        name: 'Deep State',
        time: '21:00 - 22:30',
        bio: 'Deep State brings the underground techno vibes with dark, hypnotic beats.',
        mix_url: 'https://soundcloud.com/deepstate/deep-techno-mix-2025'
      },
      {
        id: '202',
        name: 'Ambient Groove',
        time: '22:30 - 00:00'
      }
    ],
    created_at: '2025-02-01T12:00:00.000Z'
  },
  {
    id: '3',
    title: 'Shameless Summer Bash',
    slug: 'shameless-summer-bash',
    description: 'Celebrate summer with an outdoor dance party featuring the best electronic music in Seattle.',
    date: '2025-07-04T16:00:00.000Z',
    time: '16:00',
    venue: 'Myrtle Edwards Park',
    address: 'Myrtle Edwards Park, Seattle, WA 98121',
    image: '/images/logo.png',
    price: 20.0,
    ticketsTotal: 400,
    ticketsRemaining: 0,
    soldOut: true,
    promoter: 'Shameless Productions',
    ageRestriction: 'All Ages',
    lineup: [
      {
        id: '301',
        name: 'Summer Vibes',
        time: '16:00 - 18:00'
      },
      {
        id: '302',
        name: 'Sunset Sessions',
        time: '18:00 - 20:00'
      },
      {
        id: '303',
        name: 'Night Rhythm',
        time: '20:00 - 22:00'
      }
    ],
    created_at: '2025-02-15T12:00:00.000Z'
  }
];

// Fetch lineup for an event
async function getEventLineup(supabase: any, eventId: string): Promise<Artist[]> {
  const { data, error } = await supabase
    .from('event_artists')
    .select(`
      artist_id,
      performance_time,
      artists:artist_id (
        id,
        name,
        image,
        bio,
        mix_url
      )
    `)
    .eq('event_id', eventId);
  
  if (error || !data) {
    console.error('Error fetching event lineup:', error);
    return [];
  }
  
  // Transform the data to the expected format
  return data.map((item: any) => ({
    id: item.artist_id,
    name: item.artists.name,
    image: item.artists.image,
    time: item.performance_time,
    bio: item.artists.bio,
    mix_url: item.artists.mix_url
  }));
}

// Parse the event data from Supabase into the expected format
async function parseEventData(supabase: any, event: any): Promise<Event> {
  // Fetch lineup for this event
  const lineup = await getEventLineup(supabase, event.id);
  
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    date: event.date,
    time: event.time,
    venue: event.venue,
    address: event.address,
    image: event.image,
    price: event.price,
    ticketsTotal: event.tickets_total,
    ticketsRemaining: event.tickets_remaining,
    soldOut: event.sold_out || false,
    promoter: event.promoter,
    ageRestriction: event.age_restriction,
    lineup: lineup,
    created_at: event.created_at
  };
}

export async function getEvents(limit?: number) {
  try {
    const supabase = createClient();
    console.log('Fetching events from Supabase...');
    
    let query = supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching events from Supabase:', error);
      console.warn('Falling back to mock data due to Supabase error');
      return limit ? mockEvents.slice(0, limit) : mockEvents;
    }
    
    if (!data || data.length === 0) {
      console.warn('No events found in Supabase, falling back to mock data');
      return limit ? mockEvents.slice(0, limit) : mockEvents;
    }
    
    console.log(`Successfully fetched ${data.length} events from Supabase`);
    
    // Process each event to include lineup data
    const eventsWithLineup = await Promise.all(
      data.map(event => parseEventData(supabase, event))
    );
    
    return eventsWithLineup;
  } catch (error) {
    console.error('Exception when connecting to Supabase:', error);
    console.warn('Falling back to mock data due to exception');
    return limit ? mockEvents.slice(0, limit) : mockEvents;
  }
}

export async function getPastEvents(limit?: number) {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })
      .lt('date', new Date().toISOString()); // Only past events
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching past events:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Process each event to include lineup data
    const eventsWithLineup = await Promise.all(
      data.map(event => parseEventData(supabase, event))
    );
    
    return eventsWithLineup;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return [];
  }
}

export async function getEventBySlug(slug: string) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('Error fetching event by slug:', error);
      // Return a mock event when there's an error
      const mockEvent = mockEvents.find(e => e.slug === slug);
      return mockEvent || null;
    }
    
    if (!data) {
      return null;
    }
    
    // Add lineup data
    return parseEventData(supabase, data);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    // Return a mock event when there's an exception
    const mockEvent = mockEvents.find(e => e.slug === slug);
    return mockEvent || null;
  }
}

export async function getEventById(id: string) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching event by ID:', error);
      // Return a mock event when there's an error
      const mockEvent = mockEvents.find(e => e.id === id);
      return mockEvent || null;
    }
    
    if (!data) {
      return null;
    }
    
    // Add lineup data
    return parseEventData(supabase, data);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    // Return a mock event when there's an exception
    const mockEvent = mockEvents.find(e => e.id === id);
    return mockEvent || null;
  }
}

// Function to update an event
export async function updateEvent(id: string, eventData: Partial<Event>) {
  try {
    const supabase = createClient();
    
    // Handle lineup separately
    const { lineup, ...eventDataWithoutLineup } = eventData;
    
    // Map our client-side data structure to the database column names
    const dbData: { [key: string]: any } = {
      title: eventDataWithoutLineup.title,
      description: eventDataWithoutLineup.description,
      date: eventDataWithoutLineup.date,
      time: eventDataWithoutLineup.time,
      venue: eventDataWithoutLineup.venue,
      address: eventDataWithoutLineup.address,
      image: eventDataWithoutLineup.image,
      price: eventDataWithoutLineup.price,
      tickets_total: eventDataWithoutLineup.ticketsTotal,
      tickets_remaining: eventDataWithoutLineup.ticketsRemaining,
      sold_out: eventDataWithoutLineup.soldOut,
      promoter: eventDataWithoutLineup.promoter,
      age_restriction: eventDataWithoutLineup.ageRestriction
    };
    
    // Remove undefined values
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key];
      }
    });
    
    console.log('Updating event in Supabase:', id, dbData);
    
    const { data, error } = await supabase
      .from('events')
      .update(dbData)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating event:', error);
      throw new Error(`Failed to update event: ${error.message}`);
    }
    
    // Handle lineup updates if provided
    if (lineup && Array.isArray(lineup)) {
      // First, delete existing lineup entries
      const { error: deleteError } = await supabase
        .from('event_artists')
        .delete()
        .eq('event_id', id);
      
      if (deleteError) {
        console.error('Error deleting existing lineup:', deleteError);
        // Continue anyway
      }
      
      // Then, insert new lineup entries
      if (lineup.length > 0) {
        const eventArtistInserts = lineup.map(artist => ({
          event_id: id,
          artist_id: artist.id,
          performance_time: artist.time || null
        }));
        
        const { error: insertError } = await supabase
          .from('event_artists')
          .insert(eventArtistInserts);
        
        if (insertError) {
          console.error('Error inserting new lineup:', insertError);
          // Continue anyway
        }
      }
    }
    
    console.log('Event updated successfully:', data);
    
    // Get the updated event with lineup
    const updatedEvent = await getEventById(id);
    return updatedEvent;
  } catch (error) {
    console.error('Exception when updating event:', error);
    throw error;
  }
}
