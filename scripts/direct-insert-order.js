// Direct order insertion script
// Run with: node scripts/direct-insert-order.js

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

async function insertOrder() {
  console.log('===== DIRECT ORDER INSERTION =====');
  
  // Create the test order data
  const testOrder = {
    stripe_session_id: `direct_insert_${Date.now()}`,
    customer_email: 'tekthree+guestlist@gmail.com',
    customer_name: 'Direct Insert Test',
    amount_total: 25.00,
    status: 'completed',
    quantity: 1
  };
  
  console.log('Attempting to insert order:', testOrder);
  
  try {
    // Insert the order
    const { data, error } = await supabase
      .from('orders')
      .insert(testOrder)
      .select();
    
    if (error) {
      console.error('Error inserting order:', error);
      console.error('This reveals what is blocking insertions in your webhook');
    } else {
      console.log('Order inserted successfully!');
      console.log('Order data:', data);
      
      // Verify the order exists in the database
      const { data: verifyData, error: verifyError } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', testOrder.stripe_session_id)
        .single();
      
      if (verifyError) {
        console.error('Error verifying order insertion:', verifyError);
      } else {
        console.log('Order verified in database:', verifyData);
      }
    }
  } catch (err) {
    console.error('Exception during order insertion:', err);
  }
}

// Run the insertion
insertOrder()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Unhandled error:', err));
