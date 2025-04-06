-- Now that we've seen the actual structure of the event_artists table,
-- let's add the missing columns needed for guest list management

-- Add missing columns to event_artists table
ALTER TABLE event_artists 
  ADD COLUMN IF NOT EXISTS can_manage_guestlist BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS guestlist_allocation INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS is_headliner BOOLEAN DEFAULT false;

-- Now fix the policies to use artist_id instead of user_id
DROP POLICY IF EXISTS "Artists can view their own event guest lists" ON guest_lists;
CREATE POLICY "Artists can view their own event guest lists" ON guest_lists
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM event_artists ea
      WHERE ea.event_id = guest_lists.event_id
      AND ea.artist_id = auth.uid()
    )
  );
  
DROP POLICY IF EXISTS "Guest list managers can add guests" ON guest_lists;
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

-- Let's also update our TypeScript components to use artist_id instead of user_id
-- Note: This is just a reminder - you'll need to manually update these files
-- in your codebase
-- - EventArtistManager.tsx
-- - GuestListManager.tsx
