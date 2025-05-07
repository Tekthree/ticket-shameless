# CMS Implementation for Homepage Content Management

This document provides a comprehensive breakdown of the Content Management System (CMS) implementation for the Ticket Shameless application, focusing on the admin interface for updating homepage content.

## Database Structure

### Site Content Table

The site content is stored in a `site_content` table with the following structure:

```sql
CREATE TABLE site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section TEXT NOT NULL,           -- Section of the page (e.g., 'hero', 'about')
  field TEXT NOT NULL,             -- Field within the section (e.g., 'title', 'subtitle')
  content TEXT,                    -- The actual content (text, URL, or storage path)
  content_type TEXT DEFAULT 'text', -- Type of content ('text', 'image', 'video')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_uploaded BOOLEAN DEFAULT FALSE, -- True if content is an uploaded file
  original_filename TEXT,           -- Original filename for uploaded content
  sort_order INTEGER                -- Order within section for display
);

-- Indexes for performance
CREATE INDEX idx_site_content_content_type ON site_content(content_type);
CREATE INDEX idx_site_content_section_sort ON site_content(section, sort_order);
```

### Content Organization

Content is organized by:
1. **Section**: Represents a section of the homepage (hero, about, motto)
2. **Field**: Specific content field within a section (title, subtitle, description, image)
3. **Content Type**: The type of content (text, image, video)
4. **Sort Order**: The display order within a section

## Admin Interface

The admin interface for managing site content is implemented in `app/admin/site-content/page.tsx`. It provides a user-friendly interface for:

1. Viewing all content organized by section
2. Editing text content with a textarea
3. Uploading or specifying URLs for images and videos
4. Reordering content within sections

### Key Components

#### Site Content Page

The main admin page (`app/admin/site-content/page.tsx`) includes:

- Section-based organization of content
- Edit/Save/Cancel functionality for each content item
- Content type-specific editing interfaces
- Reordering capabilities (move up/down)
- Role-based access control

#### Media Upload Component

The `MediaUpload` component (`components/ui/media-upload.tsx`) provides:

- Tab-based interface for URL input or file upload
- File type validation
- Upload progress indication
- Preview functionality for images and videos
- Integration with Supabase Storage

## Data Flow

### Content Retrieval

1. **Server-Side Fetching**:
   ```typescript
   // lib/site-content.ts
   export async function getSiteContentServer() {
     try {
       return await fetchSiteContent();
     } catch (error) {
       console.error("Error fetching site content:", error);
       return null;
     }
   }
   ```

2. **Data Organization**:
   ```typescript
   // lib/supabase/server-actions.ts
   const organizedContent = (data || []).reduce((acc: Record<string, any>, item: any) => {
     if (!acc[item.section]) {
       acc[item.section] = {};
     }
     acc[item.section][item.field] = {
       content: item.content,
       type: item.content_type,
       id: item.id
     };
     return acc;
   }, {});
   ```

### Content Updates

1. **Edit Workflow**:
   - User clicks "Edit" on a content item
   - Edit interface is displayed based on content type
   - User makes changes and clicks "Save"
   - Content is validated and saved to the database

2. **Update Process**:
   ```typescript
   const { data, error } = await supabase
     .from('site_content')
     .update({
       content: finalContent,
       updated_at: new Date().toISOString()
     })
     .eq('id', editingItem.id)
     .select();
   ```

3. **Media Handling**:
   - Images and videos can be uploaded to Supabase Storage
   - Public URLs are generated and stored in the database
   - Content is previewed before saving

## Security Implementation

The CMS system has been updated to use secure authentication methods:

1. **Secure User Authentication**:
   ```typescript
   // Get authenticated user securely
   const user = await getAuthenticatedUser();
   
   if (!user) {
     setError('You need to be logged in');
     return;
   }
   ```

2. **Role-Based Access Control**:
   ```typescript
   async function fetchUserRoles() {
     try {
       // Get authenticated user securely
       const user = await getAuthenticatedUser();
       
       if (!user) return;
       
       // Fetch user roles from the database
       const { data: rolesData, error: rolesError } = await supabase
         .from('user_roles')
         .select('roles(name)')
         .eq('user_id', user.id);
         
       // Process roles...
     } catch (e) {
       console.error('Error in fetchUserRoles:', e);
     }
   }
   ```

3. **Server-Side Validation**:
   - All content updates are validated on the server
   - Role checks are performed before allowing content updates
   - Content type validation ensures proper data format

4. **Secure Authentication Helpers**:
   ```typescript
   // lib/supabase/auth.ts
   
   // Secure method to get authenticated user
   // This contacts the Supabase Auth server to validate the token
   export async function getAuthenticatedUser() {
     const supabase = createClient();
     const { data: { user }, error } = await supabase.auth.getUser();
     
     if (error) {
       console.error('Error getting authenticated user:', error);
       return null;
     }
     
     return user;
   }
   
   // Check if user is authenticated
   export async function isAuthenticated() {
     const user = await getAuthenticatedUser();
     return !!user;
   }
   ```

