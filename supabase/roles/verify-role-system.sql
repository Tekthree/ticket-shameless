-- Verification script for the role-based authentication system
-- Run this to check if all components are set up correctly

-- 1. Check if the roles table exists and has the expected roles
SELECT name, description FROM roles ORDER BY id;

-- 2. Check if the user_roles table exists and has any entries
SELECT 
  ur.id,
  p.email,
  r.name AS role_name
FROM 
  user_roles ur
JOIN 
  profiles p ON ur.user_id = p.id
JOIN 
  roles r ON ur.role_id = r.id
ORDER BY 
  p.email, r.name;

-- 3. Check if the profiles table has the primary_role_id column
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'profiles' AND 
  column_name = 'primary_role_id';

-- 4. Check the event_artists table structure
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'event_artists'
ORDER BY 
  ordinal_position;

-- 5. Check if the guest_lists table exists and its structure
SELECT 
  table_name 
FROM 
  information_schema.tables 
WHERE 
  table_name = 'guest_lists';

SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'guest_lists'
ORDER BY 
  ordinal_position;

-- 6. Check if the RLS policies are correctly set up
SELECT 
  tablename, 
  policyname, 
  cmd, 
  permissive 
FROM 
  pg_policies 
WHERE 
  tablename IN ('roles', 'user_roles', 'event_artists', 'guest_lists')
ORDER BY 
  tablename, policyname;

-- 7. Check if the trigger functions exist
SELECT 
  proname, 
  proargnames, 
  prosrc 
FROM 
  pg_proc 
WHERE 
  proname IN ('assign_customer_role_to_new_user', 'handle_new_user')
  AND prokind = 'f';

-- 8. Check if the triggers are attached to the auth.users table
SELECT 
  tgname, 
  tgtype, 
  tgenabled, 
  tgisinternal 
FROM 
  pg_trigger 
WHERE 
  tgrelid = 'auth.users'::regclass;

-- 9. Test the has_role and current_user_has_role functions
SELECT has_role('00000000-0000-0000-0000-000000000000'::uuid, 'admin');
SELECT current_user_has_role('admin');

-- 10. Check if any user has been assigned the admin role
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
