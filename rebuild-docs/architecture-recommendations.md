# Architecture Recommendations for Rebuild

This document provides architecture recommendations for the Ticket Shameless rebuild to ensure efficiency with Next.js App Router and Supabase, while maintaining manageable file sizes and clear component boundaries.

## Project Structure

### Feature-Based Organization

Organize the codebase by feature domains rather than technical concerns:

```
/src
  /features
    /auth         # Authentication related components and functions
    /tickets      # Ticket system components and services
    /events       # Event management
    /users        # User profiles and management
    /cms          # Content management
    /email        # Email notifications
  /components     # Shared UI components
  /lib            # Shared utilities
  /styles         # Global styles
```

Each feature folder should contain:

```
/feature-name
  /components     # UI components specific to this feature
  /hooks          # Custom hooks for this feature
  /services       # API and data services
  /types          # TypeScript types and interfaces
  /utils          # Feature-specific utilities
```

## File Size Management

### Component Splitting

Keep all files under 500 lines by splitting into smaller, focused components:

1. **UI Components**: Break down complex UI into smaller components
   - Example: Split `TicketPurchaseForm.tsx` (800 lines) into:
     - `TicketTypeSelector.tsx` (150 lines)
     - `TicketQuantityControl.tsx` (100 lines)
     - `TicketPriceDisplay.tsx` (100 lines)
     - `TicketCheckoutForm.tsx` (150 lines)

2. **Service Layers**: Split large service files by functionality
   - Example: Break down `ticketService.ts` (700 lines) into:
     - `ticketInventoryService.ts` (250 lines)
     - `ticketReservationService.ts` (200 lines)
     - `ticketPurchaseService.ts` (250 lines)

## Next.js App Router Optimization

### Server vs. Client Components

Leverage the App Router's Server Components for improved performance:

```typescript
// app/events/[id]/page.tsx - Server Component
export default async function EventPage({ params }) {
  // Data fetching happens on the server
  const event = await getEvent(params.id);
  
  return (
    <div>
      <EventHeader event={event} />
      <EventDetails event={event} />
      {/* Client component for interactive elements */}
      <TicketPurchase eventId={event.id} clientOnly />
    </div>
  );
}
```

```typescript
// components/TicketPurchase.tsx - Client Component
'use client';

export default function TicketPurchase({ eventId }) {
  // Interactive client-side logic
  // ...
}
```

### Data Fetching Strategy

Implement efficient data fetching with React Server Components and client-side caching:

1. **Server Components**: Use direct `fetch` calls with proper caching:
   ```typescript
   // Server component
   export default async function EventsList() {
     // This fetch is cached by default
     const events = await fetch('https://api.example.com/events');
     return <EventsGrid events={events} />;
   }
   ```

2. **Client Components**: Use SWR or React Query for client-side data fetching:
   ```typescript
   // Client component
   'use client';
   import { useQuery } from '@tanstack/react-query';
   
   export function TicketAvailability({ ticketTypeId }) {
     const { data } = useQuery({
       queryKey: ['ticket-availability', ticketTypeId],
       queryFn: () => getAvailableTicketCount(ticketTypeId),
       refetchInterval: 30000, // Refresh every 30 seconds
     });
     
     return <div>Available: {data?.availableCount || 'Loading...'}</div>;
   }
   ```

## Supabase Integration

### Client Setup

Create a centralized Supabase client setup:

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

let supabaseClient;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return supabaseClient;
}
```

### Server-Side Functions

Create dedicated server-side functions for data operations:

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getServerSupabase() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}
```

### Data Caching

Implement proper client-side caching to reduce redundant database calls:

```typescript
// hooks/useEvents.ts
import useSWR from 'swr';
import { getSupabaseClient } from '@/lib/supabase/client';

export function useEvents() {
  return useSWR('events', async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });
      
    if (error) throw error;
    return data;
  }, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 60000, // Refresh every minute
  });
}
```

## Authentication Flow

### Middleware-Based Protection

Simplify authentication with middleware:

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // Public routes accessible to everyone
  const publicRoutes = ['/login', '/signup', '/events', '/'];
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith('/events/')
  );
  
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Admin routes require admin role
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );
  
  if (isAdminRoute) {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', session?.user?.id || '');
      
    const isAdmin = roles?.some(role => role.roles.name === 'admin');
    
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }
  
  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## Implementation Recommendations

1. **Break down large functions** into smaller, single-responsibility functions
2. **Use React Context** for state that needs to be shared across components
3. **Implement proper error handling** throughout the application
4. **Create custom hooks** for reusable logic
5. **Use TypeScript** for better type safety and developer experience

By implementing these recommendations, the Ticket Shameless rebuild will be more maintainable, efficient, and aligned with modern Next.js and Supabase best practices.
