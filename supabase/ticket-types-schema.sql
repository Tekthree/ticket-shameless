-- Ticket Types Table
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS ticket_types_event_id_idx ON ticket_types(event_id);

-- Enable RLS on ticket_types table
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;

-- Create policies for ticket_types table
CREATE POLICY "Public can view ticket_types" ON ticket_types
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert ticket_types" ON ticket_types
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update ticket_types" ON ticket_types
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete ticket_types" ON ticket_types
  FOR DELETE
  USING (auth.role() = 'authenticated');