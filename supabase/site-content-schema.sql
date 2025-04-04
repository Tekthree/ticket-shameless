-- Create a site_content table to store configurable content
CREATE TABLE site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section VARCHAR NOT NULL, -- e.g., 'hero', 'about', 'motto'
  field VARCHAR NOT NULL, -- e.g., 'title', 'description', 'image', 'video'
  content TEXT NOT NULL,
  content_type VARCHAR NOT NULL DEFAULT 'text', -- 'text', 'image', 'video'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(section, field)
);

-- Create RLS policies for site_content
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read site content
CREATE POLICY "Allow public read access to site_content" ON site_content
  FOR SELECT USING (true);
  
-- Only allow authenticated users (admins) to modify site content
CREATE POLICY "Allow authenticated users to update site_content" ON site_content
  FOR UPDATE USING (auth.role() = 'authenticated');
  
CREATE POLICY "Allow authenticated users to insert site_content" ON site_content
  FOR INSERT USING (auth.role() = 'authenticated');

-- Seed initial content values
INSERT INTO site_content (section, field, content, content_type) VALUES
  ('hero', 'title', '22 Years Shameless', 'text'),
  ('hero', 'subtitle', 'Keeping It Weird Since 2003', 'text'),
  ('hero', 'background', '/images/logo.png', 'image'),
  ('hero', 'video', '', 'video'),
  ('about', 'title', 'Keeping It Weird Since 2003', 'text'),
  ('about', 'description', 'In 2003, Shameless first took shape as a weekly indie dance night in the basement of the Alibi Room located in Seattle''s historic Pike Place Market. The ensemble quickly became one of the city''s most respected underground dance music collectives by throwing numerous legendary club nights, open air and after parties.', 'text'),
  ('about', 'image', '/images/logo.png', 'image'),
  ('motto', 'title', 'Shake Your Shame Off And Get Your Game On.', 'text'),
  ('motto', 'description', 'From day one, each Shameless party was a special one regardless of the wide ranges of genres and bookings represented. With an eye towards the cutting edge, but deep respect for electronic music''s rich history, Shameless has kept its finger on the pulse of Seattle''s underground for years now and yet keeps looking forward.', 'text'),
  ('motto', 'image', '/images/logo.png', 'image');
