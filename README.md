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
- **Artist Management**: Manage artist profiles, bookings, and event assignments.
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

4. Run the development server
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
