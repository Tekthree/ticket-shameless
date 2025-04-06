-- First, let's check if the event_artists table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'event_artists'
  ) THEN
    RAISE NOTICE 'event_artists table exists';
  ELSE
    RAISE NOTICE 'event_artists table does not exist';
  END IF;
END $$;

-- Check the event_artists table structure if it exists
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'event_artists';

-- If the table doesn't exist or has incorrect column names, let's create it properly
DROP TABLE IF EXISTS event_artists;

CREATE TABLE IF NOT EXISTS event_artists (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Changed from user_id to artist_id
  is_headliner BOOLEAN DEFAULT false,
  can_manage_guestlist BOOLEAN DEFAULT true,
  guestlist_allocation INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, artist_id)
);

-- Update the referenced column name in policies
CREATE OR REPLACE POLICY "Artists can view their own event guest lists" ON guest_lists
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM event_artists ea
      WHERE ea.event_id = guest_lists.event_id
      AND ea.artist_id = auth.uid() -- Changed from user_id to artist_id
    )
  );
  
CREATE OR REPLACE POLICY "Guest list managers can add guests" ON guest_lists
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
      AND ea.artist_id = auth.uid() -- Changed from user_id to artist_id
      AND ea.can_manage_guestlist = true
    )
  );
