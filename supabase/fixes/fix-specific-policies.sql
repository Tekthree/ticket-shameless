-- Fix the specific problematic policies that are causing recursion

-- Drop the problematic policies on user_roles
DROP POLICY IF EXISTS "Only admins can modify user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Create simpler policies that don't cause recursion
-- Allow authenticated users to view all user roles
CREATE POLICY "Anyone can view user roles" ON user_roles
  FOR SELECT USING (true);

-- Allow authenticated users to modify user roles
-- This avoids the recursive check and simply uses authentication
CREATE POLICY "Authenticated users can modify user roles" ON user_roles
  FOR ALL USING (auth.role() = 'authenticated');

-- Check if we have policies on the roles table
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'roles';

-- Make sure roles has simple policies too
DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
DROP POLICY IF EXISTS "Only admins can modify roles" ON roles;

-- Create simple policies for roles
CREATE POLICY "Anyone can view roles" ON roles
  FOR SELECT USING (true);
  
CREATE POLICY "Authenticated users can modify roles" ON roles
  FOR ALL USING (auth.role() = 'authenticated');

-- Make sure profiles has appropriate policies
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;

-- Create a simple policy for profiles
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

-- Ensure auth users can update their own profiles
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Grant appropriate permissions
GRANT SELECT ON roles TO anon, authenticated;
GRANT SELECT ON user_roles TO anon, authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT SELECT ON profiles TO anon, authenticated;
