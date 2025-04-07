# User Session and Role-Based Access Fixes

This document outlines the fixes implemented to resolve issues with user profile updates and role-based access control.

## Issues Fixed

### 1. User Profile Not Updating After Sign-In

**Problem:**
- User profile card was not updating when a new user signed in
- The profile card continued to display the previous user's information

**Solution:**
- Implemented auth state change listeners in the `useUserProfile` hook
- Added subscriptions to Supabase auth events: 'SIGNED_IN', 'SIGNED_OUT', and 'USER_UPDATED'
- Added proper cleanup of event subscriptions when components unmount
- Used router.refresh() to ensure the UI reloads when auth state changes

### 2. Improper Role-Based Access Control

**Problem:**
- Admin dashboard link was showing for users who should not have access
- Artist users were getting the same admin access as administrative staff

**Solution:**
- Separated user roles more precisely in the UI
- Created distinct states for administrative access and artist access
- Added reactive state updates to ensure permissions update when roles change
- Updated both desktop dropdown and mobile menus to correctly reflect permissions

## Implementation Details

### Auth State Change Listeners

Both the `useUserProfile` and `useUserRoles` hooks now include auth state change listeners:

```typescript
// Set up auth state change listener
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
      fetchUserProfile();
      router.refresh();
    }
  }
);

// Clean up subscription on unmount
return () => {
  subscription.unsubscribe();
};
```

### Reactive Permission States

The UserProfileCard component now uses reactive state for permissions:

```typescript
// Refresh role status with this effect
const [hasAdminAccess, setHasAdminAccess] = useState(false);
const [hasArtistAccess, setHasArtistAccess] = useState(false);

useEffect(() => {
  setHasAdminAccess(isAdmin() || isEventManager() || isBoxOffice());
  setHasArtistAccess(isArtist());
}, [isAdmin, isEventManager, isBoxOffice, isArtist, profile]);
```

### Role-Specific UI Elements

The dropdown menu and mobile navigation now conditionally render different options based on user roles:

```tsx
{hasAdminAccess && (
  <DropdownMenuItem asChild>
    <Link href="/admin" className="cursor-pointer">
      <Icons.settings className="mr-2 h-4 w-4" />
      <span>Admin Dashboard</span>
    </Link>
  </DropdownMenuItem>
)}
{hasArtistAccess && (
  <DropdownMenuItem asChild>
    <Link href="/artist" className="cursor-pointer">
      <Icons.music className="mr-2 h-4 w-4" />
      <span>Artist Portal</span>
    </Link>
  </DropdownMenuItem>
)}
```

## Testing

To verify these fixes are working correctly:

1. Sign in with an admin account - should see Admin Dashboard link
2. Sign out and sign in with a regular user account - should NOT see Admin Dashboard link
3. Sign out and sign in with an artist account - should see Artist Portal but NOT Admin Dashboard
4. Verify the profile card shows the correct user information after each sign-in

## Future Improvements

1. Add role-based caching to reduce database queries
2. Implement more granular permission checks for specific actions
3. Add visual feedback when permissions change
4. Consider adding a permissions provider context to centralize access control
