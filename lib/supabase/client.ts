import { createBrowserClient } from '@supabase/ssr'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

// Default placeholder values for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export function createClient() {
  try {
    return createBrowserClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'sb-auth-token-' + Math.random().toString(36).substring(2, 10) // Use a unique storage key to prevent conflicts
        }
      }
    )
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    // Return a fallback client that will work for basic operations
    return createBrowserClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    )
  }
}

/**
 * Securely get the authenticated user
 * Uses getUser() instead of getSession() for better security
 * @returns The authenticated user or null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting authenticated user:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Exception getting authenticated user:', error)
    return null
  }
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
  try {
    const supabase = createClient()
    
    // Get the session from storage
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Error getting session:', sessionError)
      return { session: null, user: null }
    }
    
    // Validate the user with the server
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', userError)
      return { session, user: null }
    }
    
    return { session, user }
  } catch (error) {
    console.error('Exception in getSecureSession:', error)
    return { session: null, user: null }
  }
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
      console.log('Auth state change event:', event)
      
      // Instead of using the session from the event, get the validated user
      const user = await getAuthenticatedUser()
      
      // Call the callback with the event and validated user
      callback(event, user)
    }
  )
  
  return { subscription }
}

/**
 * Completely sign out the user and clear all session data
 * This is more thorough than the standard signOut method
 */
export async function forceSignOut(): Promise<void> {
  try {
    const supabase = createClient()
    
    // Standard sign out
    await supabase.auth.signOut({ scope: 'global' })
    
    // Clear any session storage items related to authentication
    if (typeof window !== 'undefined') {
      // Clear all supabase-related items from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear all supabase-related items from sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          sessionStorage.removeItem(key)
        }
      })
      
      // Clear cookies related to authentication
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=').map(c => c.trim())
        if (name.startsWith('sb-') || name.includes('supabase')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
        }
      })
      
      console.log('All Supabase auth data cleared')
    }
  } catch (error) {
    console.error('Error in forceSignOut:', error)
  }
}
