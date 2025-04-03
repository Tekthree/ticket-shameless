# Shameless Ticketing Platform Scripts

This directory contains utility scripts for the Shameless Ticketing Platform.

## Available Scripts

### `seed-database.js`

This script seeds your Supabase database with placeholder events. It's useful for setting up a development environment or testing new features.

#### Prerequisites

- A Supabase project with the proper database schema already set up
- `.env.local` file with your Supabase credentials

#### Setup for Database Seeding

There are a few ways to seed your database, depending on your Supabase configuration:

**Option 1: Using Service Role Key (Recommended for Development)**
1. Get your service role key from your Supabase dashboard (Settings > API)
2. Add it to your `.env.local` file:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Option 2: Using User Authentication**
1. Add your Supabase user credentials to your `.env.local` file:
```
SUPABASE_USER_EMAIL=your_email@example.com
SUPABASE_USER_PASSWORD=your_password
```

**Option 3: Using RLS Bypass Functions (For Production)**
1. Run the SQL in `create-bypass-functions.sql` in your Supabase SQL editor
2. These functions will allow the seeding script to work without needing the service role key

#### Usage

1. Install dependencies:
```bash
npm install
```

2. Run the script:
```bash
npm run seed
```

This will add or update the placeholder events in your Supabase database. The script uses the `upsert` operation with a conflict resolution on the `slug` field, so it's safe to run multiple times without creating duplicate records.

After running this script, you'll be able to:
- View the events in the application
- Edit them through the admin interface
- Test the ticket purchasing flow

#### Customizing Events

To add more events or modify the existing ones, edit the `events` array in the `seed-database.js` file.

### `create-bypass-functions.sql`

This SQL script creates helper functions to bypass RLS (Row Level Security) when seeding the database. 

Run this in your Supabase SQL editor if you're having trouble with RLS permissions during seeding.
