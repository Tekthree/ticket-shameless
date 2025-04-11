-- Grant execute permissions on the decrement function
GRANT EXECUTE ON FUNCTION public.decrement(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.decrement(UUID, INTEGER) TO service_role;

-- Create a trigger to automatically update tickets_remaining when new orders are created
CREATE OR REPLACE FUNCTION update_event_ticket_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the decrement function when a new order is inserted
  PERFORM decrement(NEW.event_id, NEW.quantity);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS after_order_insert ON orders;

-- Create the trigger
CREATE TRIGGER after_order_insert
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION update_event_ticket_count();

-- Ensure all policies allow updating events table
DROP POLICY IF EXISTS "Allow updating events" ON events;
CREATE POLICY "Allow updating events" ON events
  FOR UPDATE
  USING (true);

-- Reset any events with incorrect ticket counts
UPDATE events
SET tickets_remaining = tickets_total - COALESCE((
  SELECT SUM(quantity) 
  FROM orders 
  WHERE orders.event_id = events.id 
  AND status = 'completed'
), 0),
sold_out = CASE 
  WHEN (tickets_total - COALESCE((
    SELECT SUM(quantity) 
    FROM orders 
    WHERE orders.event_id = events.id 
    AND status = 'completed'
  ), 0)) <= 0 THEN true 
  ELSE false 
END;
