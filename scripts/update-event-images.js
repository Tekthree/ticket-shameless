// Script to update all event images with permanent URLs
// Run with: node scripts/update-event-images.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service role key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Permanent image URLs that won't expire
const PERMANENT_IMAGES = [
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'
];

async function updateEventImages() {
  console.log('===== UPDATING EVENT IMAGES =====');
  
  try {
    // Get all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, image, slug')
      .order('date', { ascending: false });
    
    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return;
    }
    
    console.log(`Found ${events.length} events to update`);
    
    // Update each event with a permanent image URL
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      // Use a different image for each event (cycling through the available images)
      const newImageUrl = PERMANENT_IMAGES[i % PERMANENT_IMAGES.length];
      
      console.log(`Updating event: ${event.title} (${event.id.substring(0, 8)})`);
      console.log(`  Old image: ${event.image ? event.image.substring(0, 50) + '...' : 'None'}`);
      console.log(`  New image: ${newImageUrl.substring(0, 50) + '...'}`);
      
      const { error: updateError } = await supabase
        .from('events')
        .update({ image: newImageUrl })
        .eq('id', event.id);
      
      if (updateError) {
        console.error(`  ❌ Error updating event: ${updateError.message}`);
      } else {
        console.log(`  ✅ Successfully updated event image`);
      }
    }
    
    console.log('\n===== VERIFICATION =====');
    
    // Verify that all events now have permanent images
    const { data: verifyEvents, error: verifyError } = await supabase
      .from('events')
      .select('id, title, image')
      .order('date', { ascending: false });
    
    if (verifyError) {
      console.error('Error verifying events:', verifyError);
    } else {
      console.log('Updated events:');
      verifyEvents.forEach(event => {
        console.log(`- ${event.title}: ${event.image ? 'Has image' : 'No image'}`);
      });
    }
  } catch (err) {
    console.error('Unhandled error:', err);
  }
}

// Run the update
updateEventImages()
  .then(() => console.log('Update completed'))
  .catch(err => console.error('Script error:', err));
