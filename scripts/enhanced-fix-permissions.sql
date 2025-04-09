-- Enhanced script to fix webhook permissions for orders table

-- 1. Make sure customer_phone column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_phone TEXT;
    END IF;
END $$;

-- 2. Make sure metadata column exists (for storing non-UUID event IDs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE orders ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. Fix the event_id foreign key constraint to allow NULL values
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_event_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES events(id) 
  ON DELETE SET NULL 
  DEFERRABLE INITIALLY DEFERRED;

-- 4. Drop and recreate Row Level Security policies for the orders table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Allow public inserts for webhooks" ON orders;
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON orders;
DROP POLICY IF EXISTS "Admin users can view all orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Allow webhooks to insert orders" ON orders;
DROP POLICY IF EXISTS "Everyone can view orders" ON orders;
DROP POLICY IF EXISTS "Allow webhook inserts" ON orders;
DROP POLICY IF EXISTS "Only admins can update orders" ON orders;

-- 5. Create the necessary policies
-- Allow ANYONE to insert into orders (needed for webhook)
CREATE POLICY "Allow webhook inserts" ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users with proper roles to view all orders
CREATE POLICY "Admin users can view all orders" ON orders
  FOR SELECT
  USING (
    -- Admin or event manager can see all orders
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND (r.name = 'admin' OR r.name = 'event_manager')
    )
  );

-- Allow users to view their own orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 6. Make sure the service_role has all necessary permissions
GRANT ALL PRIVILEGES ON TABLE orders TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 7. TEMPORARILY DISABLE RLS FOR TESTING (remove this in production)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 8. Check existing RLS policies after changes
SELECT * FROM pg_policies WHERE tablename = 'orders';

-- 9. Check the current structure of the orders table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;
