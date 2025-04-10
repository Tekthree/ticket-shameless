import { createBrowserClient } from '@supabase/ssr'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

// Default placeholder values for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}

/**
 * Securely get the authenticated user
 * Uses getUser() instead of getSession() for better security
 * @returns The authenticated user or null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Securely check if a user is authenticated
 * @returns True if the user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser()
  return !!user
}

/**
 * Get the current session securely
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

/**
 * Securely handle auth state changes
 * This is a wrapper around onAuthStateChange that uses getUser() for validation
 * @param callback A callback function that receives the event and validated user
 * @returns An object containing the subscription that can be unsubscribed
 */
export function onSecureAuthStateChange(
  callback: (event: AuthChangeEvent, user: User | null) => void
) {
  const supabase = createClient()
  
  // Set up the auth state change listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event) => {
      // Instead of using the session from the event, get the validated user
      const user = await getAuthenticatedUser()
      
      // Call the callback with the event and validated user
      callback(event, user)
    }
  )
  
  return { subscription }
}
