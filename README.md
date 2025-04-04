## Google Maps Integration

The application uses Google Maps to display venue locations. To set up Google Maps:

1. Create a Google Cloud project at https://console.cloud.google.com/
2. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
3. Create an API key with appropriate restrictions (HTTP referrers recommended)
4. Add your API key to the `.env.local` file:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

If you encounter a "REQUEST_DENIED" error, check that:
- Your API key is correctly added to `.env.local`
- Billing is enabled on your Google Cloud project
- The necessary APIs are enabled
- Your API key restrictions (if any) allow access from your domain

# Shameless Ticket Platform

A ticketing platform for Shameless Productions, built with Next.js, Supabase, and Stripe.

## Project Status

This project implements a complete ticketing platform for the Shameless music production and promotion crew. The following features have been implemented:

- ✅ Next.js application with TypeScript and Tailwind CSS
- ✅ Supabase integration for database and authentication
- ✅ Stripe integration for payment processing
- ✅ Event listing and detail pages
- ✅ Admin dashboard for event management
- ✅ Ticket purchasing flow with Stripe Checkout
- ✅ Webhook handlers for Stripe events
- ✅ Mock data fallback for development
- ✅ Database seeding scripts for initial setup
- ✅ Artist and lineup management for events

All basic functionality is working. You can add, edit, and delete events through the admin interface, manage artists and lineups, and users can browse and purchase tickets.

## Next Steps

Future enhancements could include:

- [ ] User profiles and ticket history
- [ ] Email notifications for purchases
- [ ] QR code generation for tickets
- [ ] Ticket scanning at the door
- [ ] Analytics dashboard for sales
- [ ] Image upload to Supabase Storage
- [ ] Featured events and promotions

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe
- **Image Storage**: Currently using URLs, could upgrade to Supabase Storage

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Stripe account

### Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables in `.env.local`:
```
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. Set up your Supabase database by running the SQL in `supabase/schema.sql` and `supabase/artists-schema.sql` in your Supabase SQL editor.

5. Seed your database with initial events:
```bash
npm run seed
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The database has the following main tables:

### Events Table
Stores information about events including title, date, venue, and ticket inventory.

### Orders Table
Stores information about ticket purchases including customer details and payment status.

### Artists Table
Stores information about artists including name and image URL.

### Event_Artists Table
Junction table that creates a many-to-many relationship between events and artists, including performance time information.

## Key Features

### Event Management

Admins can:
- Create new events
- Edit existing events
- Delete events
- Set ticket prices and inventory
- Manage artist lineups for events

The admin interface is available at `/admin`.

### Artist Management

The platform includes a complete artist management system:
- Search for existing artists by name
- Create new artists with name and image
- Add artists to event lineups with performance times
- Reuse artists across multiple events
- View and manage the current lineup for each event

### Ticket Purchasing

Users can:
- Browse available events
- View event details and lineups
- Purchase tickets via Stripe
- See confirmation of their purchase

### Webhook Integration

The application handles Stripe webhook events including:
- `checkout.session.completed` - When a payment is successful
- `payment_intent.succeeded` - When a payment intent succeeds
- `payment_intent.payment_failed` - When a payment fails

#### Webhook Database Access

The Stripe webhook needs to insert data into the `orders` table when a purchase is completed. Since webhooks don't have an authenticated context, you need to set up proper Row Level Security (RLS) to allow these operations:

```sql
-- Allow webhook handlers to insert into the orders table
CREATE POLICY "Allow public inserts for webhooks" ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);
```

Run this SQL in your Supabase SQL editor to enable the webhook to function correctly.

## Utility Scripts

### Database Seeding

The project includes a script to seed your database with initial events:

```bash
npm run seed
```

This requires either:
- `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local` file
- Or the RLS bypass functions from `scripts/create-bypass-functions.sql` in your Supabase database

### Webhook Testing

For testing Stripe webhooks locally:

1. Install the Stripe CLI
2. Run `stripe login`
3. Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. In another terminal, trigger events with `stripe trigger checkout.session.completed`

## Deployment

For production deployment:

1. Build the application: `npm run build`
2. Deploy to your preferred hosting platform (Vercel recommended)
3. Set up environment variables on your hosting platform
4. Configure Stripe webhook endpoints in the Stripe dashboard
5. Ensure Supabase RLS policies are properly configured

## Authentication

The application uses Supabase Authentication. The admin dashboard is protected and requires authentication.

For development, you can create a user in your Supabase project and use those credentials to access the admin dashboard.

## License

This project is licensed under the MIT License.
