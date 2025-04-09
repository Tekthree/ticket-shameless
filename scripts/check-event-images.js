// Script to check event images in the database
// Run with: node scripts/check-event-images.js

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

async function checkEventImages() {
  console.log('===== CHECKING EVENT IMAGES =====');
  
  try {
    // First, get all orders with their event IDs
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, event_id, customer_email, customer_name')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return;
    }
    
    console.log(`Found ${orders.length} recent orders`);
    
    // For each order, check if the event exists and has an image
    for (const order of orders) {
      console.log(`\nChecking order ${order.id.substring(0, 8)} for ${order.customer_name || order.customer_email}`);
      
      if (!order.event_id) {
        console.log(`  ❌ No event_id for this order`);
        continue;
      }
      
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, title, image, slug')
        .eq('id', order.event_id)
        .single();
      
      if (eventError) {
        console.log(`  ❌ Error fetching event: ${eventError.message}`);
        continue;
      }
      
      if (!event) {
        console.log(`  ❌ No event found with ID ${order.event_id}`);
        continue;
      }
      
      console.log(`  ✅ Found event: ${event.title}`);
      console.log(`  🔗 Event slug: ${event.slug}`);
      
      if (event.image) {
        console.log(`  🖼️ Image: ${event.image.substring(0, 50)}${event.image.length > 50 ? '...' : ''}`);
      } else {
        console.log(`  ❌ No image for this event`);
      }
    }
    
    // Now, check the join directly
    console.log('\n===== CHECKING JOIN QUERY =====');
    
    const { data: joinData, error: joinError } = await supabase
      .from('orders')
      .select(`
        id,
        event_id,
        customer_name,
        events:event_id (
          title,
          image
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (joinError) {
      console.error('Error with join query:', joinError);
      return;
    }
    
    console.log('Join query results:');
    joinData.forEach(item => {
      console.log(`Order ${item.id.substring(0, 8)} for ${item.customer_name}:`);
      console.log(`  Event ID: ${item.event_id}`);
      console.log(`  Event data present: ${item.events ? 'Yes' : 'No'}`);
      if (item.events) {
        console.log(`  Event title: ${item.events.title}`);
        console.log(`  Event image: ${item.events.image ? 'Present' : 'Missing'}`);
      }
      console.log('');
    });
  } catch (err) {
    console.error('Unhandled error:', err);
  }
}

// Run the check
checkEventImages()
  .then(() => console.log('Check completed'))
  .catch(err => console.error('Script error:', err));
