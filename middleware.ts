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
  
  // Get the session from Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // Get the path from the request URL
  const path = request.nextUrl.pathname
  
  // Check if user is trying to access a protected route without being authenticated
  if (path.startsWith('/admin') && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If user is authenticated and trying to access login page, redirect to admin
  if (path.startsWith('/login') && session) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }
  
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
