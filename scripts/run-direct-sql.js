// Run the SQL to add password_hash column to profiles
// Run with: node scripts/run-direct-sql.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service key is missing in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSql() {
  try {
    console.log('Reading SQL script...');
    const sqlPath = path.join(__dirname, '..', 'supabase', 'add-password-hash.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL script...');
    
    // Split the SQL into individual statements
    const statements = sqlScript.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i+1}/${statements.length}...`);
      
      try {
        // Try different SQL execution methods
        let executed = false;
        
        // Method 1: Using the custom rpc function if available
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
          if (!error) {
            executed = true;
            console.log(`Statement ${i+1} executed successfully with RPC.`);
          }
        } catch (e) {
          console.log('RPC method not available, trying direct query...');
        }
        
        // Method 2: Direct query if RPC failed
        if (!executed) {
          // This might not work depending on Supabase permissions
          const { error } = await supabase.from('_sql').select('*').execute(stmt + ';');
          if (!error) {
            executed = true;
            console.log(`Statement ${i+1} executed successfully with direct query.`);
          } else {
            console.error(`Error with direct query: ${error.message}`);
          }
        }
        
        // If both methods fail, log a warning
        if (!executed) {
          console.warn(`Could not execute statement ${i+1}. Try running this SQL manually in the Supabase SQL editor.`);
          console.log(stmt);
        }
      } catch (err) {
        console.warn(`Warning on statement ${i+1}:`, err.message);
        // Continue with next statement
      }
    }
    
    console.log('All SQL statements processed.');
    
    // Verify profiles table has password_hash column
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('password_hash')
        .limit(1);
        
      if (error) {
        console.error('Error verifying password_hash column:', error.message);
      } else {
        console.log('Success! Profiles table has password_hash column.');
      }
    } catch (err) {
      console.error('Error checking profiles table:', err.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the SQL
runSql()
  .then(() => {
    console.log('Script completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
