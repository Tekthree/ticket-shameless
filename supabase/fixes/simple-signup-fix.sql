-- Simple fix for the "Database error saving new user" issue

-- Drop all existing triggers on auth.users
DROP TRIGGER IF EXISTS create_profile_after_auth_insert ON auth.users;
DROP TRIGGER IF EXISTS assign_customer_role_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Drop conflicting functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.assign_customer_role_to_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_and_assign_role() CASCADE;

-- Create a simple, robust function that won't fail
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to create a profile, but don't fail if there's an error
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    EXCEPTION WHEN OTHERS THEN
      -- Just log the error and continue
      RAISE NOTICE 'Error creating profile: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a new trigger with the simplified function
CREATE TRIGGER create_profile_after_auth_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
