-- Create a procedure to reset and recalculate ticket counts for an event
CREATE OR REPLACE PROCEDURE fix_ticket_counts(event_uuid UUID)
LANGUAGE plpgsql
AS $$
DECLARE
  total_tickets INTEGER;
  sold_tickets INTEGER;
  remaining_tickets INTEGER;
BEGIN
  -- Get the total tickets for the event
  SELECT tickets_total INTO total_tickets
  FROM events
  WHERE id = event_uuid;
  
  -- Calculate sold tickets from orders
  SELECT COALESCE(SUM(quantity), 0) INTO sold_tickets
  FROM orders
  WHERE event_id = event_uuid
  AND status = 'completed';
  
  -- Calculate remaining tickets
  remaining_tickets := GREATEST(0, total_tickets - sold_tickets);
  
  -- Update the event with the correct count
  UPDATE events
  SET 
    tickets_remaining = remaining_tickets,
    sold_out = CASE WHEN remaining_tickets <= 0 THEN TRUE ELSE FALSE END
  WHERE id = event_uuid;
  
  -- Log the update
  RAISE NOTICE 'Fixed ticket counts for event %. Total: %, Sold: %, Remaining: %',
    event_uuid, total_tickets, sold_tickets, remaining_tickets;
END;
$$;

-- Create a function to check ticket counts without modifying them
CREATE OR REPLACE FUNCTION check_ticket_counts(event_uuid UUID)
RETURNS TABLE (
  tickets_total INTEGER,
  current_remaining INTEGER,
  calculated_remaining INTEGER,
  discrepancy INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  total_tickets INTEGER;
  current_remaining INTEGER;
  sold_tickets INTEGER;
  calculated_remaining INTEGER;
BEGIN
  -- Get the event data
  SELECT 
    e.tickets_total, 
    e.tickets_remaining INTO total_tickets, current_remaining
  FROM events e
  WHERE id = event_uuid;
  
  -- Calculate sold tickets from orders
  SELECT COALESCE(SUM(quantity), 0) INTO sold_tickets
  FROM orders
  WHERE event_id = event_uuid
  AND status = 'completed';
  
  -- Calculate what remaining should be
  calculated_remaining := GREATEST(0, total_tickets - sold_tickets);
  
  -- Return the results
  RETURN QUERY
  SELECT 
    total_tickets AS tickets_total,
    current_remaining AS current_remaining,
    calculated_remaining AS calculated_remaining,
    (current_remaining - calculated_remaining) AS discrepancy;
END;
$$;

-- Function to fix ticket counts for all events
CREATE OR REPLACE FUNCTION fix_all_ticket_counts()
RETURNS TABLE (
  event_id UUID,
  event_title TEXT,
  old_remaining INTEGER,
  new_remaining INTEGER,
  fixed BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  event_record RECORD;
  check_result RECORD;
BEGIN
  -- Loop through all events
  FOR event_record IN 
    SELECT id, title FROM events
  LOOP
    -- Check current counts
    SELECT * INTO check_result 
    FROM check_ticket_counts(event_record.id);
    
    -- Only fix if there's a discrepancy
    IF check_result.discrepancy != 0 THEN
      -- Fix the counts
      CALL fix_ticket_counts(event_record.id);
      
      -- Return the result
      event_id := event_record.id;
      event_title := event_record.title;
      old_remaining := check_result.current_remaining;
      new_remaining := check_result.calculated_remaining;
      fixed := TRUE;
      RETURN NEXT;
    ELSE
      -- Return that no fix was needed
      event_id := event_record.id;
      event_title := event_record.title;
      old_remaining := check_result.current_remaining;
      new_remaining := check_result.current_remaining;
      fixed := FALSE;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;