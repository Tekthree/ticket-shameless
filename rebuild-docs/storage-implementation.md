# Supabase Storage Implementation

This document outlines the storage implementation for the Ticket Shameless application using Supabase Storage. It details the bucket structure, access policies, file organization, and integration with other application components.

## Storage Structure

The Supabase Storage is organized into a single public bucket with the following folder structure:

```
public/
├── avatars/        # User profile avatars
├── images/         # Event and general images
├── site-content/   # CMS-managed content
└── videos/         # Video content for hero sections and events
```

### Folder Purposes

1. **avatars/**
   - User profile pictures
   - Default avatars for artists without custom images
   - Naming convention: `user_[user_id].[extension]` or `artist_[artist_id].[extension]`

2. **images/**
   - Event promotional images
   - Artist photos
   - Venue images
   - General marketing images
   - Naming convention: `event_[event_id].[extension]`, `artist_[artist_id].[extension]`, etc.

3. **site-content/**
   - CMS-managed images and media
   - Homepage section content
   - Logo and branding assets
   - Naming convention: `[section]_[field]_[timestamp].[extension]`

4. **videos/**
   - Hero section background videos
   - Event promotional videos
   - Artist performance clips
   - Naming convention: `hero_[timestamp].[extension]`, `event_[event_id].[extension]`, etc.

## Storage Access Policies

### Public Bucket Policies

The `public` bucket has the following Row Level Security (RLS) policies:

```sql
-- Allow public read access to all files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public');

-- Allow authenticated uploads for all users
CREATE POLICY "Authenticated Users Can Upload"
ON storage.objects FOR INSERT
TO authenticated
USING (bucket_id = 'public');

-- Allow users to update their own avatar files
CREATE POLICY "Users Can Update Own Avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.filename(name)) LIKE 'user_' || auth.uid() || '%'
);

-- Allow admin users to update any files
CREATE POLICY "Admins Can Update Any Files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- Allow admin users to delete files
CREATE POLICY "Admins Can Delete Files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);
```

## File Management Implementation

### Upload Functions

```typescript
// lib/storage/upload.ts
import { createClient } from '@/lib/supabase/client';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// Upload user avatar
export async function uploadAvatar(file: File) {
  const supabase = createClient();
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `user_${user.id}.${fileExt}`;
  const filePath = `avatars/${fileName}`;
  
  const { error } = await supabase.storage.from('public').upload(filePath, file, {
    upsert: true,
    contentType: file.type,
  });
  
  if (error) {
    throw new Error('Error uploading avatar: ' + error.message);
  }
  
  const { data } = supabase.storage.from('public').getPublicUrl(filePath);
  
  // Update user profile with new avatar URL
  await supabase
    .from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', user.id);
  
  return data.publicUrl;
}

// Upload event image
export async function uploadEventImage(file: File, eventId: string) {
  const supabase = createClient();
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `event_${eventId}.${fileExt}`;
  const filePath = `images/${fileName}`;
  
  const { error } = await supabase.storage.from('public').upload(filePath, file, {
    upsert: true,
    contentType: file.type,
  });
  
  if (error) {
    throw new Error('Error uploading event image: ' + error.message);
  }
  
  const { data } = supabase.storage.from('public').getPublicUrl(filePath);
  
  // Update event with new image URL
  await supabase
    .from('events')
    .update({ image: data.publicUrl })
    .eq('id', eventId);
  
  return data.publicUrl;
}

/**
 * Upload site content media for the CMS system
 * 
 * This function is used directly by the CMS implementation in:
 * - app/admin/site-content/page.tsx (handleMediaUpload function)
 * - components/admin/ContentEditor.tsx (handleFileUpload function)
 * 
 * The URL returned by this function is stored in the site_content table
 * in the 'content' field with content_type set to 'image' or 'video'
 */