5. **Protected API Routes**:
   ```typescript
   // app/api/site-content/route.ts
   import { NextResponse } from 'next/server';
   import { getAuthenticatedUser } from '@/lib/supabase/auth';
   import { hasRole } from '@/lib/supabase/roles';
   
   export async function PUT(request: Request) {
     // Verify authentication
     const user = await getAuthenticatedUser();
     
     if (!user) {
       return NextResponse.json(
         { error: 'Unauthorized' },
         { status: 401 }
       );
     }
     
     // Check if user has admin role
     const isAdmin = await hasRole(user.id, 'admin');
     
     if (!isAdmin) {
       return NextResponse.json(
         { error: 'Forbidden: Admin access required' },
         { status: 403 }
       );
     }
     
     // Process the content update
     // ...
   }
   ```

## Homepage Content Integration

The homepage (`app/page.tsx`) integrates the CMS content:

1. **Content Fetching**:
   ```typescript
   // Try to get site content, but provide fallbacks if it fails
   let content = null;
   try {
     content = await getSiteContentServer();
   } catch (error) {
     console.error('Error loading site content:', error);
     // Will use fallbacks below
   }
   ```

2. **Content Usage with Fallbacks**:
   ```typescript
   // Extract content with fallbacks
   const heroTitle = content?.hero?.title?.content || '22 Years Shameless'
   const heroSubtitle = content?.hero?.subtitle?.content || 'Keeping It Weird Since 2003'
   const heroBackground = content?.hero?.background?.content || '/images/logo.png'
   const heroVideo = content?.hero?.video?.content || ''
   ```

3. **Dynamic Content Rendering**:
   ```jsx
   <h1 className="text-8xl md:text-[10rem] mb-6 font-qikober">
     {heroTitle}
   </h1>
   <p className="text-xl md:text-2xl mb-12">
     {heroSubtitle}
   </p>
   ```

## Homepage Content Mapping

The CMS manages the following content elements for the homepage, directly mapping to the design specifications in `homepage-events-design.md`:

| CMS Section | CMS Field    | Homepage Element       | Content Type | Design Specification                        |
|-------------|-------------|------------------------|--------------|--------------------------------------------|
| hero        | title       | Hero Title             | text         | Font size 10rem (desktop) / 8rem (mobile) |
| hero        | subtitle    | Hero Subtitle          | text         | Font size 2rem (desktop) / 1.5rem (mobile)|
| hero        | background  | Hero Background        | image        | Image with 70% opacity if no video        |
| hero        | video       | Hero Video             | video        | Full-screen video background              |
| hero        | cta_text    | Hero CTA Button Text   | text         | Red button with white text                |
| hero        | cta_link    | Hero CTA Button Link   | text         | Internal or external URL                  |
| about       | title       | About Section Title    | text         | Font size 2.5rem, bold                    |
| about       | content     | About Section Content  | text         | Font size 1.125rem                        |
| about       | image       | About Section Image    | image        | Rounded corners (0.5rem)                  |
| events      | title       | Events Section Title   | text         | Font size 2.5rem, center-aligned          |
| events      | subtitle    | Events Section Subtitle| text         | Descriptive text below title              |
| motto       | title       | Motto Section Title    | text         | Font size 2.5rem, bold                    |
| motto       | content     | Motto Section Content  | text         | Font size 1.125rem                        |
| motto       | image       | Motto Section Image    | image        | Rounded corners (0.5rem)                  |

This mapping ensures that the CMS content directly corresponds to the design elements specified in the homepage design document, maintaining consistency between content management and frontend implementation.

## Content Types and Handling

### Text Content
- Stored directly in the database
- Edited with a textarea component
- Can include basic formatting (paragraphs, line breaks)
- Rendered with appropriate HTML formatting

### Image Content
- Can be uploaded to Supabase Storage or referenced by URL
- Previewed before saving
- Stored as a URL in the database
- Rendered with Next.js Image component for optimization

### Video Content
- Can be uploaded to Supabase Storage or referenced by URL
- Previewed with HTML5 video element
- Used for hero background on homepage
- Dynamically loaded with the VideoBackground component

### Media Upload

For image and video content, the CMS provides two options:

1. **URL Input**: Enter a URL directly
2. **File Upload**: Upload a file to Supabase Storage

```typescript
const handleFileUpload = async (file: File, section: string, field: string) => {
  // Get authenticated user for secure operations
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  // Call the storage system's uploadSiteContent function
  const { url, error } = await uploadSiteContent(file, section, field);
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  
  // Update the content with the URL
  return url;
};
```

**Integration with Storage System:**

The CMS uses the following storage functions from the storage implementation:

