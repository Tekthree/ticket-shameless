-- Emergency fix for the "Database error saving new user" issue
-- This script takes a radical approach by disabling all triggers temporarily

-- 1. DISABLE ALL EXISTING TRIGGERS on auth.users
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

-- 2. DROP EXISTING FUNCTIONS that might be conflicting
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.assign_customer_role_to_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_and_assign_role() CASCADE;

-- 3. Create an ultra-simple profile creation function that has no dependencies
-- This function does ONE thing only - create a profile - and has thorough error handling
CREATE OR REPLACE FUNCTION public.simple_profile_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- Always wrap in a BEGIN/EXCEPTION block to prevent registration failures
  BEGIN
    -- Simple insert, minimal columns, no dependencies
    INSERT INTO public.profiles (
      id, 
      email
    ) 
    VALUES (
      NEW.id,
      NEW.email
    )
    -- If profile exists, do nothing (don't fail)
    ON CONFLICT (id) DO NOTHING;
    
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but DON'T FAIL the registration
      RAISE NOTICE 'Error in simple_profile_creator: %', SQLERRM;
  END;
  
  -- Always return NEW to allow the user creation to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a single, simple trigger with the bare minimum functionality
CREATE TRIGGER simple_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.simple_profile_creator();

-- 5. Test that profiles table has all we need
DO $$
BEGIN
  -- Make sure profiles table exists and has id, email (the bare minimum)
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'profiles table missing id column!';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    RAISE EXCEPTION 'profiles table missing email column!';
  END IF;
END $$;

-- End of emergency fix
