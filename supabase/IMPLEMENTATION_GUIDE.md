# Shameless Productions Role System Implementation Guide

Follow these steps to implement the role-based authentication system for your Shameless Productions ticketing platform.

## 1. Fix Auth Triggers

First, let's fix any issues with the auth triggers that might be causing the "Database error saving new user" problem:

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `fix-auth-triggers.sql`
4. Run the script
5. Check for any error messages

## 2. Create Role System Database Tables

Now let's set up the core tables for the role system:

1. Go back to the SQL Editor
2. Copy and paste the contents of `role-system-step1.sql`
3. Run the script
4. Check for any error messages

## 3. Set Up Row Level Security (RLS) Policies

Next, let's configure the security policies for our tables:

1. Go back to the SQL Editor
2. Copy and paste the contents of `role-system-step2.sql`
3. Run the script
4. Check for any error messages

## 4. Test User Registration

Let's test if our fixes resolved the database error:

1. Create a new user through your application's registration form
2. Check if the user is created successfully without errors
3. Verify that the user automatically receives the 'customer' role:
   - In SQL Editor, run: `SELECT * FROM user_roles JOIN roles ON user_roles.role_id = roles.id WHERE user_id = 'YOUR_NEW_USER_ID';`

## 5. Verify Admin Assignment

Confirm that your first user has admin rights:

1. In SQL Editor, run: 
```sql
SELECT p.email, r.name as role_name 
FROM user_roles ur 
JOIN roles r ON ur.role_id = r.id 
JOIN profiles p ON ur.user_id = p.id 
WHERE r.name = 'admin';
```

2. Verify that at least one user (preferably your account) has the admin role

## 6. Set Up Enhanced Login Component

Now you can start implementing the frontend components:

1. Update your auth routes in `app/auth/enhanced-login/page.tsx` to use the new `EnhancedAuth` component
2. Test logging in with the enhanced login page

## 7. Add Role Management Interface

Add the admin role management interface:

1. Create the route `app/admin/users/page.tsx` (if not already created)
2. Implement the `RoleManagement` component
3. Test creating and assigning roles through the UI

## 8. Add Guest List Functionality

If you're ready to implement the guest list functionality:

1. Add the `EventArtistManager` component to your event management pages
2. Add the `GuestListManager` component to your event details pages
3. Test adding artists to events and managing guest lists

## 9. Update Middleware

Update your middleware to enforce role-based access control:

1. Update `middleware.ts` with the new role-based routing rules
2. Test access control by attempting to access protected routes with different user accounts

## Troubleshooting

If you encounter issues:

1. **"Database error saving new user"**:
   - Check the Supabase logs for specific error messages
   - Verify that the `handle_new_user` function is correctly implemented
   - Run `fix-auth-triggers.sql` again

2. **Column does not exist errors**:
   - Check the actual column names in your database tables
   - Update the SQL scripts to match your database schema
   - Update the TypeScript components to match your database schema

3. **Role assignment issues**:
   - Verify the triggers are correctly set up
   - Check the `user_roles` table for proper entries
   - Run the role assignment script manually if needed

4. **Access control issues**:
   - Verify RLS policies are correctly configured
   - Check that middleware is correctly checking roles
   - Ensure the `useUserRoles` hook is working correctly

## Next Steps

Once your basic role system is working:

1. Implement additional role-specific dashboards
2. Add role-based analytics and reporting
3. Enhance guest list features with check-in functionality
4. Add role-based notifications

Remember to update your TypeScript components to use the correct column names from your database schema.
