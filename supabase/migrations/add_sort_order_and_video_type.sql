-- Add sort_order column to site_content table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'site_content'
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE site_content
        ADD COLUMN sort_order INTEGER;
        
        -- Initialize sort_order values based on created_at timestamps
        WITH indexed_rows AS (
            SELECT 
                id, 
                section,
                ROW_NUMBER() OVER(PARTITION BY section ORDER BY created_at) as row_num
            FROM site_content
        )
        UPDATE site_content sc
        SET sort_order = ir.row_num
        FROM indexed_rows ir
        WHERE sc.id = ir.id;
    END IF;
END
$$;

-- Add appropriate content_type values for videos
UPDATE site_content
SET content_type = 'video'
WHERE field = 'video_background' OR field LIKE '%video%';

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_site_content_section_sort ON site_content(section, sort_order);

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: sort_order column added and video types updated';
END
$$;
