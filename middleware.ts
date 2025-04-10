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
        path.startsWith('/event-manager')) {
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
      
      // Extract role names
      const roles = (userRolesData || []).map((ur: any) => ur.roles?.name);
      
      // Determine redirect based on role hierarchy
      if (roles.includes('admin')) {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (roles.includes('event_manager')) {
        return NextResponse.redirect(new URL('/admin/events', request.url));
      } else if (roles.includes('box_office')) {
        return NextResponse.redirect(new URL('/box-office', request.url));
      } else if (roles.includes('artist')) {
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
      
      // Extract role names
      const roles = (userRolesData || []).map((ur: any) => ur.roles?.name);
      
      // Check if user has access to the requested path based on roles
      if (path.startsWith('/admin') && !roles.includes('admin')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      if (path.startsWith('/admin/events') && 
          !roles.includes('admin') && 
          !roles.includes('event_manager')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      if (path.startsWith('/box-office') && 
          !roles.includes('admin') && 
          !roles.includes('box_office') &&
          !roles.includes('event_manager')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      // New specific box-office route checks
      if ((path.startsWith('/box-office/pos') || path.startsWith('/box-office/scanning')) && 
          !roles.includes('admin') && 
          !roles.includes('box_office') &&
          !roles.includes('event_manager')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      // New admin tickets reporting route check
      if (path.startsWith('/admin/tickets') && 
          !roles.includes('admin')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      if (path.startsWith('/artist') && 
          !roles.includes('admin') && 
          !roles.includes('artist')) {
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
