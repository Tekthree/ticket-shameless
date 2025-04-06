-- Fix remaining problematic policies without recreating existing ones

-- Drop just the remaining problematic policy on user_roles
DROP POLICY IF EXISTS "Only admins can modify user roles" ON user_roles;

-- Create replacement policy if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' AND policyname = 'Authenticated users can modify user roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can modify user roles" ON user_roles
      FOR ALL USING (auth.role() = ''authenticated'')';
  END IF;
END $$;

-- Check if we have policies on the roles table
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'roles';

-- Make sure roles has simple policies too
DROP POLICY IF EXISTS "Only admins can modify roles" ON roles;

-- Create simple policy for roles if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'roles' AND policyname = 'Anyone can view roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view roles" ON roles
      FOR SELECT USING (true)';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'roles' AND policyname = 'Authenticated users can modify roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can modify roles" ON roles
      FOR ALL USING (auth.role() = ''authenticated'')';
  END IF;
END $$;

-- Grant appropriate permissions
GRANT SELECT ON roles TO anon, authenticated;
GRANT SELECT ON user_roles TO anon, authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT SELECT ON profiles TO anon, authenticated;
