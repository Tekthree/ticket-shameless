# User Profiles and Ticket History

This document outlines the implementation of user profiles and ticket history for the Shameless Ticket Platform.

## Overview

The user profiles feature allows customers to:
- Create and manage their account information
- View their ticket purchase history
- Access their tickets for events
- Manage notification preferences

## Database Schema

### Profiles Table

We've added a new `profiles` table that connects to the Supabase Auth user system:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone_number TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

This table is automatically populated when a new user signs up using a trigger function.

### Orders Table Modification

We've modified the `orders` table to include a reference to user profiles:

```sql
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
```

This allows for tracking which user made which purchase, enabling ticket history functionality.

## Authentication Flow

1. Users can sign up with email/password
2. Upon signup, a profile is automatically created
3. Users verify their email address via a link
4. Once verified, users can log in to access their profile
5. Password reset functionality is also available

## Page Structure

### Profile Page

The profile page (`/profile`) has two main tabs:
- **Profile Settings**: Allows users to update their personal information, avatar, and notification preferences
- **Ticket History**: Displays all tickets purchased by the user

### Ticket Detail Page

Each ticket has its own detail page (`/tickets/[id]`) that displays:
- Event information
- QR code for entry
- Purchase details
- Option to print the ticket

## Implementation Notes

### Linking Purchases to User Profiles

Ticket purchases are linked to user profiles in two ways:
1. For logged-in users making purchases, the user ID is included in the Stripe checkout metadata
2. For guest purchases, we attempt to link orders to profiles based on matching email addresses

### Secure Access

Several security measures have been implemented:
- Row-Level Security (RLS) policies restrict access to profile data
- Users can only view their own profiles and tickets
- Middleware redirects unauthenticated users to the login page when attempting to access protected routes

### UI Components

The main UI components created for this feature are:
- `ProfileForm.tsx`: Form for updating user profile information
- `TicketHistory.tsx`: Component for displaying ticket purchase history
- Updated `Navbar.tsx`: Navigation now includes login/profile links
- Authentication pages: Login, signup, and password reset

## Future Enhancements

Potential future enhancements to the user profiles system:
- Social login options (Google, Facebook)
- Favorite events and artists
- Friend referral system
- Enhanced ticket sharing options
- Mobile wallet integration
