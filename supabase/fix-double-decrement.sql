-- FIXING DOUBLE DECREMENT ISSUE
-- This script removes all previous ticket count update mechanisms and establishes a single source of truth

-- First, drop the old trigger from fix-ticket-count.sql that's causing duplicate decrements
DROP TRIGGER IF EXISTS after_order_insert ON orders;

-- Also drop the update_event_ticket_count function that was used by the old trigger
DROP FUNCTION IF EXISTS update_event_ticket_count();

-- Add tracking column for ticket count processing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ticket_count_updated BOOLEAN DEFAULT FALSE;

-- Create a new function to handle ticket counts when an order is created
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

-- Drop any existing triggers that might be handling ticket counts
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