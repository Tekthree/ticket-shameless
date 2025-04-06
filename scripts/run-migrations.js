require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or service key is missing. Please check your .env.local file.');
  process.exit(1);
}

async function runMigrations() {
  // Create a supabase client with the service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Get all SQL files in the migrations directory
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure order

  console.log(`Found ${migrationFiles.length} migration files to run.`);

  // Run each migration
  for (const file of migrationFiles) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    try {
      // Execute the SQL migration
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`Error running migration ${file}:`, error);
        
        // Try direct SQL if RPC fails
        try {
          console.log('Attempting direct SQL execution...');
          const { error: directError } = await supabase.sql(sql);
          
          if (directError) {
            console.error('Direct SQL execution also failed:', directError);
          } else {
            console.log(`Migration ${file} completed via direct SQL.`);
          }
        } catch (directErr) {
          console.error('Exception during direct SQL execution:', directErr);
        }
      } else {
        console.log(`Migration ${file} completed successfully.`);
      }
    } catch (err) {
      console.error(`Exception during migration ${file}:`, err);
    }
  }

  console.log('All migrations completed.');
}

// Run the migrations
runMigrations()
  .then(() => {
    console.log('Migrations process finished.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migrations process failed:', error);
    process.exit(1);
  });
