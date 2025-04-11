-- Add tracking column for ticket count processing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ticket_count_updated BOOLEAN DEFAULT FALSE;

-- Add a trigger to handle ticket counts when an order is created
-- This will be the single source of truth for updating ticket counts
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS orders_ticket_count_trigger ON orders;

-- Create the trigger
CREATE TRIGGER orders_ticket_count_trigger
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_ticket_count_update();

-- Update any existing completed orders that haven't been processed
UPDATE orders
SET ticket_count_updated = TRUE
WHERE status = 'completed' AND 
      (ticket_count_updated IS NULL OR ticket_count_updated = FALSE);