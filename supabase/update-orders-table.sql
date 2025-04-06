-- Add user_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add index for faster user_id lookups
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);

-- Add policy for users to view their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Update policy for webhook inserts
DROP POLICY IF EXISTS "Allow public inserts for webhooks" ON orders;
CREATE POLICY "Allow public inserts for webhooks" ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure admins can see all orders
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON orders;
CREATE POLICY "Admin users can view all orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND (r.name = 'admin' OR r.name = 'event_manager')
    )
  );
