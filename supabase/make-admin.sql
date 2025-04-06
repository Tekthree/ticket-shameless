-- Script to make a user an admin with verification

-- First, get the current user's email and ID
-- Replace 'your.email@example.com' with your actual email
DO $$
DECLARE
  target_user_id UUID;
  admin_role_id INTEGER;
  user_email TEXT := 'tekthree@gmail.com'; -- REPLACE THIS WITH YOUR ACTUAL EMAIL
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found with email %', user_email;
  END IF;
  
  RAISE NOTICE 'Found user with ID: %', target_user_id;
  
  -- Get the admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found in roles table';
  END IF;
  
  RAISE NOTICE 'Found admin role with ID: %', admin_role_id;
  
  -- Check if user already has admin role
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = target_user_id AND role_id = admin_role_id
  ) THEN
    RAISE NOTICE 'User already has admin role';
  ELSE
    -- Assign admin role to the user
    INSERT INTO user_roles (user_id, role_id)
    VALUES (target_user_id, admin_role_id);
    RAISE NOTICE 'Admin role assigned to user';
  END IF;
  
  -- Update primary_role_id in profiles
  UPDATE profiles 
  SET primary_role_id = admin_role_id
  WHERE id = target_user_id;
  RAISE NOTICE 'Updated primary_role_id in profiles table';
  
  -- Verify the changes
  RAISE NOTICE 'Verification:';
  RAISE NOTICE 'User roles:';
  FOR r IN (
    SELECT r.name FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = target_user_id
  ) LOOP
    RAISE NOTICE '%', r.name;
  END LOOP;
  
  RAISE NOTICE 'Primary role: %', (
    SELECT r.name FROM profiles p 
    JOIN roles r ON p.primary_role_id = r.id 
    WHERE p.id = target_user_id
  );
END $$;
