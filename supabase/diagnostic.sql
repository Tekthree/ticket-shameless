-- Diagnostic script to identify and fix "Database error saving new user" issues

-- Step 1: Check for problematic triggers on auth.users
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM 
  information_schema.triggers 
WHERE 
  event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- Step 2: Check for any constraint violations or errors in the profiles table
SELECT
  table_name,
  constraint_name,
  constraint_type
FROM
  information_schema.table_constraints
WHERE
  table_name = 'profiles'
  AND constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY');

-- Step 3: View the definition of the handle_new_user function
SELECT 
  pg_get_functiondef(oid) 
FROM 
  pg_proc 
WHERE 
  proname = 'handle_new_user';

-- Step 4: Check if there are any orphaned profiles (profiles without a corresponding auth.users entry)
SELECT p.id 
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- Step 5: Check for duplicate emails in profiles
SELECT email, COUNT(*) 
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Step 6: Check the profiles table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'profiles';

-- Step 7: Check for any active RLS policies that might interfere with user creation
SELECT
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM
  pg_policies
WHERE
  tablename = 'profiles';