```typescript
// From storage-implementation.md
import { uploadSiteContent, deleteSiteContent, listSiteContent } from '@/lib/storage';

// Example usage in CMS component
const handleMediaUpload = async (file: File, section: string, field: string) => {
  const result = await uploadSiteContent(file, section, field);
  
  // Update database with new media URL
  await updateContentField(section, field, result.url, 'image');
  
  return result.url;
};

// Example of cleanup unused media
const cleanupUnusedMedia = async () => {
  // Get all content items with image/video type
  const { data: contentItems } = await supabase
    .from('site_content')
    .select('content, content_type')
    .in('content_type', ['image', 'video']);
  
  // Get all files in site-content folder
  const { files } = await listSiteContent();
  
  // Find and remove unused files
  await cleanupUnusedSiteContent(contentItems, files);
};

## Reordering Functionality

The CMS includes functionality to reorder content within sections:

1. **Move Item Up**:
   ```typescript
   const moveItemUp = async (item: any, sectionItems: any[]) => {
     // Find current index of the item in the section
     const currentIndex = sectionItems.findIndex(i => i.id === item.id);
     
     if (currentIndex <= 0) return; // Already at the top
     
     // Get the item before this one
     const prevItem = sectionItems[currentIndex - 1];
     
     // Swap sort_order values
     const temp = prevItem.sort_order;
     
     // Update database...
   };
   ```

2. **Move Item Down**:
   ```typescript
   const moveItemDown = async (item: any, sectionItems: any[]) => {
     // Find current index of the item in the section
     const currentIndex = sectionItems.findIndex(i => i.id === item.id);
     
     if (currentIndex >= sectionItems.length - 1) return; // Already at the bottom
     
     // Get the item after this one
     const nextItem = sectionItems[currentIndex + 1];
     
     // Swap sort_order values
     const temp = nextItem.sort_order;
     
     // Update database...
   };
   ```

3. **Sort Order Initialization**:
   ```typescript
   const ensureSortOrder = async () => {
     // This function ensures all items have a sort_order value
     // If any items are missing sort_order, we'll assign incremental values
     // ...
   };
   ```

## Error Handling

The CMS implements comprehensive error handling:

1. **User Feedback**:
   - Toast notifications for success/error states
   - Validation error messages
   - Loading states with visual indicators

2. **Error Recovery**:
   - Fallback content for the homepage
   - Graceful degradation when content cannot be loaded
   - Console logging for debugging

3. **Input Validation**:
   ```typescript
   const validateContent = (content: string, contentType: string) => {
     // Basic validation for different content types
     if (!content || content.trim() === '') {
       return 'Content cannot be empty';
     }
     
     if (contentType === 'image') {
       try {
         // Try to create a URL object to validate the URL format
         const url = new URL(content);
         return null; // Valid URL
       } catch (e) {
         return 'Invalid image URL format';
       }
     }
     
     return null; // Default - content is valid
   };
   ```

## Rebuild Implementation Guide

When rebuilding the CMS system, follow these steps:

1. **Database Setup**:
   - Create the site_content table with all required fields
   - Add appropriate indexes for performance
   - Set up initial content for the homepage sections

2. **Storage Integration**:
   - Ensure the Storage system is implemented first (dependency)
   - Import storage functions for media management:
     ```typescript
     import { 
       uploadSiteContent, 
       deleteSiteContent, 
       listSiteContent,
       cleanupUnusedSiteContent 
     } from '@/lib/storage';
     ```
   - Implement media upload UI components that call these storage functions
   - Add periodic cleanup for unused media files

3. **Server-Side Functions**:
   - Implement secure content fetching with error handling
   - Create content organization helpers
   - Implement content update functions with validation
   - Add storage URL processing for media content

4. **Admin Interface**:
   - Create the section-based content management UI
   - Implement edit/save/cancel functionality
   - Add media upload capabilities with storage integration
   - Implement content reordering
   - Add media preview components for uploaded content

5. **Security Enhancements**:
   - Use `getAuthenticatedUser()` instead of `getSession()`
   - Implement proper role-based access control
   - Add server-side validation for all updates
   - Verify storage permissions for media operations

6. **Homepage Integration**:
   - Fetch content with fallbacks
   - Implement dynamic content rendering
   - Handle different content types appropriately
   - Optimize image loading with proper dimensions

7. **Testing**:
   - Test content updates across all types
   - Verify homepage rendering with different content
   - Test error scenarios and fallbacks
   - Verify security with different user roles
   - Test storage integration for media uploads and retrieval
   - Verify cleanup functions for unused media

## Security Considerations

When rebuilding the CMS system, pay special attention to these security aspects:

1. **Authentication**: Always use `getAuthenticatedUser()` instead of `getSession()` to ensure secure authentication.

2. **Authorization**: Implement proper role checks before allowing content updates.

3. **Input Validation**: Validate all content before saving to prevent injection attacks.

4. **Media Uploads**: Implement proper file type validation and size limits.

5. **Error Handling**: Never expose sensitive information in error messages.

6. **Storage Security**: Configure proper access controls for Supabase Storage.

By following these guidelines, you can rebuild a secure and efficient CMS system for the Ticket Shameless application.