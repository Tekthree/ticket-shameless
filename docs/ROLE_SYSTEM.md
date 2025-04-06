# Shameless Productions Role-Based Authentication System

This document provides an overview of the role-based authentication system implemented for the Shameless Productions ticketing platform.

## Role System Overview

The system defines several user roles with different permissions:

1. **Admin** - Full system access for Shameless Productions staff
2. **Event Manager** - Can create and manage events, view sales data
3. **Box Office** - Can process tickets, check-ins, and handle customer issues
4. **Artist** - Can view performance details and schedules
5. **Guest List Manager** - Can add people to guest lists for specific events
6. **Customer** - Regular users who purchase tickets

## Implementation

### Database Setup

1. Run the SQL script `supabase/role-system-implementation.sql` to set up the necessary database tables and functions:
   - Role definitions
   - User-role mappings
   - Guest list functionality
   - Row-level security policies

```bash
# Connect to your Supabase project via the SQL Editor
# Copy and paste the contents of role-system-implementation.sql
# Run the script
```

### Troubleshooting Login Issues

If you encounter the "Database error saving new user" issue:

1. Run the `supabase/diagnostic.sql` script to diagnose any database problems
2. The error is typically caused by trigger failures when creating new users
3. The `role-system-implementation.sql` script includes fixes for these issues by:
   - Replacing problematic triggers with more robust versions
   - Adding error handling to prevent failures during user creation
   - Ensuring proper role assignment for new users

### Frontend Components

The role system includes several frontend components:

#### 1. User Role Hook

The `useUserRoles` hook (`hooks/useUserRoles.ts`) provides role information and helper methods:

```typescript
const { 
  roles,               // Array of role names 
  primaryRole,         // Primary role name
  isLoading,           // Loading state
  hasRole,             // Check if user has specific role
  isAdmin,             // Check if user is admin
  isEventManager,      // Check if user is event manager
  // etc.
} = useUserRoles();
```

#### 2. Role Protection Component

The `RoleProtected` component (`components/auth/RoleProtected.tsx`) conditionally renders content based on user roles:

```jsx
<RoleProtected 
  allowedRoles={['admin', 'event_manager']} 
  fallback={<UnauthorizedPage />}
>
  {/* Protected content here */}
</RoleProtected>
```

#### 3. Enhanced Authentication

The `EnhancedAuth` component (`components/auth/EnhancedAuth.tsx`) handles login with role-based redirection.

#### 4. Role Management

The `RoleManagement` component (`components/admin/RoleManagement.tsx`) allows administrators to assign and manage user roles.

#### 5. Guest List Management

The platform includes guest list management for events:
- Artists can add people to guest lists (`components/events/GuestListManager.tsx`)
- Event managers can assign guest list permissions to artists (`components/events/EventArtistManager.tsx`)

### Middleware

The updated middleware (`middleware.ts`) enforces role-based access control:
- Redirects unauthenticated users to login
- Redirects authenticated users to appropriate dashboards based on roles
- Restricts access to sections based on user roles

## Usage

### Adding the Enhanced Login Page

Add a link to the enhanced login page in your navigation:

```jsx
<Link href="/auth/enhanced-login">Sign In</Link>
```

### Role-Based UI Elements

Use the `useUserRoles` hook to conditionally render UI elements:

```jsx
const { isAdmin, isEventManager } = useUserRoles();

// Later in your component:
{(isAdmin() || isEventManager()) && (
  <button className="btn">Create Event</button>
)}
```

### Protecting Routes

In addition to middleware protection, use the `RoleProtected` component:

```jsx
export default function AdminEventPage() {
  return (
    <RoleProtected 
      allowedRoles={['admin', 'event_manager']} 
      fallback={<UnauthorizedPage />}
    >
      {/* Admin content here */}
    </RoleProtected>
  );
}
```

### Managing Guest Lists

Add the guest list components to your event pages:

```jsx
// For event managers/admins
<EventArtistManager eventId={event.id} />

// For artists/managers
<GuestListManager eventId={event.id} />
```

## Troubleshooting

### User Creation Issues

If you encounter issues with user creation:

1. Check the Supabase logs for specific error messages
2. Run the diagnostic script to identify trigger problems
3. Verify that the `handle_new_user` function is correctly implemented
4. Check for duplicate email entries in the profiles table

### Role Assignment Issues

If roles aren't being assigned correctly:

1. Verify the `assign_customer_role_to_new_user` trigger is working
2. Check the `user_roles` table for proper entries
3. Ensure RLS policies are correctly configured
4. Verify the `useUserRoles` hook is fetching roles correctly

## Security Considerations

1. Row-Level Security (RLS) policies restrict data access based on user roles
2. Client-side role checks should always be backed by server-side enforcement
3. The middleware provides a secondary layer of route protection
4. The `RoleProtected` component adds UI-level protection

## Next Steps

1. Implement additional role-specific dashboards
2. Add role-based analytics and reporting
3. Enhance guest list features with check-in functionality
4. Implement role-based notifications
