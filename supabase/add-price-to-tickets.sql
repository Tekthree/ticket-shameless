-- Add price column to tickets table if it doesn't exist
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;

-- Update existing tickets to have the correct price from ticket_types
UPDATE tickets 
SET price = tt.price
FROM ticket_types tt
WHERE tickets.ticket_type_id = tt.id
AND tickets.price = 0;