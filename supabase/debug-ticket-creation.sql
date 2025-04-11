-- Function to check for existing triggers on the tickets table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tickets';

-- Function to check if there are any triggers on orders that create tickets
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders';

-- Check if there's a correlation between orders and tickets counts
SELECT 
  e.id AS event_id,
  e.title AS event_title,
  e.tickets_total,
  e.tickets_remaining,
  COUNT(DISTINCT o.id) AS order_count,
  SUM(o.quantity) AS total_ordered,
  COUNT(t.id) AS ticket_count,
  (e.tickets_total - e.tickets_remaining) AS reported_sold,
  (e.tickets_total - e.tickets_remaining) - SUM(COALESCE(o.quantity, 0)) AS discrepancy_orders,
  (e.tickets_total - e.tickets_remaining) - COUNT(t.id) AS discrepancy_tickets
FROM 
  events e
  LEFT JOIN orders o ON e.id = o.event_id AND o.status = 'completed'
  LEFT JOIN tickets t ON e.id = t.event_id AND o.id = t.order_id
GROUP BY e.id, e.title, e.tickets_total, e.tickets_remaining
ORDER BY ABS((e.tickets_total - e.tickets_remaining) - SUM(COALESCE(o.quantity, 0))) DESC;

-- Check if there's a trigger or something else on tickets that decrements event counts
CREATE OR REPLACE FUNCTION check_ticket_impact()
RETURNS VOID AS $$
DECLARE
  test_event_id UUID;
  initial_count INTEGER;
  count_after_order INTEGER;
  count_after_tickets INTEGER;
  test_order_id UUID;
BEGIN
  -- Create a test event
  INSERT INTO events (
    title, slug, description, date, time, venue, address, 
    image, price, tickets_total, tickets_remaining, promoter, age_restriction
  ) 
  VALUES (
    'TEST EVENT - WILL DELETE', 
    'test-event-' || EXTRACT(EPOCH FROM NOW())::TEXT, 
    'Test Description', 
    NOW(), 
    '8:00 PM', 
    'Test Venue', 
    '123 Test St', 
    'https://example.com/image.jpg',
    10.00,
    100,
    100,
    'Test Promoter',
    '21+'
  )
  RETURNING id INTO test_event_id;
  
  -- Get initial count
  SELECT tickets_remaining INTO initial_count
  FROM events
  WHERE id = test_event_id;
  
  RAISE NOTICE 'Initial tickets_remaining: %', initial_count;
  
  -- Create a test order (but don't actually insert tickets)
  INSERT INTO orders (
    event_id, stripe_session_id, customer_email, 
    customer_name, amount_total, status, quantity
  )
  VALUES (
    test_event_id,
    'test_session_' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'test@example.com',
    'Test Customer',
    20.00,
    'completed',
    2
  )
  RETURNING id INTO test_order_id;
  
  -- Check count after order
  SELECT tickets_remaining INTO count_after_order
  FROM events
  WHERE id = test_event_id;
  
  RAISE NOTICE 'Tickets remaining after order: %', count_after_order;
  RAISE NOTICE 'Difference after order: %', initial_count - count_after_order;
  
  -- Now create ticket records
  INSERT INTO tickets (
    order_id, event_id, ticket_type_id, qr_code, status, price
  )
  VALUES
    (
      test_order_id, 
      test_event_id, 
      NULL, 
      'test_ticket_1_' || EXTRACT(EPOCH FROM NOW())::TEXT, 
      'active',
      10.00
    ),
    (
      test_order_id, 
      test_event_id, 
      NULL, 
      'test_ticket_2_' || EXTRACT(EPOCH FROM NOW())::TEXT, 
      'active',
      10.00
    );
  
  -- Check count after tickets
  SELECT tickets_remaining INTO count_after_tickets
  FROM events
  WHERE id = test_event_id;
  
  RAISE NOTICE 'Tickets remaining after creating tickets: %', count_after_tickets;
  RAISE NOTICE 'Difference after tickets: %', count_after_order - count_after_tickets;
  
  -- Clean up test data
  DELETE FROM tickets WHERE order_id = test_order_id;
  DELETE FROM orders WHERE id = test_order_id;
  DELETE FROM events WHERE id = test_event_id;
  
  -- Return results
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Initial count: %', initial_count;
  RAISE NOTICE '  After order: % (change: %)', count_after_order, initial_count - count_after_order;
  RAISE NOTICE '  After tickets: % (change: %)', count_after_tickets, count_after_order - count_after_tickets;
  RAISE NOTICE '  Total change: %', initial_count - count_after_tickets;
END;
$$ LANGUAGE plpgsql;

-- Run the test function
SELECT check_ticket_impact();