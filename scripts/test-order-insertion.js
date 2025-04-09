// Simple test script to directly insert an order into Supabase
// Run with: node scripts/test-order-insertion.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client with service role key for full access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service role key in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testOrderInsertion() {
  console.log('===== TESTING DIRECT ORDER INSERTION =====')
  console.log(`Supabase URL: ${supabaseUrl}`)
  console.log(`Service Key present: ${supabaseServiceKey ? 'Yes' : 'No'}`)
  
  try {
    // 1. Test connection
    console.log('\n----- TESTING CONNECTION -----')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('orders')
      .select('count(*)')
      
    if (connectionError) {
      console.error('Connection error:', connectionError)
    } else {
      console.log('Connection successful - able to count orders')
    }
    
    // 2. Get a valid event ID for testing
    console.log('\n----- GETTING TEST EVENT ID -----')
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .limit(1)
      .single()
      
    let eventId = null
    if (eventError) {
      console.error('Error fetching test event ID:', eventError)
      console.log('Will use NULL for event_id')
    } else if (event) {
      eventId = event.id
      console.log(`Using event ID for test: ${event.id}`)
    }
    
    // 3. Create test order data
    console.log('\n----- CREATING TEST ORDER -----')
    const testOrderData = {
      event_id: eventId,
      stripe_session_id: `test_session_${Date.now()}`,
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      amount_total: 25.00,
      status: 'completed',
      quantity: 1
    }
    
    console.log('Test order data:', testOrderData)
    
    // 4. Insert test order
    console.log('\n----- ATTEMPTING ORDER INSERTION -----')
    const { data: insertResult, error: insertError } = await supabase
      .from('orders')
      .insert(testOrderData)
      .select()
      
    if (insertError) {
      console.error('Test order insertion failed:', insertError)
      
      // Try a simplified version
      console.log('\n----- ATTEMPTING SIMPLIFIED ORDER INSERTION -----')
      const minimalOrderData = {
        stripe_session_id: `test_minimal_${Date.now()}`,
        amount_total: 10.00,
        status: 'test'
      }
      
      const { data: minimalResult, error: minimalError } = await supabase
        .from('orders')
        .insert(minimalOrderData)
        .select()
        
      if (minimalError) {
        console.error('Simplified order insertion also failed:', minimalError)
        console.log('\n❌ ORDER INSERTION TEST FAILED - DATABASE ISSUE DETECTED')
      } else {
        console.log('Simplified order insertion succeeded!')
        console.log('Inserted order:', minimalResult)
        console.log('\n⚠️ PARTIAL SUCCESS - Only simplified orders work')
        
        // Clean up
        if (minimalResult && minimalResult.length > 0) {
          await supabase
            .from('orders')
            .delete()
            .eq('id', minimalResult[0].id)
          console.log('Test order cleaned up')
        }
      }
    } else {
      console.log('Order insertion successful!')
      console.log('Inserted order:', insertResult)
      console.log('\n✅ ORDER INSERTION TEST PASSED')
      
      // Clean up
      if (insertResult && insertResult.length > 0) {
        await supabase
          .from('orders')
          .delete()
          .eq('id', insertResult[0].id)
        console.log('Test order cleaned up')
      }
    }
    
    // 5. Check RLS policies
    console.log('\n----- CHECKING RLS POLICIES -----')
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('is_rls_enabled', { table_name: 'orders' })
      
    if (rlsError) {
      console.error('Error checking RLS status:', rlsError)
      
      // Alternative method
      console.log('Attempting to check RLS status with direct query...')
      const { data: policies } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'orders')
        
      if (policies) {
        console.log(`Found ${policies.length} policies on orders table`)
        policies.forEach(policy => {
          console.log(`- ${policy.policyname}: ${policy.cmd} operation`)
        })
      }
    } else {
      console.log(`RLS for orders table is: ${rlsStatus ? 'ENABLED' : 'DISABLED'}`)
    }
    
  } catch (error) {
    console.error('Unhandled error during test:', error)
  }
  
  console.log('\n===== END OF TEST =====')
}

// Create the RLS status function if it doesn't exist
async function createHelperFunction() {
  try {
    const { error } = await supabase.rpc('is_rls_enabled', { table_name: 'orders' })
    
    if (error && error.message.includes('function does not exist')) {
      console.log('Creating helper function for RLS status check...')
      
      // Try to create the function
      const { error: createError } = await supabase.query(`
        CREATE OR REPLACE FUNCTION is_rls_enabled(table_name text)
        RETURNS boolean
        LANGUAGE sql
        AS $$
          SELECT relrowsecurity FROM pg_class WHERE relname = table_name;
        $$;
      `)
      
      if (createError) {
        console.error('Error creating helper function:', createError)
      }
    }
  } catch (e) {
    // Function doesn't exist, but we can't create it, so we'll use the alternative method
    console.log('Will use alternative method for RLS status check')
  }
}

// Run the tests
(async () => {
  try {
    await createHelperFunction()
    await testOrderInsertion()
  } catch (err) {
    console.error('Script failed:', err)
  }
})()
