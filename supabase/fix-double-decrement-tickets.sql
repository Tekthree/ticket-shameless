-- First, let's search for any triggers on orders or tickets tables
SELECT trigger_name, event_object_table, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('orders', 'tickets', 'events');

-- Add tracking column for ticket count processing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ticket_count_updated BOOLEAN DEFAULT FALSE;

-- Disable any existing ticket-related triggers
DROP TRIGGER IF EXISTS orders_ticket_count_trigger ON orders;
DROP TRIGGER IF EXISTS update_events_modified ON events;

-- Add a trigger to handle ticket counts when an order is created
CREATE OR REPLACE FUNCTION handle_ticket_count_update()
RETURNS TRIGGER AS $$
DECLARE
  current_remaining INTEGER;
  new_remaining INTEGER;
BEGIN
  -- Only process if order is completed and hasn't been processed yet
  IF NEW.status = 'completed' AND 
     (TG_OP = 'INSERT' OR 
      (TG_OP = 'UPDATE' AND 
       (OLD.ticket_count_updated IS NULL OR OLD.ticket_count_updated = FALSE))) THEN
    
    -- Get current tickets_remaining
    SELECT tickets_remaining INTO current_remaining
    FROM events
    WHERE id = NEW.event_id;
    
    -- Calculate new tickets_remaining
    new_remaining := GREATEST(0, current_remaining - NEW.quantity);
    
    -- Update the event
    UPDATE events
    SET 
      tickets_remaining = new_remaining,
      sold_out = CASE WHEN new_remaining <= 0 THEN TRUE ELSE FALSE END
    WHERE id = NEW.event_id;
    
    -- Mark order as processed
    NEW.ticket_count_updated := TRUE;
    
    -- Log the update
    RAISE NOTICE 'Updated ticket count for event %, remaining: %', NEW.event_id, new_remaining;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on orders
CREATE TRIGGER orders_ticket_count_trigger
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_ticket_count_update();

-- Create another handler that will block ticket-related triggers from affecting event counts
CREATE OR REPLACE FUNCTION prevent_ticket_event_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- If the trigger is trying to update the tickets_remaining or sold_out fields,
  -- only allow it if it's coming from our orders_ticket_count_trigger
  IF TG_OP = 'UPDATE' AND 
     (NEW.tickets_remaining != OLD.tickets_remaining OR NEW.sold_out != OLD.sold_out) AND
     current_query() NOT LIKE '%handle_ticket_count_update%' THEN
    
    RAISE NOTICE 'Blocking unintended update to event tickets_remaining from: %', current_query();
    
    -- Reset the values to their previous state
    NEW.tickets_remaining := OLD.tickets_remaining;
    NEW.sold_out := OLD.sold_out;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the blocking trigger on events
CREATE TRIGGER prevent_unintended_ticket_updates
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION prevent_ticket_event_updates();

-- Re-add the update_modified_column trigger that might have been present before
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_modified
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Update any existing completed orders that haven't been processed
UPDATE orders
SET ticket_count_updated = TRUE
WHERE status = 'completed' AND 
      (ticket_count_updated IS NULL OR ticket_count_updated = FALSE);

-- Now create a function to check where ticket counts might be getting decremented
CREATE OR REPLACE FUNCTION debug_ticket_decrements()
RETURNS TABLE (
  trigger_name TEXT,
  table_name TEXT,
  action TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.trigger_name::TEXT,
    t.event_object_table::TEXT,
    t.action_statement::TEXT,
    '