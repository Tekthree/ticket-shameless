-- Add tracking column for ticket count processing if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ticket_count_updated BOOLEAN DEFAULT FALSE;

-- Create or replace the trigger function to handle ticket count updates
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

-- Create diagnostic functions to check and fix ticket counts

-- Function to check ticket counts for an event
CREATE OR REPLACE FUNCTION check_ticket_counts(event_uuid UUID)
RETURNS TABLE(event_id UUID, event_title TEXT, expected_remaining INTEGER, actual_remaining INTEGER, discrepancy INTEGER) AS $$
DECLARE
  total_tickets INTEGER;
  sold_tickets INTEGER;
  expected_remaining INTEGER;
  actual_remaining INTEGER;
  event_title TEXT;
BEGIN
  -- Get event details
  SELECT events.title, events.tickets_total, events.tickets_remaining
  INTO event_title, total_tickets, actual_remaining
  FROM events
  WHERE id = event_uuid;
  
  -- Calculate sold tickets from orders
  SELECT COALESCE(SUM(quantity), 0)
  INTO sold_tickets
  FROM orders
  WHERE event_id = event_uuid AND status = 'completed';
  
  -- Calculate expected remaining tickets
  expected_remaining := GREATEST(0, total_tickets - sold_tickets);
  
  -- Return results
  RETURN QUERY SELECT 
    event_uuid, 
    event_title, 
    expected_remaining, 
    actual_remaining, 
    actual_remaining - expected_remaining;
END;
$$ LANGUAGE plpgsql;

-- Function to fix ticket counts for an event
CREATE OR REPLACE PROCEDURE fix_ticket_counts(event_uuid UUID)
LANGUAGE plpgsql
AS $$
DECLARE
  total_tickets INTEGER;
  sold_tickets INTEGER;
  expected_remaining INTEGER;
BEGIN
  -- Get total tickets for the event
  SELECT tickets_total INTO total_tickets
  FROM events
  WHERE id = event_uuid;
  
  -- Calculate sold tickets from orders
  SELECT COALESCE(SUM(quantity), 0)
  INTO sold_tickets
  FROM orders
  WHERE event_id = event_uuid AND status = 'completed';
  
  -- Calculate expected remaining tickets
  expected_remaining := GREATEST(0, total_tickets - sold_tickets);
  
  -- Update the event with correct count
  UPDATE events
  SET 
    tickets_remaining = expected_remaining,
    sold_out = CASE WHEN expected_remaining <= 0 THEN TRUE ELSE FALSE END
  WHERE id = event_uuid;
  
  RAISE NOTICE 'Fixed ticket count for event %. New remaining: %', event_uuid, expected_remaining;
END;
$$;

-- Function to check and fix all events
CREATE OR REPLACE FUNCTION fix_all_ticket_counts()
RETURNS TABLE(event_id UUID, event_title TEXT, old_remaining INTEGER, new_remaining INTEGER, fixed BOOLEAN) AS $$
DECLARE
  event_record RECORD;
  total_tickets INTEGER;
  sold_tickets INTEGER;
  expected_remaining INTEGER;
  actual_remaining INTEGER;
  needs_fixing BOOLEAN;
BEGIN
  FOR event_record IN SELECT id, title, tickets_total, tickets_remaining FROM events LOOP
    -- Get values for this event
    total_tickets := event_record.tickets_total;
    actual_remaining := event_record.tickets_remaining;
    
    -- Calculate sold tickets from orders
    SELECT COALESCE(SUM(quantity), 0)
    INTO sold_tickets
    FROM orders
    WHERE event_id = event_record.id AND status = 'completed';
    
    -- Calculate expected remaining tickets
    expected_remaining := GREATEST(0, total_tickets - sold_tickets);
    
    -- Check if fix is needed
    needs_fixing := (expected_remaining != actual_remaining);
    
    -- Fix if needed
    IF needs_fixing THEN
      UPDATE events
      SET 
        tickets_remaining = expected_remaining,
        sold_out = CASE WHEN expected_remaining <= 0 THEN TRUE ELSE FALSE END
      WHERE id = event_record.id;
    END IF;
    
    -- Return results for this event
    event_id := event_record.id;
    event_title := event_record.title;
    old_remaining := actual_remaining;
    new_remaining := expected_remaining;
    fixed := needs_fixing;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
