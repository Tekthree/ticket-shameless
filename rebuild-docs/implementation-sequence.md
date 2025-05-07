# Implementation Sequence Guide

This document outlines the recommended implementation sequence for rebuilding the Ticket Shameless application, ensuring that component dependencies are respected and integration points are properly handled.

## Component Dependency Order

When rebuilding the application, components should be implemented in the following order to ensure dependencies are satisfied:

```
1. Authentication System
   ↓
2. Storage System
   ↓
3. User Management System
   ↓
4. CMS System
   ↓
5. Email Marketing System
   ↓
6. Ticket System (Guest & Auth)
```

## Detailed Implementation Steps

### 1. Authentication System

**Implementation Priority: HIGH**

1. Set up Supabase Auth with secure helpers
2. Implement Google OAuth integration
3. Create role-based access control
4. Implement secure authentication helpers (`getAuthenticatedUser()`)

**Key Integration Points:**
- Ensure all components use `getAuthenticatedUser()` instead of `getSession()`
- Set up proper role assignments for new users

### 2. Storage System

**Implementation Priority: HIGH**

1. Create Supabase Storage buckets and folder structure
2. Implement RLS policies for secure access
3. Create core upload/retrieval functions
4. Implement file management utilities

**Key Integration Points:**
- Ensure authentication is required for all write operations
- Implement role-based access for admin operations
- Create functions that will be used by CMS and user management

### 3. User Management System

**Implementation Priority: HIGH**

1. Implement user profile database tables
2. Create profile management components
3. Integrate with Storage for avatar management
4. Implement role management

**Key Integration Points:**
- Use Storage functions for avatar uploads
- Ensure proper role verification for admin actions
- Integrate with Authentication for user identification

### 4. CMS System

**Implementation Priority: MEDIUM**

1. Create site_content database table
2. Implement admin interface for content management
3. Create content retrieval functions for public pages
4. Integrate with Storage for media management

**Key Integration Points:**
- Use Storage functions for media uploads
- Implement media cleanup procedures
- Ensure proper role verification for content updates

### 5. Email Marketing System

**Implementation Priority: MEDIUM**

1. Create email_marketing database table
2. Implement email collection points
3. Create notification templates
4. Set up email delivery service

**Key Integration Points:**
- Integrate with Authentication for user emails
- Implement in Guest Checkout flow
- Use Storage for email template images

### 6. Ticket System

**Implementation Priority: HIGH**

1. Implement ticket database tables
2. Create purchase flow (authenticated and guest)
3. Implement ticket generation and delivery
4. Create ticket history and management

**Key Integration Points:**
- Integrate with Email Marketing for notifications
- Use Storage for ticket QR codes and images
- Implement secure checkout with proper authentication

## Integration Testing Checklist

After implementing each component, verify the following integration points:

### Authentication Integration Tests

- [ ] Verify `getAuthenticatedUser()` is used consistently
- [ ] Test Google OAuth sign-in and profile creation
- [ ] Verify role-based access control for admin features

### Storage Integration Tests

- [ ] Test user avatar uploads and retrieval
- [ ] Verify CMS media uploads and URL generation
- [ ] Test role-based access to storage operations

### CMS Integration Tests

- [ ] Verify media uploads through the admin interface
- [ ] Test content retrieval on public pages
- [ ] Verify media cleanup functionality

### Email Marketing Integration Tests

- [ ] Test email collection during registration
- [ ] Verify guest checkout email collection
- [ ] Test notification delivery with proper templates

### Ticket System Integration Tests

- [ ] Test complete purchase flow for authenticated users
- [ ] Verify guest checkout process
- [ ] Test ticket delivery via email
- [ ] Verify ticket history display

## Environment Variables

Ensure the following environment variables are configured for all components to work together:

```
# Authentication
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Service
EMAIL_SERVICE_API_KEY=your-email-service-key
EMAIL_FROM_ADDRESS=noreply@ticketshameless.com
EMAIL_REPLY_TO=support@ticketshameless.com

# Storage
NEXT_PUBLIC_STORAGE_URL=your-storage-url

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-publishable-key
STRIPE_SECRET_KEY=your-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

## Function Naming Conventions

To ensure consistency across all components, adhere to these naming conventions:

1. **Authentication Functions**
   - `getAuthenticatedUser()` - Get the current authenticated user
   - `isAuthenticated()` - Check if a user is authenticated
   - `hasRole(userId, roleName)` - Check if a user has a specific role

2. **Storage Functions**
   - `upload[EntityType](file, ...)` - Upload a file for a specific entity
   - `get[EntityType](id)` - Get a file for a specific entity
   - `delete[EntityType](id)` - Delete a file for a specific entity

3. **CMS Functions**
   - `get[ContentType](section, field)` - Get content for a specific section
   - `update[ContentType](section, field, content)` - Update content
   - `delete[ContentType](section, field)` - Delete content

4. **Email Functions**
   - `send[EmailType]Email(to, data)` - Send a specific type of email
   - `addToEmailList(email, source)` - Add email to marketing list
   - `unsubscribe(token)` - Process unsubscribe request

By following this implementation sequence and adhering to the integration points, you'll ensure a smooth rebuild process with proper component dependencies and consistent functionality.