export async function uploadSiteContent(file: File, section: string, field: string) {
  const supabase = createClient();
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Check if user has admin role
  const { data: rolesData } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);
  
  const isAdmin = rolesData?.some(role => role.roles.name === 'admin');
  
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
  
  const fileExt = file.name.split('.').pop();
  const timestamp = Date.now();
  const fileName = `${section}_${field}_${timestamp}.${fileExt}`;
  const filePath = `site-content/${fileName}`;
  
  const { error } = await supabase.storage.from('public').upload(filePath, file, {
    contentType: file.type,
  });
  
  if (error) {
    throw new Error('Error uploading site content: ' + error.message);
  }
  
  const { data } = supabase.storage.from('public').getPublicUrl(filePath);
  
  // Return values used by the CMS system:
  // - url: Stored in site_content.content field
  // - path: Used for future reference and deletion
  // - originalFilename: Stored in site_content.original_filename field
  return {
    url: data.publicUrl,
    path: filePath,
    originalFilename: file.name,
  };
}
```

### File Retrieval Functions

```typescript
// lib/storage/retrieve.ts
import { createClient } from '@/lib/supabase/client';

// Get file URL by path
export function getFileUrl(path: string) {
  const supabase = createClient();
  const { data } = supabase.storage.from('public').getPublicUrl(path);
  return data.publicUrl;
}

// List files in a folder
export async function listFiles(folder: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from('public').list(folder);
  
  if (error) {
    throw new Error(`Error listing files in ${folder}: ${error.message}`);
  }
  
  return data;
}

// Get signed URL for temporary access (useful for private files if needed)
export async function getSignedUrl(path: string, expiresIn = 60) {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from('public').createSignedUrl(path, expiresIn);
  
  if (error) {
    throw new Error(`Error creating signed URL: ${error.message}`);
  }
  
  return data.signedUrl;
}
```

### File Deletion Functions

```typescript
// lib/storage/delete.ts
import { createClient } from '@/lib/supabase/client';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { hasRole } from '@/lib/supabase/roles';

// Delete file (admin only)
export async function deleteFile(path: string) {
  const supabase = createClient();
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const isAdmin = await hasRole(user.id, 'admin');
  
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
  
  const { error } = await supabase.storage.from('public').remove([path]);
  
  if (error) {
    throw new Error(`Error deleting file: ${error.message}`);
  }
  
  return { success: true };
}

// Delete user avatar (user can delete their own)
export async function deleteAvatar() {
  const supabase = createClient();
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Get current avatar path
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single();
  
  if (!profile?.avatar_url) {
    return { success: true }; // No avatar to delete
  }
  
  // Extract path from URL
  const urlParts = profile.avatar_url.split('public/');
  if (urlParts.length < 2) {
    throw new Error('Invalid avatar URL format');
  }
  
  const path = urlParts[1];
  
  // Delete the file
  const { error } = await supabase.storage.from('public').remove([path]);
  
  if (error) {
    throw new Error(`Error deleting avatar: ${error.message}`);
  }
  
  // Update profile
  await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id);
  
  return { success: true };
}
```

## Integration with Application Components

### CMS Integration

The CMS system uses the storage for managing site content media. This integration is critical for the homepage and event pages that display dynamic content managed through the admin interface.

#### Storage Functions Used by CMS

```typescript
// In CMS components (ContentEditor.tsx, MediaUploader.tsx)
import { 
  uploadSiteContent, 
  deleteSiteContent, 
  listSiteContent,
  cleanupUnusedSiteContent 
} from '@/lib/storage';

