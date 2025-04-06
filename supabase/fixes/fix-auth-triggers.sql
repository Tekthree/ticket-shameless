-- This SQL script addresses the "Database error saving new user" issue
-- by examining and fixing the triggers that cause the error

-- Drop problematic triggers if they exist
DROP TRIGGER IF EXISTS create_profile_after_auth_insert ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a new, safer handle_new_user function that handles errors gracefully
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

-- Ensure profiles has all required columns
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
    ALTER TABLE profiles ADD COLUMN display_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_number') THEN
    ALTER TABLE profiles ADD COLUMN phone_number TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_preferences') THEN
    ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "sms": false}'::jsonb;
  END IF;
END
$$;

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

-- Output how many profiles we created
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  RAISE NOTICE 'Number of profiles after setup: %', profile_count;
END
$$;
