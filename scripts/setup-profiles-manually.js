// This script will manually set up the profiles table
// Run with: node scripts/setup-profiles-manually.js

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

async function setupProfilesManually() {
  try {
    console.log('Setting up profiles table manually...');

    // 1. Check if profiles table exists
    const { error: tableCheckError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    // If profiles table doesn't exist, create it
    if (tableCheckError && tableCheckError.code === '42P01') { // relation does not exist
      console.log('Profiles table does not exist. Creating...');
      
      // Create profiles table
      await supabase.rpc('exec_sql', {
        sql: `
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
        );`
      });
      
      console.log('Profiles table created.');
    } else {
      console.log('Profiles table exists. Continuing setup...');
    }

    // 2. Create or replace the update_modified_column function
    console.log('Setting up update_modified_column function...');
    await supabase.rpc('exec_sql', {
      sql: `
      CREATE OR REPLACE FUNCTION update_modified_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;`
    });

    // 3. Create trigger for automatic updated_at
    console.log('Setting up update trigger...');
    await supabase.rpc('exec_sql', {
      sql: `
      DROP TRIGGER IF EXISTS update_profiles_modified ON profiles;
      CREATE TRIGGER update_profiles_modified
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_column();`
    });

    // 4. Create or replace the handle_new_user function
    console.log('Setting up handle_new_user function...');
    await supabase.rpc('exec_sql', {
      sql: `
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;`
    });

    // 5. Create trigger for automatic profile creation
    console.log('Setting up profile creation trigger...');
    await supabase.rpc('exec_sql', {
      sql: `
      DROP TRIGGER IF EXISTS create_profile_after_auth_insert ON auth.users;
      CREATE TRIGGER create_profile_after_auth_insert
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();`
    });

    // 6. Enable Row Level Security
    console.log('Setting up row level security...');
    await supabase.rpc('exec_sql', {
      sql: `
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
      
      CREATE POLICY "Users can view their own profile" ON profiles
        FOR SELECT
        USING (auth.uid() = id OR auth.role() = 'authenticated');
      
      CREATE POLICY "Users can update their own profile" ON profiles
        FOR UPDATE
        USING (auth.uid() = id);
        
      CREATE POLICY "Allow authenticated users to insert profiles" ON profiles
        FOR INSERT
        WITH CHECK (auth.uid() = id OR auth.role() = 'authenticated');`
    });

    // 7. Create profiles for users who don't have one yet
    console.log('Creating profiles for existing users...');
    await supabase.rpc('exec_sql', {
      sql: `
      INSERT INTO profiles (id, email, full_name, created_at, updated_at)
      SELECT 
        au.id, 
        au.email,
        COALESCE(au.raw_user_meta_data->>'full_name', ''),
        NOW(),
        NOW()
      FROM 
        auth.users au
      LEFT JOIN 
        profiles p ON au.id = p.id
      WHERE 
        p.id IS NULL;`
    });

    console.log('Database setup completed successfully.');
    
    // Verify profiles table exists and has data
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('Error verifying profiles table:', error);
    } else {
      console.log(`Success! Profiles table verified with count: ${count}`);
    }

  } catch (error) {
    console.error('Error in setup:', error.message);
  }
}

// Run the setup
setupProfilesManually()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
