-- Add user_id column to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add index for faster user_id lookups
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);

-- Add policy for users to view their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Update policy for webhook inserts to allow null user_id
DROP POLICY IF EXISTS "Allow public inserts for webhooks" ON orders;
CREATE POLICY "Allow public inserts for webhooks" ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add policy for admin users to view all orders
DROP POLICY IF EXISTS "Admin users can view all orders" ON orders;
CREATE POLICY "Admin users can view all orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'event_manager')
    )
  );
