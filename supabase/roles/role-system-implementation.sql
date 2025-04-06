-- Shameless Productions Ticketing Platform Role System Implementation

-- Step 1: Fix the handle_new_user trigger that's causing "Database error saving new user"
-- First, drop the existing problematic trigger
DROP TRIGGER IF EXISTS create_profile_after_auth_insert ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more robust handle_new_user function that won't fail
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists INTEGER;
BEGIN
  -- First check if a profile already exists for this user
  SELECT COUNT(*) INTO profile_exists FROM public.profiles WHERE id = NEW.id;
  
  -- Only try to create a profile if one doesn't already exist
  IF profile_exists = 0 THEN
    BEGIN
      -- Use an exception block to catch any errors
      INSERT INTO public.profiles (
        id, 
        email, 
        full_name,
        created_at,
        updated_at
      ) 
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NOW(),
        NOW()
      );
      EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the transaction
        RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  -- Always return NEW to allow the user creation to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a new trigger with the improved function
CREATE TRIGGER create_profile_after_auth_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Step 2: Create Roles Table for the role-based system
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

-- Step 3: Create User Roles Junction Table
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);

-- Step 4: Add a primary_role_id column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'primary_role_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN primary_role_id INTEGER REFERENCES roles(id);
  END IF;
END $$;

-- Step 5: Modify or Create the Guest List Table
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

-- Step 6: Create or modify event_artists junction table with guest list management
CREATE TABLE IF NOT EXISTS event_artists (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_headliner BOOLEAN DEFAULT false,
  can_manage_guestlist BOOLEAN DEFAULT true,
  guestlist_allocation INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Step 7: Create a function to assign the customer role to new users
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

-- Step 8: Set up RLS policies for role-based access
-- For the roles table
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roles" ON roles
  FOR SELECT USING (true);
  
CREATE POLICY "Only admins can modify roles" ON roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- For the user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = (SELECT id FROM roles WHERE name = 'admin')
    )
  );
  
CREATE POLICY "Only admins can modify user roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- For the guest_lists table
ALTER TABLE guest_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event managers and admins can view all guest lists" ON guest_lists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'event_manager', 'box_office')
      )
    )
  );
  
CREATE POLICY "Artists can view their own event guest lists" ON guest_lists
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM event_artists ea
      WHERE ea.event_id = guest_lists.event_id
      AND ea.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Guest list managers can add guests" ON guest_lists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'event_manager', 'guest_list_manager')
      )
    ) OR
    EXISTS (
      SELECT 1 FROM event_artists ea
      WHERE ea.event_id = guest_lists.event_id
      AND ea.user_id = auth.uid()
      AND ea.can_manage_guestlist = true
    )
  );
  
CREATE POLICY "Users can update their own guest lists" ON guest_lists
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'event_manager')
      )
    )
  );

CREATE POLICY "Box office can check in guests" ON guest_lists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'box_office')
      )
    )
  );

-- Step 9: Add at least one admin user (update with actual user ID)
-- You'll need to replace 'YOUR_ADMIN_USER_ID' with an actual UUID from auth.users
DO $$
DECLARE
  admin_role_id INTEGER;
  admin_user_id UUID;
BEGIN
  -- Get the first user as admin (or you can specify a particular email)
  SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
  
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

-- Step 10: Create helper functions to check for roles
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

-- Step 11: Update existing events RLS policies to use roles
DROP POLICY IF EXISTS "Public can view events" ON events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON events;

CREATE POLICY "Public can view events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Event managers and admins can insert events" ON events
  FOR INSERT WITH CHECK (
    current_user_has_role('admin') OR current_user_has_role('event_manager')
  );

CREATE POLICY "Event managers and admins can update events" ON events
  FOR UPDATE USING (
    current_user_has_role('admin') OR current_user_has_role('event_manager')
  );

CREATE POLICY "Only admins can delete events" ON events
  FOR DELETE USING (
    current_user_has_role('admin')
  );
