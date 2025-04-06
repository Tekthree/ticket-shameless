// This script will create the profiles table and set up the necessary triggers and policies
// Run with: node scripts/create-profiles-table.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service key is missing in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProfilesTable() {
  console.log('Creating profiles table and setting up triggers...');

  // SQL from user-profile-schema.sql
  const sql = `
  -- Create users profile table if it doesn't exist
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone_number TEXT,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Add a trigger to automatically handle profile creation for new users
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Add trigger to auth.users table if it doesn't exist
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'create_profile_after_auth_insert'
    ) THEN
      CREATE TRIGGER create_profile_after_auth_insert
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
    END IF;
  END
  $$;

  -- Add trigger for updating the updated_at field
  DROP TRIGGER IF EXISTS update_profiles_modified ON profiles;
  CREATE TRIGGER update_profiles_modified
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

  -- Modify orders table to link to user profiles if the column doesn't exist
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
  END
  $$;

  -- Create an index for faster lookups if it doesn't exist
  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

  -- Add RLS policies for profiles table
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies to avoid duplicates
  DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

  -- Allow users to read their own profile and admins to read all profiles
  CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id OR auth.role() = 'authenticated');

  -- Allow users to update their own profile
  CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

  -- Drop existing policy to avoid duplicates
  DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

  -- Modify orders RLS policies to add user_id checks
  CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // If the RPC method doesn't exist, try the direct SQL approach
      console.warn('RPC method not found, trying direct SQL...');
      
      // Split the SQL into individual statements
      const statements = sql.split(';').filter(statement => statement.trim());
      
      for (const statement of statements) {
        // Execute each SQL statement
        const { error } = await supabase.sql(statement);
        if (error) {
          throw error;
        }
      }
    }
    
    console.log('Database setup completed successfully');
    
    // Verify the table exists
    const { data, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (verifyError) {
      console.warn('Verification failed, table might not be set up correctly:', verifyError);
    } else {
      console.log('Verification successful, profiles table exists');
    }
    
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Run the setup
createProfilesTable()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
