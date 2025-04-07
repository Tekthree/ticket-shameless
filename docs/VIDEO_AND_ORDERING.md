# Video Upload and Content Ordering

This document explains the new video upload functionality and content ordering features added to the Ticket Shameless site content management system.

## Video Upload

The site now supports video content in addition to images and text. This is particularly useful for video backgrounds and promotional videos on your site.

### How to Use Video Upload

1. In the admin dashboard, go to "Site Content"
2. Find the content item with type "video" (such as "video_background")
3. Click the "Edit" button next to the content
4. Choose between providing a video URL or uploading a video file
5. For best performance, use .mp4 or .webm formats with reasonable file sizes (less than 50MB)
6. Click "Save" to update the video content

### Technical Details

- Videos are uploaded to Supabase Storage in the `videos` folder
- A unique filename is generated for each uploaded video
- The content editor automatically detects the content type and provides appropriate upload options
- Uploaded videos are streamed directly from Supabase Storage

## Content Ordering

Content items on the site are now displayed in a specific order, which you can control through the admin interface.

### How to Reorder Content

1. In the admin dashboard, go to "Site Content"
2. Each content item has up/down arrow buttons next to its name
3. Click the up arrow to move an item higher in the list (will appear earlier on the page)
4. Click the down arrow to move an item lower in the list (will appear later on the page)
5. The order is saved automatically - no need to click save

### Technical Details

- Content is ordered using a `sort_order` field in the database
- Items are sorted first by section, then by sort_order
- Content with no sort_order value will be assigned one automatically
- Moving items up/down swaps the sort_order values with adjacent items

## Implementation Notes

### Database Changes

A new migration has been added: `add_sort_order_and_video_type.sql`, which:
- Adds a `sort_order` column to the `site_content` table
- Updates content types to use 'video' where appropriate
- Initializes sort_order values based on creation date

### New Components

- `MediaUpload` component replaces the previous `ImageUpload` component
- Added support for different types of media (images, videos)
- Improved UI for content ordering

### Running the Update

To apply these changes to your database:

1. Run the database migration:
```
npm run migrate
```

2. (Optional) Add a video background content item if one doesn't exist:
```
node scripts/add-video-background.js
```

## Troubleshooting

If you encounter issues with video uploads:

1. Check that your Supabase storage is properly configured
2. Ensure video file sizes are reasonable (ideally under 50MB)
3. Check browser console for any error messages
4. Verify that you have the appropriate permissions to write to Supabase storage

For content ordering issues:

1. Run the migration script to ensure the sort_order column exists
2. If order changes aren't saving, check the browser console for error messages
3. Try refreshing the page if the ordering UI becomes unresponsive
