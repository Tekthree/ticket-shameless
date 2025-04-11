import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Create a response object that we can manipulate
  const response = NextResponse.next()
  
  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, any>) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, any>) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  // Get the user directly from the server for better security
  // This is more secure than using getSession() as it validates with the Supabase Auth server
  const { data: { user } } = await supabase.auth.getUser()
  
  // We'll use the validated user object exclusively for authentication
  // This eliminates security warnings related to using session data from storage
  
  // If no validated user, they're not authenticated
  if (!user) {
    // Check if they're trying to access a protected route
    const path = request.nextUrl.pathname
    if (path.startsWith('/admin') || 
        path.startsWith('/profile') || 
        path.startsWith('/artist') || 
        path.startsWith('/box-office') || 
        path.startsWith('/event-manager') ||
        path.startsWith('/auth/enhanced-login')) {
      // Always redirect to the standard login page
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }
  
  // Get the path from the request URL
  const path = request.nextUrl.pathname
  
  // If user is authenticated and trying to access login page, redirect to appropriate dashboard
  if ((path.startsWith('/login') || 
       path.startsWith('/auth/login')) && user) {
    
    // Check user roles to determine where to redirect
    try {
      // Get user roles
      const { data: userRolesData } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id);
      
      // Extract role names and normalize to lowercase for comparison
      const roleObjects = userRolesData || [];
      console.log('User role data objects:', roleObjects);
      
      // Extract both original roles and lowercase versions for flexible matching
      const roles = roleObjects.map((ur: any) => ur.roles?.name);
      const rolesLower = roles.map(role => (typeof role === 'string' ? role.toLowerCase() : ''));
      
      console.log('User roles (original):', roles);
      console.log('User roles (lowercase):', rolesLower);
      
      // Function to check if user has a specific role (case insensitive)
      const hasRole = (roleToCheck: string) => {
        const roleLower = roleToCheck.toLowerCase();
        return rolesLower.includes(roleLower) || roles.includes(roleToCheck);
      };
      
      // Determine redirect based on role hierarchy
      if (hasRole('admin') || hasRole('ADMIN')) {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (hasRole('event_manager') || hasRole('EVENT_MANAGER')) {
        return NextResponse.redirect(new URL('/admin/events', request.url));
      } else if (hasRole('box_office') || hasRole('BOX_OFFICE')) {
        return NextResponse.redirect(new URL('/box-office', request.url));
      } else if (hasRole('artist') || hasRole('ARTIST')) {
        return NextResponse.redirect(new URL('/artist/dashboard', request.url));
      } else {
        // Default redirect for authenticated users
        return NextResponse.redirect(new URL('/profile', request.url));
      }
    } catch (error) {
      console.error('Error checking roles:', error);
      // Default redirect if role check fails
      return NextResponse.redirect(new URL('/profile', request.url));
    }
  }
  
  // Role-based access control for specific sections
  if (user) {
    try {
      // Get user roles
      const { data: userRolesData } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id);
      
      // Extract role names and normalize to lowercase for comparison
      const roleObjects = userRolesData || [];
      console.log('RBAC - User role data objects:', roleObjects);
      
      // Extract both original roles and lowercase versions for flexible matching
      const roles = roleObjects.map((ur: any) => ur.roles?.name);
      const rolesLower = roles.map(role => (typeof role === 'string' ? role.toLowerCase() : ''));
      
      console.log('RBAC - User roles (original):', roles);
      console.log('RBAC - User roles (lowercase):', rolesLower);
      console.log('RBAC - Requested path:', path);
      
      // Function to check if user has a specific role (case insensitive)
      const hasRole = (roleToCheck: string) => {
        const roleLower = roleToCheck.toLowerCase();
        return rolesLower.includes(roleLower) || roles.includes(roleToCheck);
      };
      
      // Check if user has access to the requested path based on roles
      if (path.startsWith('/admin') && !hasRole('admin') && !hasRole('ADMIN')) {
        // Special case for /admin/events and /admin/artists for event managers
        if ((path.startsWith('/admin/events') || path.startsWith('/admin/artists')) && 
            (hasRole('event_manager') || hasRole('EVENT_MANAGER'))) {
          // Allow event managers to access these specific routes
          console.log('RBAC - Allowing event manager access to:', path);
        } else {
          console.log('RBAC - Unauthorized admin access, redirecting to /unauthorized');
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
      
      if (path.startsWith('/box-office') && 
          !hasRole('admin') && !hasRole('ADMIN') && 
          !hasRole('box_office') && !hasRole('BOX_OFFICE') &&
          !hasRole('event_manager') && !hasRole('EVENT_MANAGER')) {
        console.log('RBAC - Unauthorized box office access, redirecting to /unauthorized');
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      // New specific box-office route checks
      if ((path.startsWith('/box-office/pos') || path.startsWith('/box-office/scanning')) && 
          !hasRole('admin') && !hasRole('ADMIN') && 
          !hasRole('box_office') && !hasRole('BOX_OFFICE') &&
          !hasRole('event_manager') && !hasRole('EVENT_MANAGER')) {
        console.log('RBAC - Unauthorized box office POS/scanning access, redirecting to /unauthorized');
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      // New admin tickets reporting route check
      if (path.startsWith('/admin/tickets') && 
          !hasRole('admin') && !hasRole('ADMIN')) {
        console.log('RBAC - Unauthorized tickets reporting access, redirecting to /unauthorized');
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      if (path.startsWith('/artist') && 
          !hasRole('admin') && !hasRole('ADMIN') && 
          !hasRole('artist') && !hasRole('ARTIST')) {
        console.log('RBAC - Unauthorized artist access, redirecting to /unauthorized');
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    } catch (error) {
      console.error('Error checking roles for access control:', error);
      // Allow access by default if role check fails (graceful degradation)
    }
  }
  
  return response
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/profile/:path*',
    '/artist/:path*',
    '/box-office/:path*',
    '/event-manager/:path*',
    '/login',
    '/auth/login'
  ],
}
