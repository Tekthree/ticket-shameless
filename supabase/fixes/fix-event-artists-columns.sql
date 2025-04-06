-- First, let's check the actual structure of the event_artists table
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'event_artists';

-- Now let's add the missing columns if they don't exist
DO $$
BEGIN
  -- Add can_manage_guestlist column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'event_artists' AND column_name = 'can_manage_guestlist'
  ) THEN
    ALTER TABLE event_artists ADD COLUMN can_manage_guestlist BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added can_manage_guestlist column to event_artists table';
  END IF;
  
  -- Add guestlist_allocation column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'event_artists' AND column_name = 'guestlist_allocation'
  ) THEN
    ALTER TABLE event_artists ADD COLUMN guestlist_allocation INTEGER DEFAULT 10;
    RAISE NOTICE 'Added guestlist_allocation column to event_artists table';
  END IF;
  
  -- Add is_headliner column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'event_artists' AND column_name = 'is_headliner'
  ) THEN
    ALTER TABLE event_artists ADD COLUMN is_headliner BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_headliner column to event_artists table';
  END IF;
END $$;

-- Update the policies to use the correct column names from the actual table
DO $$
DECLARE
  user_col TEXT := 'artist_id'; -- Default assumption based on your previous error
BEGIN
  -- Check if artist_id column exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'event_artists' AND column_name = 'artist_id'
  ) THEN
    user_col := 'artist_id';
    RAISE NOTICE 'Using artist_id as user column';
  -- Check if user_id column exists
  ELSIF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'event_artists' AND column_name = 'user_id'
  ) THEN
    user_col := 'user_id';
    RAISE NOTICE 'Using user_id as user column';
  ELSE
    RAISE EXCEPTION 'Could not find user_id or artist_id column in event_artists table';
  END IF;
  
  -- Drop and recreate the policies with the correct column name
  -- First, drop existing policies if they exist
  DROP POLICY IF EXISTS "Artists can view their own event guest lists" ON guest_lists;
  DROP POLICY IF EXISTS "Guest list managers can add guests" ON guest_lists;
  
  -- Then create new ones with the correct column references
  EXECUTE format('
    CREATE POLICY "Artists can view their own event guest lists" ON guest_lists
    FOR SELECT USING (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM event_artists ea
        WHERE ea.event_id = guest_lists.event_id
        AND ea.%I = auth.uid()
      )
    )', user_col);
  
  EXECUTE format('
    CREATE POLICY "Guest list managers can add guests" ON guest_lists
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role_id IN (
          SELECT id FROM roles WHERE name IN (''admin'', ''event_manager'', ''guest_list_manager'')
        )
      ) OR
      EXISTS (
        SELECT 1 FROM event_artists ea
        WHERE ea.event_id = guest_lists.event_id
        AND ea.%I = auth.uid()
        AND ea.can_manage_guestlist = true
      )
    )', user_col);
  
  RAISE NOTICE 'Updated policies with column %', user_col;
END $$;
