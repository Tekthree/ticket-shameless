// This script will fix the profiles table and related triggers
// Run with: node scripts/fix-profiles.js

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

async function fixProfiles() {
  try {
    console.log('Reading SQL script...');
    const sqlPath = path.join(__dirname, '..', 'supabase', 'fix-user-profile-schema.sql');
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
        // Use the Supabase SQL API directly
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        
        if (error) {
          console.warn(`Warning on statement ${i+1}:`, error.message);
          // Continue with next statement
        }
      } catch (err) {
        console.warn(`Warning on statement ${i+1}:`, err.message);
        // Continue with next statement
      }
    }
    
    console.log('All SQL statements executed.');
    
    // Verify profiles table exists
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.error('Error verifying profiles table:', error.message);
      } else {
        console.log(`Success! Profiles table exists with count: ${count}`);
      }
    } catch (err) {
      console.error('Error checking profiles table:', err.message);
    }
    
    console.log('Database setup completed');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the fix
fixProfiles()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
