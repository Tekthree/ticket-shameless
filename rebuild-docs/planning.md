# Ticket Shameless: Rebuild Planning

## Project Structure

```
ticket-shameless/
├── app/                      # Next.js App Router pages
│   ├── admin/                # Admin dashboard pages
│   ├── api/                  # API routes for server actions
│   ├── auth/                 # Authentication pages (consolidated)
│   ├── box-office/           # Box office pages
│   │   ├── pos/              # Point of sale interface
│   │   ├── scanning/         # Ticket scanning interface
│   │   ├── guest-list/       # Guest list management
│   │   └── reports/          # Box office reports
│   ├── events/               # Event pages
│   ├── profile/              # User profile pages
│   ├── tickets/              # Ticket viewing pages
│   └── ...                   # Other app pages
├── components/               # React components
│   ├── admin/                # Admin-specific components
│   ├── auth/                 # Authentication components
│   ├── box-office/           # Box office components
│   │   ├── pos/              # Point of sale components
│   │   ├── scanner/          # Ticket scanning components
│   │   ├── guest-list/       # Guest list components
│   │   └── reports/          # Box office reporting components
│   ├── events/               # Event-related components
│   ├── layout/               # Layout components (navbar, footer)
│   ├── profile/              # Profile-related components
│   ├── tickets/              # Ticket-related components
│   └── ui/                   # UI components (shadcn)
├── hooks/                    # Custom React hooks
│   ├── use-auth.ts           # Authentication hooks
│   ├── use-events.ts         # Event data hooks
│   ├── use-tickets.ts        # Ticket data hooks
│   └── ...                   # Other custom hooks
├── lib/                      # Utility functions and libraries
│   ├── supabase/             # Supabase client and utilities
│   │   ├── client.ts         # Enhanced client with security
│   │   ├── server.ts         # Server-side client
│   │   ├── auth.ts           # Authentication helpers
│   │   ├── data-fetching.ts  # Optimized data fetching
│   │   └── ...               # Other Supabase utilities
│   ├── stripe/               # Stripe integration
│   ├── utils/                # General utilities
│   └── ...                   # Other libraries
├── public/                   # Static files
├── types/                    # TypeScript type definitions
├── migrations/               # Database migration scripts
└── ...                       # Config files
```

## Database Schema

### Users & Authentication

```sql
-- Profiles Table (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles Table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles Junction Table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Email Marketing Table
CREATE TABLE email_marketing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT NOT NULL, -- Where the email was collected from (signup, guest checkout, etc.)
  subscribed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_emailed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex')
);

-- Event Notifications Table
CREATE TABLE event_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'reminder', 'update', 'cancellation', etc.
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB
);

-- Create indexes for performance
CREATE INDEX idx_email_marketing_email ON email_marketing(email);
CREATE INDEX idx_email_marketing_subscribed ON email_marketing(subscribed);
CREATE INDEX idx_event_notifications_event_id ON event_notifications(event_id);
CREATE INDEX idx_event_notifications_type ON event_notifications(type);
```

### Events & Artists

```sql
-- Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue TEXT NOT NULL,
  image TEXT,
  price NUMERIC NOT NULL,
  tickets_total INTEGER NOT NULL,
  tickets_remaining INTEGER NOT NULL,
  sold_out BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artists Table
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  image TEXT,
  mix_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Artists Junction Table
CREATE TABLE event_artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  performance_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, artist_id)
);
```

### Tickets & Orders

