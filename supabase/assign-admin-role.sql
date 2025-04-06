-- Script to assign the admin role to a user

-- First, list all users to choose one
SELECT id, email FROM auth.users ORDER BY created_at;

-- Next, list existing roles to get the admin role ID
SELECT id, name FROM roles WHERE name = 'admin';

-- Now, let's assign the admin role to a specific user
-- Replace 'USER_ID_HERE' with the actual UUID from the first query
DO $$
DECLARE
  admin_role_id INTEGER;
  target_user_id UUID := 'USER_ID_HERE';  -- ⚠️ REPLACE THIS WITH ACTUAL USER ID ⚠️
BEGIN
  -- Get the admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found. Make sure roles table is properly set up.';
  END IF;
  
  -- Assign admin role to the user
  INSERT INTO user_roles (user_id, role_id)
  VALUES (target_user_id, admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  -- Also set as primary role in profiles
  UPDATE profiles 
  SET primary_role_id = admin_role_id
  WHERE id = target_user_id;
  
  RAISE NOTICE 'Admin role assigned to user %', target_user_id;
END $$;

-- Verify that the admin role was assigned
SELECT 
  p.email, 
  r.name AS role_name
FROM 
  user_roles ur
JOIN 
  profiles p ON ur.user_id = p.id
JOIN 
  roles r ON ur.role_id = r.id
WHERE 
  r.name = 'admin';
