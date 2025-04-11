-- Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
  qr_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  price NUMERIC DEFAULT 0,
  is_scanned BOOLEAN DEFAULT FALSE,
  scanned_at TIMESTAMP WITH TIME ZONE,
  scanned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS tickets_order_id_idx ON tickets(order_id);
CREATE INDEX IF NOT EXISTS tickets_event_id_idx ON tickets(event_id);
CREATE INDEX IF NOT EXISTS tickets_qr_code_idx ON tickets(qr_code);

-- Enable RLS on tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets table
CREATE POLICY "Public can view tickets" ON tickets
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert tickets" ON tickets
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tickets" ON tickets
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Ticket Transactions Table
CREATE TABLE IF NOT EXISTS ticket_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  location TEXT,
  device_info TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ticket_transactions table
ALTER TABLE ticket_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for ticket_transactions table
CREATE POLICY "Authenticated users can insert ticket_transactions" ON ticket_transactions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view ticket_transactions" ON ticket_transactions
  FOR SELECT
  USING (auth.role() = 'authenticated');