```sql
-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  amount_total NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  box_office_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_box_office_sale BOOLEAN DEFAULT FALSE
);

-- Tickets Table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  qr_code TEXT,
  scanned BOOLEAN DEFAULT FALSE,
  scanned_at TIMESTAMP WITH TIME ZONE,
  scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket Types Table
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  available_quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket Transactions Table (for audit)
CREATE TABLE ticket_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest List Table
CREATE TABLE guest_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  number_of_guests INTEGER DEFAULT 1,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Box Office Shifts Table
CREATE TABLE box_office_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_end TIMESTAMP WITH TIME ZONE,
  cash_start NUMERIC DEFAULT 0,
  cash_end NUMERIC,
  total_sales NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Box Office Transactions Table
CREATE TABLE box_office_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID REFERENCES box_office_shifts(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Authentication Flow

1. **User Registration**
   - User submits registration form or selects Google OAuth
   - Create user in Supabase Auth
   - Create profile record
   - Send verification email (for email registration)
   - Redirect to verification page or directly to app (for OAuth)

2. **Google OAuth Integration**
   - Configure Google OAuth provider in Supabase dashboard
   - Set up authorized redirect URIs in Google Cloud Console
   - Implement OAuth sign-in button in login/register UI
   - Handle OAuth callback and token exchange
   - Create or link user profile on successful authentication
   - Sync Google profile data (name, avatar) with local profile

3. **User Login**
   - User submits login form or clicks Google sign-in
   - Authenticate with Supabase Auth
   - Fetch user roles and permissions
   - Set up auth state listeners
   - Redirect based on user role

4. **Session Management**
   - Use `getAuthenticatedUser()` for secure user data
   - Implement token refresh mechanism
   - Handle auth state changes with proper UI updates
   - Clear caches on auth state changes
   - Maintain OAuth session state appropriately

5. **Role-Based Access**
   - Check user roles in middleware
   - Protect routes based on required permissions
   - Show/hide UI elements based on roles
   - Implement role-specific redirects

6. **Profile Linking**
   - Allow users to link/unlink OAuth providers to existing accounts
   - Manage multiple authentication methods per user
   - Handle account merging scenarios
   - Provide profile connection management UI

## Data Fetching Strategy

1. **Optimized Supabase Queries**
   - Use request batching for related queries
   - Implement retry mechanism with exponential backoff
   - Add proper error handling and logging
   - Use TypeScript for type safety

2. **Caching Strategy**
   - Cache frequently accessed data (users, events)
   - Set appropriate TTL for different data types
   - Implement targeted cache invalidation
   - Clear caches on relevant data changes

3. **Server-Side vs. Client-Side Fetching**
   - Use server components for initial data loading
   - Implement client-side fetching for interactive features
   - Use SWR or React Query for client-side data fetching
   - Optimize for both SSR and client-side rendering

## UI Component Library

1. **Base Components (shadcn/ui)**
   - Button, Input, Card, Dialog, etc.
   - Implement consistent theming
   - Ensure accessibility compliance
   - Add proper loading states

2. **Custom Components**
   - UserProfileCard: Enhanced dropdown with secure auth
   - EventCard: Consistent event display
   - TicketCard: Ticket display with QR code
   - AdminLayout: Layout for admin pages with navigation

3. **Layout Components**
   - Navbar: With proper role-based navigation
   - Footer: With site information
   - PageLayout: Consistent page structure
   - AdminLayout: Admin-specific layout

## Testing Strategy

1. **Unit Testing**
   - Test individual components
   - Test hooks and utilities
   - Mock Supabase and Stripe APIs
   - Ensure high test coverage

2. **Integration Testing**
   - Test user flows (registration, login, purchase)
   - Test admin workflows
   - Test error handling
   - Test role-based access

3. **End-to-End Testing**
   - Test complete user journeys
   - Test payment processing
   - Test ticket generation and scanning
   - Test admin dashboard functionality

## Deployment Strategy

1. **Environment Setup**
   - Development: Local environment
   - Staging: Pre-production for testing
   - Production: Live environment

2. **CI/CD Pipeline**
   - Run tests on pull requests
   - Build and deploy on merge to main
   - Run database migrations
   - Implement rollback procedures

3. **Monitoring**
   - Set up error tracking
   - Implement performance monitoring
   - Add logging for critical operations
   - Set up alerts for system issues

## Timeline

### Week 1: Setup & Architecture
- Initialize project with Next.js 14+
- Set up Supabase with enhanced security
- Implement database schema and migrations
- Create authentication system with secure helpers

### Week 2: Core Features - Part 1
- Implement user management
- Create event system
- Set up artist management
- Develop basic admin dashboard

### Week 3: Core Features - Part 2
- Implement ticket system
- Integrate Stripe for payments
- Create ticket history and management
- Develop QR code generation and scanning

### Week 4: Optimization & Testing
- Optimize data fetching
- Implement caching strategy
- Write tests for critical components
- Set up CI/CD pipeline

### Week 5: UI/UX & Deployment
- Refine UI/UX across all pages
- Ensure responsive design
- Set up production deployment
- Create documentation