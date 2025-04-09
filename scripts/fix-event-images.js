// Script to fix event images in the database
// Run with: node scripts/fix-event-images.js

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

// Default placeholder image URL
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80';

async function fixEventImages() {
  console.log('===== FIXING EVENT IMAGES =====');
  
  try {
    // First, get all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, image, slug')
      .order('date', { ascending: false });
    
    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return;
    }
    
    console.log(`Found ${events.length} events`);
    
    // Count events with missing images
    const eventsWithoutImages = events.filter(event => !event.image);
    console.log(`Found ${eventsWithoutImages.length} events without images`);
    
    // Fix events without images
    if (eventsWithoutImages.length > 0) {
      console.log('\nFixing events without images:');
      
      for (const event of eventsWithoutImages) {
        console.log(`  Fixing event: ${event.title} (${event.id.substring(0, 8)})`);
        
        const { error: updateError } = await supabase
          .from('events')
          .update({ image: DEFAULT_IMAGE })
          .eq('id', event.id);
        
        if (updateError) {
          console.error(`  ❌ Error updating event: ${updateError.message}`);
        } else {
          console.log(`  ✅ Successfully updated event with default image`);
        }
      }
    }
    
    // Now check orders to make sure they have valid event_ids
    console.log('\nChecking orders for valid event_ids:');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, event_id, customer_name, customer_email')
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return;
    }
    
    console.log(`Found ${orders.length} orders`);
    
    // Check each order
    const validEventIds = events.map(event => event.id);
    const ordersWithInvalidEvents = orders.filter(order => order.event_id && !validEventIds.includes(order.event_id));
    
    console.log(`Found ${ordersWithInvalidEvents.length} orders with invalid event_ids`);
    
    if (ordersWithInvalidEvents.length > 0) {
      console.log('\nFixing orders with invalid event_ids:');
      
      for (const order of ordersWithInvalidEvents) {
        console.log(`  Order ${order.id.substring(0, 8)} for ${order.customer_name || order.customer_email} has invalid event_id: ${order.event_id}`);
        
        // For now, we'll just log these orders
        // If you want to fix them, uncomment the code below
        /*
        const { error: updateError } = await supabase
          .from('orders')
          .update({ event_id: null })
          .eq('id', order.id);
        
        if (updateError) {
          console.error(`  ❌ Error updating order: ${updateError.message}`);
        } else {
          console.log(`  ✅ Successfully set event_id to null`);
        }
        */
      }
    }
    
    console.log('\n===== VERIFICATION =====');
    
    // Verify that all events now have images
    const { data: verifyEvents, error: verifyError } = await supabase
      .from('events')
      .select('id, title, image')
      .is('image', null);
    
    if (verifyError) {
      console.error('Error verifying events:', verifyError);
    } else {
      console.log(`Events without images after fix: ${verifyEvents.length}`);
    }
  } catch (err) {
    console.error('Unhandled error:', err);
  }
}

// Run the fix
fixEventImages()
  .then(() => console.log('Fix completed'))
  .catch(err => console.error('Script error:', err));
