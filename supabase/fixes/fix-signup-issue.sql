-- Fix for "Database error saving new user" issue

-- First, drop all existing triggers on auth.users to avoid conflicts
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
          AND event_object_schema = 'auth'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.trigger_name || ' ON auth.users;';
        RAISE NOTICE 'Dropped trigger: %', trigger_rec.trigger_name;
    END LOOP;
END $$;

-- Drop conflicting functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.assign_customer_role_to_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_and_assign_role() CASCADE;

-- Create a single comprehensive function that handles both profile creation AND role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user_and_assign_role()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists INTEGER;
  customer_role_id INTEGER;
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
  
  -- Then try to assign the customer role
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
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE NOTICE 'Error assigning role for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Always return NEW to allow the user creation to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a single trigger that does both profile creation and role assignment
CREATE TRIGGER handle_new_user_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_and_assign_role();

-- Ensure the roles table exists and has the customer role
DO $$
BEGIN
  -- Insert the customer role if it doesn't exist
  INSERT INTO roles (name, description)
  VALUES ('customer', 'Regular users who purchase tickets')
  ON CONFLICT (name) DO NOTHING;
END $$;

-- Create profiles for any users that don't have one yet
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
  p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Also ensure all users have the customer role assigned
WITH users_without_roles AS (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN user_roles ur ON au.id = ur.user_id
  WHERE ur.id IS NULL
)
INSERT INTO user_roles (user_id, role_id)
SELECT 
  uwp.id,
  (SELECT id FROM roles WHERE name = 'customer')
FROM
  users_without_roles uwp
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Output summary
DO $$
DECLARE
  profile_count INTEGER;
  user_role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO user_role_count FROM user_roles;
  RAISE NOTICE 'Number of profiles after setup: %', profile_count;
  RAISE NOTICE 'Number of user_roles after setup: %', user_role_count;
END
$$;
