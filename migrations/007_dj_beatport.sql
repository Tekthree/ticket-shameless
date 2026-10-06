-- Optional artist store link, separate from the DJ's own website.
ALTER TABLE djs ADD COLUMN IF NOT EXISTS beatport_url TEXT;
