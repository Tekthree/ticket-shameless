-- Function to disable RLS for seeding
CREATE OR REPLACE FUNCTION disable_rls_for_seeding()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This will run with the privileges of the function creator
AS $$
BEGIN
  -- Temporarily disable RLS on events table
  ALTER TABLE events DISABLE ROW LEVEL SECURITY;
END;
$$;

-- Function to re-enable RLS after seeding
CREATE OR REPLACE FUNCTION enable_rls_for_seeding()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This will run with the privileges of the function creator
AS $$
BEGIN
  -- Re-enable RLS on events table
  ALTER TABLE events ENABLE ROW LEVEL SECURITY;
END;
$$;

-- Function to insert an event while bypassing RLS
CREATE OR REPLACE FUNCTION insert_event_bypassing_rls(event_data JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This will run with the privileges of the function creator
AS $$
BEGIN
  INSERT INTO events (
    title,
    slug,
    description,
    date,
    time,
    venue,
    address,
    image,
    price,
    tickets_total,
    tickets_remaining,
    sold_out,
    promoter,
    age_restriction,
    lineup
  ) VALUES (
    event_data->>'title',
    event_data->>'slug',
    event_data->>'description',
    (event_data->>'date')::TIMESTAMP WITH TIME ZONE,
    event_data->>'time',
    event_data->>'venue',
    event_data->>'address',
    event_data->>'image',
    (event_data->>'price')::NUMERIC,
    (event_data->>'tickets_total')::INTEGER,
    (event_data->>'tickets_remaining')::INTEGER,
    COALESCE((event_data->>'sold_out')::BOOLEAN, FALSE),
    event_data->>'promoter',
    event_data->>'age_restriction',
    event_data->>'lineup'
  )
  ON CONFLICT (slug)
  DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    date = EXCLUDED.date,
    time = EXCLUDED.time,
    venue = EXCLUDED.venue,
    address = EXCLUDED.address,
    image = EXCLUDED.image,
    price = EXCLUDED.price,
    tickets_total = EXCLUDED.tickets_total,
    tickets_remaining = EXCLUDED.tickets_remaining,
    sold_out = EXCLUDED.sold_out,
    promoter = EXCLUDED.promoter,
    age_restriction = EXCLUDED.age_restriction,
    lineup = EXCLUDED.lineup,
    updated_at = NOW();
END;
$$;
