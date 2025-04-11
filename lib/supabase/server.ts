import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User, Session } from '@supabase/supabase-js'

// Default placeholder values for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export function createClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // Remove setting cookies in server components, only read cookies
        set() {},
        remove() {}
      },
    }
  )
}

/**
 * Securely get the authenticated user on the server
 * Uses getUser() instead of getSession() for better security
 * @returns The authenticated user or null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Securely check if a user is authenticated on the server
 * @returns True if the user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser()
  return !!user
}

/**
 * Get the current session securely on the server
 * This is a secure wrapper around getSession() that also validates the user with getUser()
 * @returns An object containing the session and authenticated user
 */
export async function getSecureSession(): Promise<{ session: Session | null; user: User | null }> {
  const supabase = createClient()
  
  // Get the session from storage
  const { data: { session } } = await supabase.auth.getSession()
  
  // Validate the user with the server
  const { data: { user } } = await supabase.auth.getUser()
  
  return { session, user }
}
