-- Migration: Add Ticket Sales Processing System (2025-04-07)

-- Create ticket_types table
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updating the updated_at field
CREATE TRIGGER update_ticket_types_modified
BEFORE UPDATE ON ticket_types
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id),
  qr_code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active', -- active, used, refunded, voided
  is_scanned BOOLEAN DEFAULT false,
  scanned_at TIMESTAMP WITH TIME ZONE,
  scanned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updating the updated_at field
CREATE TRIGGER update_tickets_modified
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Create ticket_transactions table for audit trail
CREATE TABLE IF NOT EXISTS ticket_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id),
  order_id UUID REFERENCES orders(id),
  event_id UUID REFERENCES events(id),
  action TEXT NOT NULL, -- 'sale', 'refund', 'void', 'scan', 'modify'
  performed_by UUID REFERENCES profiles(id) NOT NULL,
  location TEXT, -- Physical location or 'online'
  device_info TEXT, -- Information about device
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update orders table with additional fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES profiles(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS processing_location TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Create function to generate unique QR codes
CREATE OR REPLACE FUNCTION generate_unique_qr_code() 
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a unique code
    new_code := encode(gen_random_bytes(8), 'hex');
    
    -- Check if code already exists
    SELECT EXISTS (
      SELECT 1 FROM tickets WHERE qr_code = new_code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create view for ticket sales by staff
CREATE OR REPLACE VIEW ticket_sales_by_staff AS
SELECT 
  p.id as staff_id,
  p.display_name as staff_name,
  COUNT(o.id) as transactions_processed,
  COUNT(t.id) as tickets_sold,
  SUM(o.amount_total) as total_sales,
  MIN(o.created_at) as first_transaction,
  MAX(o.created_at) as last_transaction
FROM 
  orders o
  JOIN profiles p ON o.processed_by = p.id
  LEFT JOIN tickets t ON t.order_id = o.id
GROUP BY 
  p.id, p.display_name;

-- Create view for event scan status
CREATE OR REPLACE VIEW event_scan_status AS
SELECT
  e.id as event_id,
  e.title as event_name,
  e.date as event_date,
  COUNT(t.id) as total_tickets,
  SUM(CASE WHEN t.is_scanned THEN 1 ELSE 0 END) as scanned_tickets,
  CASE 
    WHEN COUNT(t.id) > 0 
    THEN ROUND((SUM(CASE WHEN t.is_scanned THEN 1 ELSE 0 END)::numeric / COUNT(t.id)::numeric) * 100, 2)
    ELSE 0
  END as scan_percentage
FROM
  events e
  LEFT JOIN tickets t ON t.event_id = e.id
GROUP BY
  e.id, e.title, e.date
ORDER BY
  e.date DESC;

-- Add Row Level Security
-- Enable RLS on ticket_types table
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;

-- Create policies for ticket_types table
CREATE POLICY "Public can view ticket types" ON ticket_types
  FOR SELECT
  USING (true);

CREATE POLICY "Admin, event managers and box office can manage ticket types" ON ticket_types
  FOR ALL
  USING (
    current_user_has_role('admin') OR 
    current_user_has_role('event_manager') OR 
    current_user_has_role('box_office')
  );

-- Enable RLS on tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets table
CREATE POLICY "Users can view their own tickets" ON tickets
  FOR SELECT
  USING (
    current_user_has_role('admin') OR 
    current_user_has_role('event_manager') OR 
    current_user_has_role('box_office') OR
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = tickets.order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin, event managers and box office can manage tickets" ON tickets
  FOR ALL
  USING (
    current_user_has_role('admin') OR 
    current_user_has_role('event_manager') OR 
    current_user_has_role('box_office')
  );

-- Enable RLS on ticket_transactions table
ALTER TABLE ticket_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for ticket_transactions table
CREATE POLICY "Admin, event managers and box office can view transactions" ON ticket_transactions
  FOR SELECT
  USING (
    current_user_has_role('admin') OR 
    current_user_has_role('event_manager') OR 
    current_user_has_role('box_office')
  );

CREATE POLICY "Admin, event managers and box office can insert transactions" ON ticket_transactions
  FOR INSERT
  WITH CHECK (
    current_user_has_role('admin') OR 
    current_user_has_role('event_manager') OR 
    current_user_has_role('box_office')
  );
