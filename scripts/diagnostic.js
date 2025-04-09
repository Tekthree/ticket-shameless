// Database diagnostic script
// Run with: node scripts/diagnostic.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for full access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service role key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDiagnostics() {
  console.log('===== SUPABASE DIAGNOSTIC REPORT =====');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Service Key present: ${supabaseServiceKey ? 'Yes' : 'No'}`);
  
  try {
    // Test connection
    console.log('\n----- TESTING CONNECTION -----');
    const { data: connectionTest, error: connectionError } = await supabase.from('events').select('count(*)', { count: 'exact' });
    
    if (connectionError) {
      console.error('Connection error:', connectionError);
    } else {
      console.log('Connection successful');
    }
    
    // List all tables
    console.log('\n----- DATABASE TABLES -----');
    const { data: tables, error: tablesError } = await supabase
      .rpc('list_tables');
      
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
    } else {
      console.log('Tables in database:');
      tables.forEach(table => console.log(`- ${table}`));
    }
    
    // Check orders table specifically
    console.log('\n----- ORDERS TABLE DETAILS -----');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'orders')
      .order('ordinal_position');
      
    if (columnsError) {
      console.error('Error fetching orders table structure:', columnsError);
    } else if (columns && columns.length === 0) {
      console.error('Orders table not found or no columns');
    } else {
      console.log('Orders table structure:');
      columns.forEach(col => console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`));
    }
    
    // Check orders count
    const { data: ordersCount, error: ordersCountError } = await supabase
      .from('orders')
      .select('count(*)', { count: 'exact' });
      
    if (ordersCountError) {
      console.error('Error counting orders:', ordersCountError);
    } else {
      console.log(`Total orders in database: ${ordersCount.count}`);
    }
    
    // Check RLS policies on orders table
    console.log('\n----- RLS POLICIES FOR ORDERS TABLE -----');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'orders');
      
    if (policiesError) {
      console.error('Error fetching RLS policies:', policiesError);
    } else {
      console.log('RLS policies on orders table:');
      if (policies && policies.length > 0) {
        policies.forEach(policy => console.log(`- ${policy.policyname}: ${policy.cmd} - ${policy.qual}`));
      } else {
        console.log('No RLS policies found on orders table');
      }
    }
    
    // Try to insert a test order and check error
    console.log('\n----- TESTING ORDER INSERTION -----');
    const testOrderData = {
      event_id: null, // This should be a valid UUID from your events table
      stripe_session_id: `test_session_${Date.now()}`,
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      amount_total: 10.00,
      status: 'test',
      quantity: 1
    };
    
    // First get a valid event ID
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .limit(1)
      .single();
      
    if (eventError) {
      console.error('Error fetching test event ID:', eventError);
    } else if (event) {
      testOrderData.event_id = event.id;
      console.log(`Using event ID for test: ${event.id}`);
      
      // Now try inserting
      const { data: insertResult, error: insertError } = await supabase
        .from('orders')
        .insert(testOrderData)
        .select();
        
      if (insertError) {
        console.error('Test order insertion failed:', insertError);
        console.log('This is likely the same issue preventing webhook orders from being recorded');
      } else {
        console.log('Test order insertion successful:', insertResult);
        
        // Clean up the test order
        if (insertResult && insertResult.length > 0) {
          const { error: deleteError } = await supabase
            .from('orders')
            .delete()
            .eq('stripe_session_id', testOrderData.stripe_session_id);
            
          if (deleteError) {
            console.error('Error cleaning up test order:', deleteError);
          } else {
            console.log('Test order cleaned up successfully');
          }
        }
      }
    }
    
    // Check database roles and permissions
    console.log('\n----- DATABASE ROLES AND PERMISSIONS -----');
    const { data: roles, error: rolesError } = await supabase
      .rpc('list_roles');
      
    if (rolesError) {
      console.error('Error fetching database roles:', rolesError);
    } else {
      console.log('Database roles:');
      roles.forEach(role => console.log(`- ${role}`));
    }
    
  } catch (error) {
    console.error('Unhandled error during diagnostics:', error);
  }
  
  console.log('\n===== END OF DIAGNOSTIC REPORT =====');
}

// Create helper stored procedures first
async function createHelperProcedures() {
  // Create stored procedure to list tables
  const { error: createListTablesError } = await supabase.rpc('create_list_tables_procedure', {});
  
  if (createListTablesError) {
    console.log('Creating list_tables procedure...');
    const { error } = await supabase.query(`
      CREATE OR REPLACE FUNCTION list_tables()
      RETURNS TABLE (table_name text)
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY SELECT tables.table_name::text
        FROM information_schema.tables
        WHERE table_schema = 'public';
      END;
      $$;
    `);
    
    if (error) {
      console.error('Error creating list_tables procedure:', error);
    }
  }
  
  // Create stored procedure to list roles
  const { error: createListRolesError } = await supabase.rpc('create_list_roles_procedure', {});
  
  if (createListRolesError) {
    console.log('Creating list_roles procedure...');
    const { error } = await supabase.query(`
      CREATE OR REPLACE FUNCTION list_roles()
      RETURNS TABLE (role_name text)
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY SELECT rolname::text
        FROM pg_roles
        WHERE rolname NOT LIKE 'pg_%';
      END;
      $$;
    `);
    
    if (error) {
      console.error('Error creating list_roles procedure:', error);
    }
  }
}

// Run the diagnostics
(async () => {
  await createHelperProcedures();
  await runDiagnostics();
})();
