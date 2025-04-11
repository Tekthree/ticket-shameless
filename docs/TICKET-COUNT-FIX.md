# Fixing the Double-Decrementing Ticket Count Issue

## Problem Description

The application is currently experiencing an issue where ticket counts are being decremented twice when a purchase is made through Stripe, causing each purchase to reduce the `tickets_remaining` count by double the actual quantity purchased.

## Root Cause

After analyzing the codebase, we've identified that ticket counts are being updated in two places:

1. **Stripe Webhook Handler**: In `app/api/webhooks/stripe/route.ts`, when a Stripe checkout session is completed, the code explicitly updates the `tickets_remaining` field in the `events` table.

2. **Database Triggers/Functions**: The `decrement` function defined in `schema.sql` is also being called elsewhere in the application, causing a second update to the same field.

## Solution

The solution involves:

1. Creating a single source of truth for ticket count updates using a database trigger
2. Removing the explicit ticket count updates from the Stripe webhook handler
3. Ensuring each order is only processed once

## Implementation Steps

### 1. Apply the Database Trigger

Run the following SQL in your Supabase SQL editor. This creates a trigger that will handle ticket count updates when orders are created or modified:

```sql
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
```

This SQL script:
- Adds a `ticket_count_updated` column to track if an order has been processed for ticket counting
- Creates a trigger function that only updates ticket counts once per order
- Adds a trigger to the orders table to run this function when orders are inserted or updated
- Marks existing orders as processed to prevent retroactive double-counting

### 2. Update the Stripe Webhook Handler

Replace your current webhook handler at `app/api/webhooks/stripe/route.ts` with the updated version that removes the direct ticket count updates. The key change is removing the code block that explicitly decrements the `tickets_remaining` count.

You can copy the updated file from `app/api/webhooks/stripe/route.updated.ts`.

### 3. Verify the Fix

After implementing these changes, you should test the system by:

1. Creating a new test event with a specific number of tickets
2. Making a purchase through Stripe
3. Verifying that the ticket count decrements by exactly the purchased quantity (not double)

## Technical Details

### How the Trigger Works

The database trigger works by:

1. Checking if an order is completed and hasn't been processed for ticket counting yet
2. If both conditions are true, it:
   - Gets the current ticket count for the event
   - Calculates the new count by subtracting the purchase quantity
   - Updates the event with the new count
   - Marks the order as processed to prevent double-counting
   - Logs the update for monitoring

### Avoiding Race Conditions

This solution has several features to avoid race conditions and ensure data integrity:

1. Using a `BEFORE INSERT OR UPDATE` trigger ensures the ticket count is updated in the same transaction as the order creation
2. The `ticket_count_updated` flag prevents multiple updates for the same order
3. The Stripe webhook handler checks for existing orders to avoid duplicate processing

## Support

If you encounter any issues implementing this fix, please consult with the development team.