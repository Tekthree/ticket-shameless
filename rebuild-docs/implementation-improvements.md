# Implementation Improvements for Rebuild

This document outlines specific implementation improvements for the Ticket Shameless rebuild to ensure efficient development with Next.js and Supabase while maintaining manageable task sizes and clear component boundaries.

## Ticket Inventory Management

The current ticket inventory management system in `ticket-inventory-management.md` has several large functions that should be split into smaller, more focused modules:

### Recommended Structure

```
/services/tickets
  /inventoryService.ts       # Core inventory functions (< 250 lines)
  /reservationService.ts     # Reservation management (< 200 lines)
  /salesService.ts           # Sales processing (< 200 lines)
  /auditService.ts           # Audit logging (< 150 lines)
```

### Function Splitting Example

Current `reserveTickets` function (150+ lines) should be split into:

```typescript
// reservationService.ts
export async function createReservation(ticketTypeId, quantity, userId, expirationMinutes = 15) {
  // Create the reservation record only (30-40 lines)
}

export async function updateInventoryForReservation(ticketTypeId, quantity) {
  // Update the inventory counts (30-40 lines)
}

export async function reserveTickets(ticketTypeId, quantity, expirationMinutes = 15) {
  // Orchestration function that calls the above (30-40 lines)
  const user = await getAuthenticatedUser();
  const reservation = await createReservation(ticketTypeId, quantity, user?.id, expirationMinutes);
  await updateInventoryForReservation(ticketTypeId, quantity);
  await logInventoryChange(/*...*/);
  return { success: true, reservation_id: reservation.id };
}
```

## User Roles Implementation

The user roles system in `user-roles-implementation.md` should be implemented with clearer separation of concerns:

### Recommended Structure

```
/features/auth
  /components
    /RoleBasedAccess.tsx     # Component for conditional rendering based on roles
  /hooks
    /useRoles.ts             # Custom hook for role checking
  /services
    /roleService.ts          # Role management functions
  /middleware
    /roleProtection.ts       # Middleware for route protection
```

### Simplified Role Checking

```typescript
// hooks/useRoles.ts
export function useRoles(userId) {
  const { data, error, isLoading } = useSWR(
    userId ? `roles-${userId}` : null,
    async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId);
        
      if (error) throw error;
      return data.map(r => r.roles.name);
    }
  );
  
  return {
    roles: data || [],
    isLoading,
    error,
    hasRole: (role) => data?.includes(role) || false,
    isAdmin: () => data?.includes('admin') || false,
    // Other role checks...
  };
}
```

## CMS Implementation

The CMS implementation in `cms-implementation.md` should be modularized for better maintainability:

### Recommended Structure

```
/features/cms
  /components
    /ContentEditor.tsx       # Rich text editor component (< 200 lines)
    /MediaUploader.tsx       # Media upload component (< 150 lines)
    /ContentPreview.tsx      # Content preview component (< 150 lines)
  /hooks
    /useContent.ts           # Hook for content fetching/updating
  /services
    /contentService.ts       # Content CRUD operations
    /mediaService.ts         # Media handling functions
```

### Simplified Content Management

```typescript
// hooks/useContent.ts
export function useContent(section, field) {
  const { data, error, mutate } = useSWR(
    `content-${section}-${field}`,
    async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('site_content')
        .select('content')
        .eq('section', section)
        .eq('field', field)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      return data?.content || null;
    }
  );
  
  const updateContent = async (newContent) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('site_content')
      .upsert({
        section,
        field,
        content: newContent,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
    mutate(newContent);
  };
  
  return {
    content: data,
    isLoading: !error && !data,
    error,
    updateContent
  };
}
```

## Storage Implementation

The storage implementation in `storage-implementation.md` should be simplified:

### Recommended Structure

```
/features/storage
  /hooks
    /useFileUpload.ts        # Hook for file uploads
    /useFileDownload.ts      # Hook for file downloads
  /components
    /FileUploader.tsx        # File upload component
    /ImageGallery.tsx        # Image gallery component
  /services
    /storageService.ts       # Core storage functions
```

### Simplified File Upload

```typescript
// hooks/useFileUpload.ts
export function useFileUpload(bucket = 'public') {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  const uploadFile = async (file, path) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          onUploadProgress: (event) => {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        
      if (error) throw error;
      
      const { data: urlData } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(data.path);
        
      return urlData.publicUrl;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };
  
  return {
    uploadFile,
    isUploading,
    progress,
    error
  };
}
```

## Email Marketing Implementation

The email marketing system should be modularized:

### Recommended Structure

```
/features/email
  /components
    /EmailSubscriptionForm.tsx  # Subscription form (< 150 lines)
    /EmailPreferences.tsx       # Email preferences component (< 150 lines)
  /services
    /emailService.ts            # Email sending functions (< 200 lines)
    /subscriberService.ts       # Subscriber management (< 200 lines)
  /templates
    /orderConfirmation.tsx      # Email template components
    /eventReminder.tsx
    /marketingEmail.tsx
```

### Simplified Email Sending

```typescript
// services/emailService.ts
export async function sendEmail(templateName, to, data) {
  // Validate inputs
  if (!templateName || !to) {
    throw new Error('Missing required parameters');
  }
  
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template: templateName,
        to,
        data,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
```

## Task Breakdown Recommendations

Break down the implementation into smaller, manageable tasks:

1. **Authentication System** (3-4 days)
   - Set up Supabase Auth (1 day)
   - Implement Google OAuth (1 day)
   - Create role-based access control (1-2 days)

2. **User Management** (2-3 days)
   - User profiles (1 day)
   - Role assignment (1 day)
   - User preferences (1 day)

3. **Storage System** (2-3 days)
   - File upload components (1 day)
   - Storage service (1 day)
   - Media gallery (1 day)

4. **CMS System** (3-4 days)
   - Content editor (1-2 days)
   - Media integration (1 day)
   - Content preview (1 day)

5. **Event Management** (3-4 days)
   - Event creation (1 day)
   - Event listing (1 day)
   - Event details (1-2 days)

6. **Ticket System** (4-5 days)
   - Ticket types (1 day)
   - Inventory management (1-2 days)
   - Checkout process (2 days)

7. **Email Marketing** (2-3 days)
   - Subscription management (1 day)
   - Email templates (1 day)
   - Campaign management (1 day)

By implementing these improvements, the Ticket Shameless rebuild will be more maintainable, with clear component boundaries and manageable task sizes.
