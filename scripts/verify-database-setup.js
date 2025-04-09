// Database verification script
// Run with: node scripts/verify-database-setup.js

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

async function verifyDatabaseSetup() {
  console.log('===== DATABASE SETUP VERIFICATION =====');
  
  // Check orders table structure
  try {
    console.log('\nChecking orders table structure:');
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'orders')
      .order('column_name');
    
    if (error) {
      console.error('Error checking table structure:', error);
    } else {
      console.log(`Found ${columns.length} columns in orders table:`);
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
      
      // Check for required columns
      const requiredColumns = ['stripe_session_id', 'status', 'amount_total'];
      const missingColumns = requiredColumns.filter(req => 
        !columns.some(col => col.column_name === req)
      );
      
      if (missingColumns.length > 0) {
        console.error(`❌ Missing required columns: ${missingColumns.join(', ')}`);
      } else {
        console.log('✅ All required columns present');
      }
    }
  } catch (err) {
    console.error('Error checking table structure:', err);
  }
  
  // Check RLS policies
  try {
    console.log('\nChecking RLS policies:');
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'orders');
    
    if (error) {
      console.error('Error checking RLS policies:', error);
    } else if (policies && policies.length > 0) {
      console.log(`Found ${policies.length} RLS policies for orders table:`);
      policies.forEach(policy => {
        console.log(`- ${policy.policyname}: ${policy.cmd} operation, permissive: ${policy.permissive}`);
      });
      
      // Check for webhook insert policy
      const hasWebhookPolicy = policies.some(p => 
        p.policyname.toLowerCase().includes('webhook') && 
        p.cmd === 'INSERT'
      );
      
      console.log(`${hasWebhookPolicy ? '✅' : '❌'} Webhook insert policy: ${hasWebhookPolicy ? 'Found' : 'Missing'}`);
    } else {
      console.log('No RLS policies found for orders table - this means RLS might be disabled');
    }
  } catch (err) {
    console.error('Error checking RLS policies:', err);
  }
  
  // Check if RLS is enabled on orders table
  try {
    console.log('\nChecking if RLS is enabled:');
    const { data, error } = await supabase
      .from('pg_class')
      .select('relrowsecurity')
      .eq('relname', 'orders')
      .single();
    
    if (error) {
      console.error('Error checking RLS status:', error);
    } else {
      console.log(`RLS on orders table is: ${data.relrowsecurity ? 'ENABLED' : 'DISABLED'}`);
    }
  } catch (err) {
    console.error('Error checking RLS status:', err);
  }
}

// Run the verification
verifyDatabaseSetup()
  .then(() => console.log('\nVerification completed'))
  .catch(err => console.error('Unhandled error:', err));
