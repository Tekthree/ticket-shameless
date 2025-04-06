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
- ✅ Site content management for landing page customization
- ✅ Image and video management through Supabase Storage
- ✅ Customizable navigation and footer logos

All basic functionality is working. You can add, edit, and delete events through the admin interface, manage artists and lineups, customize landing page content, and users can browse and purchase tickets.

## Next Steps

Future enhancements could include:

- [ ] User profiles and ticket history
- [ ] Email notifications for purchases
- [ ] QR code generation for tickets
- [ ] Ticket scanning at the door
- [ ] Analytics dashboard for sales
- [ ] Featured events and promotions

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **File Storage**: Supabase Storage
- **Payments**: Stripe

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

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

4. Set up your Supabase database schema:
   - **Create the tables:** Run the following SQL files in your Supabase SQL editor:
   ```
   supabase/schema.sql (main schema)
   supabase/artists-schema.sql (artist management)
   ```
   
   - **Run migrations:** You can also run the latest database migrations with:
   ```bash
   npm run migrate
   ```
   
   This will apply any updates to the database schema in the `supabase/migrations` directory.
   
   - **Set up site content:** Run this SQL in your Supabase SQL editor:
   ```sql
   -- Create a site_content table to store configurable content
   CREATE TABLE site_content (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     section VARCHAR NOT NULL, -- e.g., 'hero', 'about', 'motto'
     field VARCHAR NOT NULL, -- e.g., 'title', 'description', 'image', 'video'
     content TEXT NOT NULL,
     content_type VARCHAR NOT NULL DEFAULT 'text', -- 'text', 'image', 'video'
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(section, field)
   );

   -- Create RLS policies for site_content
   ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

   -- Allow anyone to read site content
   CREATE POLICY "Allow public read access to site_content" ON site_content
     FOR SELECT USING (true);
     
   -- Only allow authenticated users (admins) to modify site content
   CREATE POLICY "Allow authenticated users to update site_content" ON site_content
     FOR UPDATE USING (auth.role() = 'authenticated');
     
   -- Use WITH CHECK for the INSERT policy
   CREATE POLICY "Allow authenticated users to insert site_content" ON site_content
     FOR INSERT TO authenticated WITH CHECK (true);

   -- Seed initial content values
   INSERT INTO site_content (section, field, content, content_type) VALUES
     ('hero', 'title', '22 Years Shameless', 'text'),
     ('hero', 'subtitle', 'Keeping It Weird Since 2003', 'text'),
     ('hero', 'background', '/images/logo.png', 'image'),
     ('hero', 'video', '', 'video'),
     ('about', 'title', 'Keeping It Weird Since 2003', 'text'),
     ('about', 'description', 'In 2003, Shameless first took shape as a weekly indie dance night in the basement of the Alibi Room located in Seattle''s historic Pike Place Market. The ensemble quickly became one of the city''s most respected underground dance music collectives by throwing numerous legendary club nights, open air and after parties.', 'text'),
     ('about', 'image', '/images/logo.png', 'image'),
     ('motto', 'title', 'Shake Your Shame Off And Get Your Game On.', 'text'),
     ('motto', 'description', 'From day one, each Shameless party was a special one regardless of the wide ranges of genres and bookings represented. With an eye towards the cutting edge, but deep respect for electronic music''s rich history, Shameless has kept its finger on the pulse of Seattle''s underground for years now and yet keeps looking forward.', 'text'),
     ('motto', 'image', '/images/logo.png', 'image'),
     ('navigation', 'logo', '/images/logo.png', 'image'),
     ('footer', 'logo', '/images/logo.png', 'image');
   ```

   - **Set up storage:** Run this SQL in your Supabase SQL editor:
   ```sql
   -- Create a public bucket for storing images and videos
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('public', 'Public Storage', true)
   ON CONFLICT (id) DO NOTHING;

   -- Create policies to allow authenticated users to insert into the storage
   CREATE POLICY "Allow authenticated users to upload files"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'public');

   -- Create policy to allow all users to select/view objects from public bucket
   CREATE POLICY "Allow public read access to objects"
   ON storage.objects
   FOR SELECT
   TO public
   USING (bucket_id = 'public');

   -- Create policy to allow authenticated users to update their own objects
   CREATE POLICY "Allow authenticated users to update their own files"
   ON storage.objects
   FOR UPDATE
   TO authenticated
   USING (bucket_id = 'public' AND auth.uid() = owner);

   -- Create policy to allow authenticated users to delete their own objects
   CREATE POLICY "Allow authenticated users to delete their own files"
   ON storage.objects
   FOR DELETE
   TO authenticated
   USING (bucket_id = 'public' AND auth.uid() = owner);
   ```
   
5. Configure Next.js for external images:
   - Add your Supabase domain and any other image domains to `next.config.js`:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     images: {
       domains: [
         'your-project.supabase.co', // Replace with your Supabase project domain
         'scontent-sea1-1.xx.fbcdn.net', // For Facebook images
         'scontent.xx.fbcdn.net',        // Alternative Facebook CDN domain
       ],
     },
   };
   
   module.exports = nextConfig;
   ```

6. Seed your database with initial events:
```bash
npm run seed
```

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) to view the application.

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

### Site_Content Table
Stores customizable content for the landing page including text, images, videos, and logos.

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

### Site Content Management

The platform includes a lightweight CMS for managing landing page content:
- Edit hero section text, images, and background video
- Edit about section text and images
- Edit motto section text and images
- Upload and manage media assets using Supabase Storage
- Preview changes in real-time
- Customize navigation and footer logos for consistent branding

The content management interface is available at `/admin/site-content`.

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

## Customizing Site Layout

### Navigation and Footer

The site features a customizable navigation bar and footer with uploadable logos:

1. The navigation bar is taller with a larger logo area for better visibility
2. The footer includes a prominent logo space, navigation links, social links, and legal information
3. Both logos can be updated through the Site Content manager in the admin area

To change the appearance of the navigation or footer:
- For layout changes: Edit the `components/Navbar.tsx` and `components/Footer.tsx` files
- For content changes: Use the admin interface at `/admin/site-content` and go to the Logos tab

## Troubleshooting

### Image Loading Issues
If you encounter errors with loading images from external domains, make sure to add those domains to the `next.config.js` file as described in the installation steps.

### Database Setup Issues
If you have issues with running the setup scripts, you can always run the SQL statements directly in the Supabase SQL editor as outlined in the installation steps.

## License

This project is licensed under the MIT License.
