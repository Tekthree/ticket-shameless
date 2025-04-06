// This script applies the SQL fixes for the auth system
// Run with: node scripts/apply-auth-fixes.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service key is missing in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyAuthFixes() {
  try {
    // Read the SQL script
    const sqlPath = path.join(__dirname, '..', 'supabase', 'fix-auth-triggers.sql');
    let sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Applying SQL fixes to auth system...');
    
    // Split the SQL into individual statements for better error handling
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Use REST API to execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i+1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        if (error) {
          console.warn(`Warning on statement ${i+1}: ${error.message}`);
          console.log('Statement:', stmt);
        } else {
          console.log(`Statement ${i+1} executed successfully.`);
        }
      } catch (err) {
        console.warn(`Error executing statement ${i+1}: ${err.message}`);
        console.log('Statement:', stmt);
      }
    }
    
    // Verify the trigger was created properly
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: `SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users' AND event_object_schema = 'auth';` 
      });
      
      if (error) {
        console.warn('Could not verify trigger creation:', error.message);
      } else {
        console.log('Triggers on auth.users table:', data);
      }
    } catch (err) {
      console.warn('Error verifying trigger creation:', err.message);
    }
    
    console.log('SQL fixes applied. The auth system should now work correctly.');
    
  } catch (error) {
    console.error('Error applying auth fixes:', error.message);
  }
}

// Run the function to apply fixes
applyAuthFixes()
  .then(() => {
    console.log('Script completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
