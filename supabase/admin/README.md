# Admin SQL Scripts

This directory contains SQL scripts for administrative tasks.

## Available Scripts

### `make-admin-fixed.sql`

This script allows you to make a user an admin in the system. It includes:

- Error handling and verification 
- Double-check mechanism to ensure the user is properly set as admin
- Resolves recursion errors present in earlier versions

### Usage

1. Open the SQL script in a text editor
2. Replace `your.email@example.com` with the actual email of the user to be made admin
3. Execute the script in the Supabase SQL Editor

### Notes

This is the recommended script for making users admins, replacing older versions 
(`make-admin.sql` and `make-admin-simple.sql`) which had various issues.