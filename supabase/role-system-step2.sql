-- Step 1: Set up RLS policies for role-based access
-- For the roles table
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
DROP POLICY IF EXISTS "Only admins can modify roles" ON roles;

-- Create new policies
CREATE POLICY "Anyone can view roles" ON roles
  FOR SELECT USING (true);
  
CREATE POLICY "Only admins can modify roles" ON roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- For the user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can modify user roles" ON user_roles;

-- Create new policies
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = (SELECT id FROM roles WHERE name = 'admin')
    )
  );
  
CREATE POLICY "Only admins can modify user roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- For the event_artists table
ALTER TABLE event_artists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view event artists" ON event_artists;
DROP POLICY IF EXISTS "Admins and event managers can modify event artists" ON event_artists;

-- Create new policies
CREATE POLICY "Public can view event artists" ON event_artists
  FOR SELECT USING (true);
  
CREATE POLICY "Admins and event managers can modify event artists" ON event_artists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'event_manager')
      )
    )
  );

-- For the guest_lists table
ALTER TABLE guest_lists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Event managers and admins can view all guest lists" ON guest_lists;
DROP POLICY IF EXISTS "Artists can view their own event guest lists" ON guest_lists;
DROP POLICY IF EXISTS "Guest list managers can add guests" ON guest_lists;
DROP POLICY IF EXISTS "Users can update their own guest lists" ON guest_lists;
DROP POLICY IF EXISTS "Box office can check in guests" ON guest_lists;

-- Create new policies
CREATE POLICY "Event managers and admins can view all guest lists" ON guest_lists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'event_manager', 'box_office')
      )
    )
  );
  
CREATE POLICY "Artists can view their own event guest lists" ON guest_lists
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM event_artists ea
      WHERE ea.event_id = guest_lists.event_id
      AND ea.artist_id = auth.uid()
    )
  );
  
CREATE POLICY "Guest list managers can add guests" ON guest_lists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'event_manager', 'guest_list_manager')
      )
    ) OR
    EXISTS (
      SELECT 1 FROM event_artists ea
      WHERE ea.event_id = guest_lists.event_id
      AND ea.artist_id = auth.uid()
      AND ea.can_manage_guestlist = true
    )
  );
  
CREATE POLICY "Users can update their own guest lists" ON guest_lists
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'event_manager')
      )
    )
  );

CREATE POLICY "Box office can check in guests" ON guest_lists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'box_office')
      )
    )
  );

-- Adjust events table policies if needed
DROP POLICY IF EXISTS "Public can view events" ON events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON events;

CREATE POLICY "Public can view events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Event managers and admins can insert events" ON events
  FOR INSERT WITH CHECK (
    current_user_has_role('admin') OR current_user_has_role('event_manager')
  );

CREATE POLICY "Event managers and admins can update events" ON events
  FOR UPDATE USING (
    current_user_has_role('admin') OR current_user_has_role('event_manager')
  );

CREATE POLICY "Only admins can delete events" ON events
  FOR DELETE USING (
    current_user_has_role('admin')
  );

-- Fix profile table RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;

-- Allow users to view profiles if they are an admin, or if it's their own profile
CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role_id = (SELECT id FROM roles WHERE name = 'admin')
    )
  );