// Example of CMS component using storage functions
export function MediaUploader({ section, field, onUploadComplete }) {
  const handleUpload = async (file) => {
    try {
      // Call storage function to upload media
      const result = await uploadSiteContent(file, section, field);
      
      // Update database with new URL
      await updateContentInDatabase(section, field, result.url, 
        file.type.startsWith('image/') ? 'image' : 'video',
        result.originalFilename);
      
      onUploadComplete(result.url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  return (
    <div>
      {/* File upload UI */}
    </div>
  );
}
```

#### Media Cleanup Integration

```typescript
// In admin maintenance component
export function MediaMaintenance() {
  const [status, setStatus] = useState('');
  
  const handleCleanup = async () => {
    setStatus('Cleaning up unused media...');
    
    try {
      // Get all content items with image/video type
      const { data: contentItems } = await supabase
        .from('site_content')
        .select('content, content_type')
        .in('content_type', ['image', 'video']);
      
      // Get all files in site-content folder
      const { files } = await listSiteContent();
      
      // Find and remove unused files
      const result = await cleanupUnusedSiteContent(contentItems, files);
      
      setStatus(`Cleanup complete. Removed ${result.deletedCount} unused files.`);
    } catch (error) {
      setStatus(`Cleanup failed: ${error.message}`);
    }
  };
  
  return (
    <div>
      <h2>Media Maintenance</h2>
      <button onClick={handleCleanup}>Clean Up Unused Media</button>
      <p>{status}</p>
    </div>
  );
}
```

#### Database to Storage Mapping

The CMS system stores media references in the `site_content` table with the following mapping:

| Database Field | Storage Relation |
|----------------|------------------|
| `content` | Contains the public URL returned by `uploadSiteContent` |
| `content_type` | Set to 'image' or 'video' based on uploaded file type |
| `is_uploaded` | Set to `true` for content managed through storage |
| `original_filename` | Stores the original filename from `uploadSiteContent` |

This mapping ensures proper tracking of media assets and enables cleanup of unused files.
// In site-content.ts
export async function updateSiteContent(
  section: string,
  field: string,
  content: string | File,
  content_type: string = 'text'
) {
  const supabase = createClient();
  
  // If content is a file, upload it first
  let finalContent = content;
  let is_uploaded = false;
  let original_filename = null;
  
  if (content instanceof File && (content_type === 'image' || content_type === 'video')) {
    const result = await uploadSiteContent(content, section, field);
    finalContent = result.url;
    is_uploaded = true;
    original_filename = result.originalFilename;
  }
  
  // Update site_content table
  const { data, error } = await supabase
    .from('site_content')
    .upsert({
      section,
      field,
      content: finalContent as string,
      content_type,
      is_uploaded,
      original_filename,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'section,field'
    })
    .select();
  
  if (error) {
    throw new Error('Failed to update site content: ' + error.message);
  }
  
  return data;
}
```

### User Profile Integration

User profiles use the storage for avatar images:

```typescript
// In profile.ts
export async function updateProfile(data: ProfileUpdateData) {
  const { name, avatar } = data;
  const supabase = createClient();
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // If avatar is provided as a file, upload it
  let avatarUrl = null;
  if (avatar instanceof File) {
    avatarUrl = await uploadAvatar(avatar);
  }
  
  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: name,
      avatar_url: avatarUrl || undefined, // Only update if new avatar was uploaded
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);
  
  if (error) {
    throw new Error('Error updating profile: ' + error.message);
  }
  
  return { success: true };
}
```

### Event Management Integration

Event management uses the storage for event images:

```typescript
// In events.ts
export async function createEvent(eventData: EventData) {
  const { title, description, date, venue, price, tickets_total, image } = eventData;
  const supabase = createClient();
  
  // Generate slug from title
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  
  // Create event first to get ID
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      title,
      slug,
      description,
      date,
      venue,
      price,
      tickets_total,
      tickets_remaining: tickets_total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    throw new Error('Error creating event: ' + error.message);
  }
  
  // If image is provided, upload it
  if (image instanceof File) {
    await uploadEventImage(image, event.id);
  }
  
  return event;
}
```

## Storage Optimization

### Image Optimization

To optimize storage usage and performance, the application implements:

1. **Image Resizing**:
   - Avatar images are resized to 200x200px
   - Event thumbnails are resized to 600x400px
   - Event full images are resized to 1200x800px

2. **Format Conversion**:
   - Convert images to WebP format when possible
   - Fall back to JPEG for wider compatibility

```typescript
// lib/storage/optimize.ts
import sharp from 'sharp';

export async function optimizeImage(file: File, options: {
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg';
  quality?: number;
}) {
  const { width, height, format = 'webp', quality = 80 } = options;
  
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Process with sharp
  let sharpInstance = sharp(buffer);
  
  // Resize if dimensions provided
  if (width || height) {
    sharpInstance = sharpInstance.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }
  
  // Convert format
  if (format === 'webp') {
    sharpInstance = sharpInstance.webp({ quality });
  } else {
    sharpInstance = sharpInstance.jpeg({ quality });
  }
  
  // Get output buffer
  const outputBuffer = await sharpInstance.toBuffer();
  
  // Create new file
  const optimizedFile = new File(
    [outputBuffer],
    `${file.name.split('.')[0]}.${format}`,
    { type: format === 'webp' ? 'image/webp' : 'image/jpeg' }
  );
  
  return optimizedFile;
}
```

### Video Optimization

For video content:

1. **Compression**:
   - Videos are compressed to reduce file size
   - Multiple resolutions are generated for adaptive streaming

2. **Streaming Optimization**:
   - Videos are segmented for HLS streaming
   - Thumbnails are generated at regular intervals

## Storage Monitoring and Maintenance

### Usage Monitoring

```typescript
// lib/storage/monitoring.ts
import { createClient } from '@/lib/supabase/client';
import { hasRole } from '@/lib/supabase/roles';

// Get storage usage statistics (admin only)
export async function getStorageStats() {
  const supabase = createClient();
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const isAdmin = await hasRole(user.id, 'admin');
  
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
  
  // Get usage by folder
  const folders = ['avatars', 'images', 'site-content', 'videos'];
  const stats = {};
  
  for (const folder of folders) {
    const { data } = await supabase.storage.from('public').list(folder);
    
    if (data) {
      stats[folder] = {
        fileCount: data.length,
        totalSize: data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
      };
    }
  }
  
  return stats;
}
```

### Cleanup Routines

```typescript
// lib/storage/cleanup.ts
import { createClient } from '@/lib/supabase/client';
import { hasRole } from '@/lib/supabase/roles';

// Clean up unused files (admin only)
export async function cleanupUnusedFiles() {
  const supabase = createClient();
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const isAdmin = await hasRole(user.id, 'admin');
  
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
  
  // Get all site content records
  const { data: siteContent } = await supabase
    .from('site_content')
    .select('content, is_uploaded')
    .eq('is_uploaded', true);
  
  // Get all files in site-content folder
  const { data: files } = await supabase.storage.from('public').list('site-content');
  
  if (!files) return { success: true, deletedCount: 0 };
  
  // Find files that aren't referenced in site_content
  const usedPaths = siteContent?.map(item => {
    const url = item.content;
    const parts = url.split('public/');
    return parts.length > 1 ? parts[1] : null;
  }).filter(Boolean) || [];
  
  const unusedFiles = files.filter(file => {
    const filePath = `site-content/${file.name}`;
    return !usedPaths.includes(filePath);
  });
  
  // Delete unused files
  if (unusedFiles.length > 0) {
    const pathsToDelete = unusedFiles.map(file => `site-content/${file.name}`);
    await supabase.storage.from('public').remove(pathsToDelete);
  }
  
  return { success: true, deletedCount: unusedFiles.length };
}
```

## Rebuild Implementation Guide

When rebuilding the storage system, follow these steps:

1. **Create Storage Buckets**:
   - Create the `public` bucket in Supabase
   - Set up the folder structure (avatars, images, site-content, videos)

2. **Configure Access Policies**:
   - Implement the RLS policies for public read access
   - Set up policies for authenticated uploads
   - Configure role-based policies for updates and deletions

3. **Implement Core Functions**:
   - Create upload functions for different content types
   - Implement file retrieval functions
   - Build file deletion and management functions

4. **Integrate with Components**:
   - Connect storage functions to CMS system
   - Integrate with user profile management
   - Link to event management system
   - Set up email marketing image storage

5. **Implement Optimization**:
   - Add image resizing and format conversion
   - Set up video compression if needed
   - Implement caching strategies

6. **Add Monitoring and Maintenance**:
   - Create usage monitoring functions
   - Implement cleanup routines for unused files
   - Set up backup procedures

7. **Testing**:
   - Test file uploads across all content types
   - Verify access control policies
   - Test integration with other components
   - Validate optimization functions

By following this implementation guide, you'll create a robust storage system that integrates seamlessly with all other components of the Ticket Shameless application.