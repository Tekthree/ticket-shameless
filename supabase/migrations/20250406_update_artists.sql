-- Add bio and mix_url fields to artists table
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS mix_url TEXT;
