import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Cache constants
const ROLES_CACHE_TTL = 300000 // 5 minutes in milliseconds
const COOKIE_CACHE_TTL = 300000 // 5 minutes in milliseconds

// Cache for user roles to reduce database queries
const userRolesCache = new Map<string, { roles: Set<string>; timestamp: number }>()
const cookieCache = new Map<string, { value: string; timestamp: number }>()

// Set cookie options for auth
const cookieOptions = {
  name: 'sb-auth-token',
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
}

// Define protected routes and their required roles
const protectedRoutes = {
  '/admin': ['admin'],
  '/profile': ['admin', 'event_manager', 'box_office', 'artist'],
  '/artist': ['admin', 'artist'],
  '/box-office': ['admin', 'box_office', 'event_manager'],
  '/event-manager': ['admin', 'event_manager'],
}

export async function middleware(request: NextRequest) {
  // Create a response object that we can manipulate
  const response = NextResponse.next()
  
  // Create a Supabase client with optimized cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Check if we have a cached cookie value
          const cacheKey = `${request.url}_${name}`
          const cachedCookie = cookieCache.get(cacheKey)
          
          if (cachedCookie && (Date.now() - cachedCookie.timestamp < COOKIE_CACHE_TTL)) {
            return cachedCookie.value
          }
          
          // Get the cookie value from the request
          const cookieValue = request.cookies.get(name)?.value
          
          // Cache the cookie value if it exists
          if (cookieValue) {
            cookieCache.set(cacheKey, { value: cookieValue, timestamp: Date.now() })
          }
          
          return cookieValue
        },
        set(name: string, value: string, options: Record<string, any>) {
          // Update the cookie in the request and response
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
          
          // Update the cache
          const cacheKey = `${request.url}_${name}`
          cookieCache.set(cacheKey, { value, timestamp: Date.now() })
        },
        remove(name: string, options: Record<string, any>) {
          // Remove the cookie from the request and response
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
          
          // Remove from cache
          const cacheKey = `${request.url}_${name}`
          cookieCache.delete(cacheKey)
        },
      },
    }
  )
  
  // Get the path from the request URL early to avoid redundant processing
  const path = request.nextUrl.pathname
  
  // Skip middleware for static assets to improve performance
  if (
    path.startsWith('/_next/') || 
    path.startsWith('/images/') || 
    path.startsWith('/fonts/') || 
    path.includes('.') // Skip files with extensions
  ) {
    return response;
  }
  
  // Get the user directly from the server for better security
  // This is more secure than using getSession() as it validates with the Supabase Auth server
  const { data: { user } } = await supabase.auth.getUser()
  
  // If no validated user, they're not authenticated
  if (!user) {
    // Check if they're trying to access a protected route
    if (path.startsWith('/admin') || 
        path.startsWith('/profile') || 
        path.startsWith('/artist') || 
        path.startsWith('/box-office') || 
        path.startsWith('/event-manager') ||
        path.startsWith('/auth/enhanced-login')) {
      // Always redirect to the standard login page
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    // For non-protected routes, allow access for non-authenticated users
    return response;
  }
  
  // If user is authenticated and trying to access login page, redirect to home
  if (path === '/login' || path === '/auth/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // For protected routes, check role-based access control
  if (path.startsWith('/admin') || 
      path.startsWith('/profile') || 
      path.startsWith('/artist') || 
      path.startsWith('/box-office') || 
      path.startsWith('/event-manager')) {
    
    try {
      // Check if we have cached roles for this user
      const userId = user.id
      const cachedRoles = userRolesCache.get(userId)
      let roles: Set<string>
      
      // Use cached roles if they're still valid
      if (cachedRoles && (Date.now() - cachedRoles.timestamp < ROLES_CACHE_TTL)) {
        roles = cachedRoles.roles
      } else {
        // Fetch user roles with a single query using the correct structure
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', userId)
        
        if (rolesError) {
          console.error('Error fetching user roles:', rolesError)
          // Allow access by default if role fetch fails (graceful degradation)
          return response
        }
        
        // Extract roles from the query result and normalize to lowercase
        roles = new Set((userRoles || []).map(r => r.roles?.name?.toLowerCase() || '').filter(Boolean))
        
        // Cache the roles
        userRolesCache.set(userId, { roles, timestamp: Date.now() })
      }
      
      // Helper function to check if user has a specific role
      const hasRole = (roleName: string): boolean => {
        return roles.has(roleName.toLowerCase())
      }
      
      // Check if user has admin role - this is a common check
      const isAdmin = hasRole('admin')
      const isEventManager = hasRole('event_manager')
      const isBoxOffice = hasRole('box_office')
      const isArtist = hasRole('artist')
      
      // Check role-based access for admin routes
      if (path.startsWith('/admin')) {
        // Special case for event managers to access specific admin routes
        if (isEventManager && (path.startsWith('/admin/events') || path.startsWith('/admin/artists'))) {
          // Allow access
        } else if (!isAdmin) {
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
      }
      
      // Check role-based access for box office routes
      if (path.startsWith('/box-office') && !isAdmin && !isBoxOffice && !isEventManager) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
      
      // Check role-based access for artist routes
      if (path.startsWith('/artist') && !isAdmin && !isArtist) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
      
      // Check role-based access for event manager routes
      if (path.startsWith('/event-manager') && !isAdmin && !isEventManager) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    } catch (error) {
      console.error('Error checking roles for access control:', error)
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
