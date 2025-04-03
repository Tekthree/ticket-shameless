-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  time TEXT NOT NULL,
  venue TEXT NOT NULL,
  address TEXT NOT NULL,
  image TEXT NOT NULL,
  price NUMERIC NOT NULL,
  tickets_total INTEGER NOT NULL,
  tickets_remaining INTEGER NOT NULL,
  sold_out BOOLEAN DEFAULT FALSE,
  promoter TEXT NOT NULL,
  age_restriction TEXT,
  lineup JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger to update the updated_at field
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_modified
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  amount_total NUMERIC NOT NULL,
  status TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to decrement a value in a column
CREATE OR REPLACE FUNCTION decrement(row_id UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_value INTEGER;
  new_value INTEGER;
BEGIN
  -- Get the current value
  SELECT tickets_remaining INTO current_value FROM events WHERE id = row_id;
  
  -- Calculate the new value
  new_value := GREATEST(0, current_value - amount);
  
  -- Update the tickets_remaining column
  UPDATE events 
  SET 
    tickets_remaining = new_value,
    sold_out = CASE WHEN new_value <= 0 THEN TRUE ELSE FALSE END
  WHERE id = row_id;
  
  -- Return the new value
  RETURN new_value;
END;
$$ LANGUAGE plpgsql;

-- Add RLS (Row Level Security) policies

-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
CREATE POLICY "Public can view events" ON events
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert events" ON events
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update events" ON events
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete events" ON events
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
CREATE POLICY "Authenticated users can view all orders" ON orders
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert orders" ON orders
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" ON orders
  FOR UPDATE
  USING (auth.role() = 'authenticated');
