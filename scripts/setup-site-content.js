require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Create Supabase client with service role key for full access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or service role key not found in environment variables.');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL(sqlContent) {
  // Split SQL by semicolons to handle multiple statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
  
  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        console.error(`Error executing SQL statement: ${statement}`);
        console.error(error);
      }
    } catch (err) {
      console.error(`Error running SQL statement: ${statement}`);
      console.error(err);
    }
  }
}

async function setupSiteContent() {
  console.log('Setting up site content database schema...');
  
  try {
    // Read SQL files
    const siteContentSchemaPath = path.join(__dirname, '..', 'supabase', 'site-content-schema.sql');
    const storageSetupPath = path.join(__dirname, '..', 'supabase', 'storage-setup.sql');
    
    // Read site content schema
    const siteContentSchema = fs.readFileSync(siteContentSchemaPath, 'utf8');
    console.log('Read site-content-schema.sql');
    
    // Read storage setup
    const storageSetup = fs.readFileSync(storageSetupPath, 'utf8');
    console.log('Read storage-setup.sql');
    
    // First create exec_sql function if it doesn't exist
    await runFunctionSetup();
    
    // Run site content schema
    console.log('Running site content schema SQL...');
    await runSQL(siteContentSchema);
    
    // Run storage setup
    console.log('Running storage setup SQL...');
    await runSQL(storageSetup);
    
    console.log('✅ Site content setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up site content:', error);
  }
}

async function runFunctionSetup() {
  // Create a function to execute SQL (needed for running multiple statements)
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  try {
    // Create the function directly without using itself
    const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (error) {
      // Function might not exist yet, try creating it with a direct query
      const { error: queryError } = await supabase.query(createFunctionSQL);
      
      if (queryError) {
        console.error('Error creating exec_sql function:', queryError);
      }
    }
  } catch (err) {
    // Try direct SQL execution as a fallback
    try {
      const { error } = await supabase.query(createFunctionSQL);
      if (error) {
        console.error('Error creating exec_sql function:', error);
      }
    } catch (innerErr) {
      console.error('Failed to create exec_sql function:', innerErr);
    }
  }
}

// Run the setup
setupSiteContent().catch(console.error);
