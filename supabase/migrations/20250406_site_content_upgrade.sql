-- Add a new column to track if the content is uploaded or a URL
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS is_uploaded BOOLEAN DEFAULT FALSE;

-- Add a column to store the original filename if uploaded
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Comment on the columns to explain their purpose
COMMENT ON COLUMN site_content.is_uploaded IS 'True if the content is an uploaded file, false if it is a URL';
COMMENT ON COLUMN site_content.original_filename IS 'The original filename if content is an uploaded file';
COMMENT ON COLUMN site_content.content IS 'For uploads: the storage path. For URLs: the full URL. For text: the text content';

-- Update existing image content to mark as not uploaded
UPDATE site_content SET is_uploaded = FALSE WHERE content_type = 'image';

-- Create an index for faster filtering
CREATE INDEX IF NOT EXISTS idx_site_content_content_type ON site_content(content_type);
