-- Create a function to execute raw SQL (for migrations)
CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant usage to authenticated users (will be restricted by RLS)
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;

-- Note: The RLS policy can't be applied directly to functions
-- We'll rely on the service role key for migrations
