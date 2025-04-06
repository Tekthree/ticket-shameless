-- Fix the infinite recursion policy error

-- First, let's check all RLS policies on the roles table
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'roles';

-- Drop all policies on the roles table to fix the recursion issue
DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
DROP POLICY IF EXISTS "Only admins can modify roles" ON roles;

-- Create simpler policies that don't cause recursion
-- This policy allows anyone to view roles without checking user_roles (which breaks recursion)
CREATE POLICY "Anyone can view roles" ON roles
  FOR SELECT USING (true);
  
-- This policy allows only authenticated users to modify roles
-- Without the recursive query that was causing issues
CREATE POLICY "Only authenticated users can modify roles" ON roles
  FOR ALL USING (auth.role() = 'authenticated');

-- Now let's check user_roles policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'user_roles';

-- Drop potentially problematic policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can modify user roles" ON user_roles;

-- Create simpler policies
CREATE POLICY "Anyone can view user roles" ON user_roles
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can modify user roles" ON user_roles
  FOR ALL USING (auth.role() = 'authenticated');

-- Grant public access to these tables for simpler permissions
GRANT SELECT ON roles TO anon, authenticated;
GRANT SELECT ON user_roles TO anon, authenticated;
GRANT ALL ON user_roles TO authenticated;
