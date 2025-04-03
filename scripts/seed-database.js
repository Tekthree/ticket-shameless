require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and Key must be provided in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample events data
const events = [
  {
    title: 'An Evening With Shameless - 22nd Anniversary',
    slug: 'an-evening-with-shameless-22nd-anniversary',
    description: 'Join us for a special night celebrating 22 years of Shameless Productions. Featuring classic underground sounds and guest DJs.',
    date: new Date('2025-07-18T20:00:00.000Z').toISOString(),
    time: '20:00',
    venue: 'The Sunset Tavern',
    address: '5433 Ballard Avenue Northwest, Seattle, WA 98107',
    image: 'https://images.unsplash.com/photo-1571600393892-15714ad38c8d',
    price: 25.0,
    tickets_total: 200,
    tickets_remaining: 200,
    promoter: 'Shameless Productions',
    age_restriction: '21+',
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
    ]
  },
  {
    title: 'Shameless Underground: Deep Beats',
    slug: 'shameless-underground-deep-beats',
    description: 'Dive into the depths of electronic music with deep house, techno and ambient sounds.',
    date: new Date('2025-08-15T21:00:00.000Z').toISOString(),
    time: '21:00',
    venue: 'Substation',
    address: '645 NW 45th St, Seattle, WA 98107',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6a3',
    price: 15.0,
    tickets_total: 150,
    tickets_remaining: 150,
    promoter: 'Shameless Productions',
    age_restriction: '21+',
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
    ]
  },
  {
    title: 'Shameless Summer Bash',
    slug: 'shameless-summer-bash',
    description: 'Celebrate summer with an outdoor dance party featuring the best electronic music in Seattle.',
    date: new Date('2025-07-04T16:00:00.000Z').toISOString(),
    time: '16:00',
    venue: 'Myrtle Edwards Park',
    address: 'Myrtle Edwards Park, Seattle, WA 98121',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6a3',
    price: 20.0,
    tickets_total: 400,
    tickets_remaining: 0,
    sold_out: true,
    promoter: 'Shameless Productions',
    age_restriction: 'All Ages',
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
    ]
  }
];

async function seedDatabase() {
  console.log('Seeding Supabase database with placeholder events...');
  
  // First, try to authenticate as a user if we have credentials
  if (process.env.SUPABASE_USER_EMAIL && process.env.SUPABASE_USER_PASSWORD) {
    console.log('Authenticating with Supabase...');
    const { error } = await supabase.auth.signInWithPassword({
      email: process.env.SUPABASE_USER_EMAIL,
      password: process.env.SUPABASE_USER_PASSWORD,
    });
    
    if (error) {
      console.error('Authentication failed:', error.message);
      console.log('Trying to proceed without authentication...');
    } else {
      console.log('Authentication successful!');
    }
  } else {
    console.log('No authentication credentials provided. Trying to proceed with service role or anon key...');
  }
  
  // Try to temporarily disable RLS for seeding (needs superuser privileges)
  try {
    const { error: rpcError } = await supabase.rpc('disable_rls_for_seeding');
    if (!rpcError) {
      console.log('RLS temporarily disabled for seeding');
    }
  } catch (err) {
    console.log('Unable to disable RLS, continuing with standard auth...');
  }
  
  for (const event of events) {
    // Add lineup as JSONB
    const eventWithJsonb = {
      ...event,
      lineup: JSON.stringify(event.lineup)
    };
    
    // Insert event
    const { data, error } = await supabase
      .from('events')
      .upsert(eventWithJsonb, { 
        onConflict: 'slug',  // This will update existing events if slug matches
        returning: 'minimal' // Don't need the returned data
      });
    
    if (error) {
      console.error(`Error inserting "${event.title}":`, error);
      
      // Try alternative approach - directly insert via SQL if RPC function available
      try {
        const { error: rpcError } = await supabase.rpc('insert_event_bypassing_rls', {
          event_data: eventWithJsonb
        });
        
        if (!rpcError) {
          console.log(`Successfully inserted "${event.title}" via RPC function`);
        } else {
          console.error(`RPC insertion failed for "${event.title}":`, rpcError);
        }
      } catch (err) {
        console.error(`Alternative insertion approach failed for "${event.title}":`, err);
      }
    } else {
      console.log(`Successfully inserted/updated "${event.title}"`);
    }
  }
  
  // Re-enable RLS if it was disabled
  try {
    const { error: rpcError } = await supabase.rpc('enable_rls_for_seeding');
    if (!rpcError) {
      console.log('RLS re-enabled');
    }
  } catch (err) {
    console.log('Unable to re-enable RLS via RPC - not an issue if it was never disabled');
  }
  
  console.log('Database seeding completed!');
}

seedDatabase()
  .catch(err => {
    console.error('Failed to seed database:', err);
    process.exit(1);
  });
