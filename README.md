# Ticket Shameless

A modern ticketing and event management platform for Shameless Productions, Seattle's premier electronic music event collective.

## Overview

Ticket Shameless is a full-stack web application built with Next.js and Supabase, providing a comprehensive solution for event management, ticket sales, and user account management. The platform features both public-facing pages for event attendees and an administrative dashboard for event organizers.

## Features

### Public Features

- **Event Browsing & Discovery**: Users can browse upcoming events, view details, and purchase tickets.
- **User Accounts**: Personalized accounts with ticket purchase history and profile management.
- **Responsive Design**: Fully responsive layout that works on mobile, tablet, and desktop devices.
- **Dark/Light Mode**: Built-in theme toggle for user preference.

### Admin Dashboard

- **Event Management**: Create, edit, and manage events including venue, date, time, ticket pricing, and capacity.
- **Artist Management**: Manage artist profiles including bios, images, and music links. Preview artists' mixes directly in the admin interface.
- **Content Management**: Edit site content including landing pages and promotional materials.
- **User Management**: Manage user accounts, roles, and permissions.
- **Sales Reports**: View and export ticket sales data and analytics.

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Authentication & Backend**: Supabase (Auth, Database, Storage)
- **Styling**: Tailwind CSS with custom theme support
- **Icons**: Lucide React icons
- **State Management**: React context and Supabase realtime subscriptions
- **Deployment**: [Your deployment platform]

## Screenshots

### Admin Dashboard

![Admin Dashboard](./docs/images/admin-dashboard.png)

### Profile Page

![Profile Page](./docs/images/profile-page.png)

### Event Page

![Event Page](./docs/images/event-page.png)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Supabase account
- [Any other dependencies]

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ticket-shameless.git
cd ticket-shameless
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure environment variables
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your Supabase credentials.

4. Apply database migrations
```bash
npm run migrate
```

5. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

[Add deployment instructions specific to your setup]

## Project Structure

```
ticket-shameless/
├── app/               # Next.js app router pages
│   ├── admin/         # Admin dashboard pages
│   ├── api/           # API routes
│   ├── auth/          # Authentication pages
│   ├── events/        # Event pages
│   ├── profile/       # User profile pages
│   └── ...
├── components/        # React components
│   ├── admin/         # Admin-specific components
│   ├── events/        # Event-related components
│   ├── profile/       # Profile-related components
│   ├── ui/            # UI components (shadcn)
│   └── ...
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and libraries
│   ├── supabase/      # Supabase client and utilities
│   └── utils.ts       # Helper utilities
├── public/            # Static files
└── ...
```

## Features in Detail

### Artist Profiles

The application includes a comprehensive artist management system with the following features:
- Detailed artist profiles with biographical information
- Links to music mixes (SoundCloud, Mixcloud, etc.)
- Embedded mix previewer for quick audio assessment
- Image management for artist photos
- Connection to events through the event_artists junction table

### Theme Toggle

The application supports both light and dark modes, with a convenient toggle in the navigation bar. The theme system is built on next-themes and persists user preferences across sessions.

### Authentication

User authentication is handled through Supabase Auth, providing:
- Email/password login
- Social login options (if configured)
- JWT token management
- Role-based access control

### Role-Based Access

The application supports multiple user roles:
- **Admin**: Full access to all features
- **Event Manager**: Can manage events and artists
- **Box Office**: Can view and manage ticket sales
- **Artist**: Can view own events and information
- **User**: Basic access to ticket purchases and profile

## Database Structure

### Key Tables

#### Artists Table
```sql
CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image TEXT,
  bio TEXT,
  mix_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Event Artists Junction Table
```sql
CREATE TABLE IF NOT EXISTS event_artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  performance_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, artist_id)
);
```

#### Events Table
```sql
-- Main structure, see schema.sql for full details
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  -- Additional fields omitted for brevity
);
```

## Migrations

The application includes a migration system to manage database schema changes. Migrations are located in the `supabase/migrations` directory and can be applied using the `npm run migrate` command.

Recent migrations include:
- `20250406_update_artists.sql`: Added bio and mix_url fields to the artists table

## License

[Your license information]

## Acknowledgements

- [shadcn/ui](https://ui.shadcn.com/) for accessible UI components
- [Lucide React](https://lucide.dev/) for icons
- [Next.js](https://nextjs.org/) team for the framework
- [Supabase](https://supabase.io/) for backend services
- [Tailwind CSS](https://tailwindcss.com/) for styling

## Contact

[Your contact information]
