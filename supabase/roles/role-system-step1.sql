-- Step 1: Create Roles Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert the roles we defined
INSERT INTO roles (name, description) VALUES
  ('admin', 'Full system access for Shameless Productions staff'),
  ('event_manager', 'Can create and manage events, view sales data'),
  ('box_office', 'Can process tickets, check-ins, and handle customer issues'),
  ('artist', 'Can view performance details and schedules'),
  ('guest_list_manager', 'Can add people to guest lists for specific events'),
  ('customer', 'Regular users who purchase tickets')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

-- Step 2: Create User Roles Junction Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);

-- Step 3: Add a primary_role_id column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'primary_role_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN primary_role_id INTEGER REFERENCES roles(id);
  END IF;
END $$;

-- Step 4: Create Event Artists Table if it doesn't exist
-- First check if it exists and get its structure
DO $$
DECLARE
  artists_table_exists BOOLEAN;
  user_id_column_exists BOOLEAN;
  artist_id_column_exists BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'event_artists'
  ) INTO artists_table_exists;
  
  -- If table exists, check column names
  IF artists_table_exists THEN
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'event_artists' AND column_name = 'user_id'
    ) INTO user_id_column_exists;
    
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'event_artists' AND column_name = 'artist_id'
    ) INTO artist_id_column_exists;
    
    RAISE NOTICE 'event_artists table exists. user_id exists: %, artist_id exists: %', 
      user_id_column_exists, artist_id_column_exists;
  ELSE
    RAISE NOTICE 'event_artists table does not exist, will create it';
  END IF;
END $$;

-- Create event_artists table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_artists (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_headliner BOOLEAN DEFAULT false,
  can_manage_guestlist BOOLEAN DEFAULT true,
  guestlist_allocation INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, artist_id)
);

-- Step 5: Create Guest List Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS guest_lists (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  number_of_guests INTEGER DEFAULT 1,
  notes TEXT,
  is_checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for the guest list table
CREATE INDEX IF NOT EXISTS guest_lists_event_id_idx ON guest_lists(event_id);
CREATE INDEX IF NOT EXISTS guest_lists_created_by_idx ON guest_lists(created_by);

-- Step 6: Create a function to assign the customer role to new users
CREATE OR REPLACE FUNCTION assign_customer_role_to_new_user()
RETURNS TRIGGER AS $$
DECLARE
  customer_role_id INTEGER;
BEGIN
  -- Get the customer role ID
  SELECT id INTO customer_role_id FROM roles WHERE name = 'customer';
  
  -- Assign customer role to the new user
  IF customer_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (NEW.id, customer_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    -- Also set as primary role in profiles
    UPDATE profiles 
    SET primary_role_id = customer_role_id
    WHERE id = NEW.id AND primary_role_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to assign customer role to new users
DROP TRIGGER IF EXISTS assign_customer_role_trigger ON auth.users;
CREATE TRIGGER assign_customer_role_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION assign_customer_role_to_new_user();

-- Step 7: Add at least one admin user (the first user in the system)
DO $$
DECLARE
  admin_role_id INTEGER;
  admin_user_id UUID;
BEGIN
  -- Get the first user as admin (or you can specify a particular email)
  SELECT id INTO admin_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  -- Assign admin role to the user
  IF admin_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (admin_user_id, admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    -- Also set as primary role in profiles
    UPDATE profiles 
    SET primary_role_id = admin_role_id
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Admin role assigned to user %', admin_user_id;
  END IF;
END $$;

-- Step 8: Create helper functions to check for roles
CREATE OR REPLACE FUNCTION has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = $1 AND r.name = $2
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION current_user_has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role(auth.uid(), $1);
END;
$$ LANGUAGE plpgsql;
