import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User, Session } from '@supabase/supabase-js'
import { sleep } from '../utils'

// Default placeholder values for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500; // Start with 500ms delay
const RETRY_BACKOFF_FACTOR = 1.5; // Increase delay by this factor for each retry

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
 * Securely get the authenticated user on the server with retries
 * Uses getUser() instead of getSession() for better security
 * @returns The authenticated user or null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }
      
      return user;
    } catch (error) {
      if (retries === MAX_RETRIES) {
        console.error(`Failed to fetch authenticated user after ${MAX_RETRIES} retries:`, error);
        return null;
      }
      
      // Calculate exponential backoff delay
      const delay = RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_FACTOR, retries);
      console.warn(`Retrying getAuthenticatedUser (${retries + 1}/${MAX_RETRIES}) after ${delay}ms`);
      await sleep(delay);
      retries++;
    }
  }
  
  return null;
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
 * Get the current session securely on the server with retries
 * This is a secure wrapper around getSession() that also validates the user with getUser()
 * @returns An object containing the session and authenticated user
 */
export async function getSecureSession(): Promise<{ session: Session | null; user: User | null }> {
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      const supabase = createClient();
      
      // Get the session from storage
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      // Get the user with retries (handled by getAuthenticatedUser)
      const user = await getAuthenticatedUser();
      
      return { session, user };
    } catch (error) {
      if (retries === MAX_RETRIES) {
        console.error(`Failed to fetch secure session after ${MAX_RETRIES} retries:`, error);
        return { session: null, user: null };
      }
      
      // Calculate exponential backoff delay
      const delay = RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_FACTOR, retries);
      console.warn(`Retrying getSecureSession (${retries + 1}/${MAX_RETRIES}) after ${delay}ms`);
      await sleep(delay);
      retries++;
    }
  }
  
  return { session: null, user: null };
}

/**
 * Execute a Supabase query with automatic retries and error handling
 * @param queryFn Function that executes the Supabase query
 * @param queryName Name of the query for logging
 * @returns The query result
 */
export async function executeWithRetry<T>(
  queryFn: () => any, // Accept any Supabase query builder
  queryName: string
): Promise<{ data: T | null; error: any }> {
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      const result = await queryFn();
      
      if (result.error) {
        if (retries === MAX_RETRIES) {
          console.error(`Query "${queryName}" failed after ${MAX_RETRIES} retries:`, result.error);
          return result;
        }
        
        // Calculate exponential backoff delay
        const delay = RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_FACTOR, retries);
        console.warn(`Retrying query "${queryName}" (${retries + 1}/${MAX_RETRIES}) after ${delay}ms`);
        await sleep(delay);
        retries++;
      } else {
        return result;
      }
    } catch (error) {
      if (retries === MAX_RETRIES) {
        console.error(`Query "${queryName}" failed with exception after ${MAX_RETRIES} retries:`, error);
        return { data: null, error };
      }
      
      // Calculate exponential backoff delay
      const delay = RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_FACTOR, retries);
      console.warn(`Retrying query "${queryName}" after exception (${retries + 1}/${MAX_RETRIES}) after ${delay}ms`);
      await sleep(delay);
      retries++;
    }
  }
  
  // This should never be reached due to the return in the final retry
  return { data: null, error: new Error(`Query "${queryName}" failed after ${MAX_RETRIES} retries`) };
}

/**
 * Batch multiple queries into a single request to reduce network overhead
 * @param queries Array of query functions to execute
 * @returns Array of query results in the same order
 */
export async function batchQueries<T>(
  queries: Array<{
    queryFn: () => any, // Accept any Supabase query builder
    queryName: string
  }>
): Promise<Array<{ data: T | null; error: any }>> {
  try {
    // Execute all queries in parallel
    const results = await Promise.all(
      queries.map(({ queryFn, queryName }) => 
        executeWithRetry<T>(queryFn, queryName)
      )
    );
    
    return results;
  } catch (error) {
    console.error('Error in batch query execution:', error);
    
    // Return error for all queries
    return queries.map(() => ({ data: null, error }));
  }
}
