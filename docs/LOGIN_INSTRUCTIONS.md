# Login and Registration Instructions

## Login

Use the enhanced login page at:
```
/auth/enhanced-login
```

This login page is integrated with our new role-based authentication system.

## Registration

The registration functionality is built into the enhanced login page. Users can:
1. Click on "Create Account" on the login page
2. Fill in their details
3. Complete registration

## Important Notes

- The system will automatically assign the "customer" role to new users
- The first user in the system has been assigned the "admin" role
- Admin users can manage roles through the admin interface at `/admin/users`

## Other Login/Register Pages

The following pages should be considered deprecated and should not be used:
- `/auth/login`
- `/login`
- `/simple-login`
- `/register`
- `/direct-register`

These will be removed in a future update.
