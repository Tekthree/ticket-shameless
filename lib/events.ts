import { createClient } from '@/lib/supabase/server'

export type Artist = {
  id: string
  name: string
  image?: string
  time?: string
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
        time: '20:00 - 22:00'
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
        time: '21:00 - 22:30'
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

// Parse the lineup JSON from Supabase into the expected format
function parseEventData(event: any): Event {
  let lineup: Artist[] = [];
  
  try {
    // If lineup is a string, try to parse it as JSON
    if (typeof event.lineup === 'string') {
      lineup = JSON.parse(event.lineup);
    } 
    // If lineup is already an object (parsed by Supabase)
    else if (event.lineup && typeof event.lineup === 'object') {
      lineup = event.lineup;
    }
  } catch (error) {
    console.error('Error parsing lineup data:', error);
    lineup = [];
  }
  
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
    return data.map(parseEventData);
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
    
    return data ? data.map(parseEventData) : [];
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
    
    return data ? parseEventData(data) : null;
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
    
    return data ? parseEventData(data) : null;
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
    
    // Convert lineup to JSON string if it's an array
    const preparedData = { ...eventData };
    if (preparedData.lineup && Array.isArray(preparedData.lineup)) {
      preparedData.lineup = JSON.stringify(preparedData.lineup);
    }
    
    // Map our client-side data structure to the database column names
    const dbData = {
      title: preparedData.title,
      description: preparedData.description,
      date: preparedData.date,
      time: preparedData.time,
      venue: preparedData.venue,
      address: preparedData.address,
      image: preparedData.image,
      price: preparedData.price,
      tickets_total: preparedData.ticketsTotal,
      tickets_remaining: preparedData.ticketsRemaining,
      sold_out: preparedData.soldOut,
      promoter: preparedData.promoter,
      age_restriction: preparedData.ageRestriction,
      lineup: preparedData.lineup
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
    
    console.log('Event updated successfully:', data);
    return data[0] ? parseEventData(data[0]) : null;
  } catch (error) {
    console.error('Exception when updating event:', error);
    throw error;
  }
}
