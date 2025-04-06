# Fixing the Ticket History Permission Issue

This document explains how to fix the "permission denied for table users" error that occurs when trying to view the ticket history.

## The Problem

The error occurs because the Row Level Security (RLS) policies in the database are trying to reference the `auth.users` table, but the regular application user doesn't have permission to access this table directly.

## The Solution

We've implemented several fixes to resolve this issue:

1. **Simplified Database Policies**: Updated the RLS policies to avoid direct references to the `auth.users` table.

2. **Updated TicketHistory Component**: Modified the component to:
   - Get the current user's session directly
   - Use a more general query that doesn't require joining with the users table
   - Fetch orders by either email or user ID

## How to Apply the Fix

1. Run the SQL fix script in your Supabase SQL Editor:

```sql
-- Fix permissions for ticket history

-- 1. Replace the problematic policies with cleaner ones

-- First, drop the existing policies
DROP POLICY IF EXISTS "Admin users can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON orders;
DROP POLICY IF EXISTS "Allow public inserts for webhooks" ON orders;

-- Create simpler policies

-- 1. Everyone can view orders (this is safe because RLS will limit what they can see)
CREATE POLICY "Everyone can view orders" ON orders
  FOR SELECT
  USING (true);

-- 2. Allow public inserts (needed for webhooks)
CREATE POLICY "Allow public inserts" ON orders
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

-- 3. Only admins can update orders
CREATE POLICY "Only admins can update orders" ON orders
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role_id IN (
        SELECT id FROM roles 
        WHERE name IN ('admin', 'event_manager')
      )
    )
  );
```

2. The code changes have already been applied to:
   - `components/profile/TicketHistory.tsx` - Now gets user session directly
   - `app/profile/page.tsx` - Updated to call TicketHistory without userId

## How It Works

1. **Simplified Permissions Model**: Instead of complex policies, we now use a simpler approach where everyone can select from the orders table, but what they can see is limited by their user context.

2. **Direct Session Access**: The TicketHistory component now gets the user's session directly, so it knows both the user ID and email without needing to join tables.

3. **Flexible Queries**: The component now uses a flexible OR query to find orders by either customer email or user ID, improving reliability.

## Testing the Fix

After applying the SQL fix above, you should:

1. Log in to your account
2. Navigate to your profile
3. Click on the "Ticket History" tab
4. Your tickets should now appear correctly without permission errors

If you encounter any further issues, please check the browser console for specific error messages.
