import { createBrowserClient } from '@supabase/ssr'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

// Default placeholder values for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Cache for user data to reduce redundant requests
let userCache: { user: User | null; timestamp: number } | null = null;
let sessionCache: { session: Session | null; timestamp: number } | null = null;
const USER_CACHE_TTL = 300000; // 5 minutes in milliseconds
const SESSION_CACHE_TTL = 300000; // 5 minutes in milliseconds

// Flags to track if we're currently fetching data to prevent duplicate requests
let isFetchingUser = false;
let userFetchPromise: Promise<User | null> | null = null;
let isFetchingSession = false;
let sessionFetchPromise: Promise<{ session: Session | null; user: User | null }> | null = null;

// Cache for query results
const queryCache = new Map<string, { data: any; timestamp: number }>();
const QUERY_CACHE_TTL = 30000; // 30 seconds in milliseconds

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}

/**
 * Securely get the authenticated user with caching and request deduplication
 * Uses getUser() instead of getSession() for better security
 * @returns The authenticated user or null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  // Check if we have a valid cached user
  if (userCache && (Date.now() - userCache.timestamp < USER_CACHE_TTL)) {
    return userCache.user;
  }
  
  // If we're already fetching the user, return the existing promise to prevent duplicate requests
  if (isFetchingUser && userFetchPromise) {
    return userFetchPromise;
  }
  
  // Set the fetching flag and create a new promise
  isFetchingUser = true;
  userFetchPromise = (async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update the cache
      userCache = { user, timestamp: Date.now() };
      return user;
    } catch (error) {
      console.error('Error fetching authenticated user:', error);
      return null;
    } finally {
      // Reset the fetching flag
      isFetchingUser = false;
      userFetchPromise = null;
    }
  })();
  
  return userFetchPromise;
}

/**
 * Securely check if a user is authenticated
 * @returns True if the user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return !!user;
}

/**
 * Get the current session securely with caching and request deduplication
 * This is a secure wrapper around getSession() that also validates the user with getUser()
 * @returns An object containing the session and authenticated user
 */
export async function getSecureSession(): Promise<{ session: Session | null; user: User | null }> {
  // Check if we have valid cached session and user
  if (sessionCache && userCache && 
      (Date.now() - sessionCache.timestamp < SESSION_CACHE_TTL) && 
      (Date.now() - userCache.timestamp < USER_CACHE_TTL)) {
    return { session: sessionCache.session, user: userCache.user };
  }
  
  // If we're already fetching the session, return the existing promise to prevent duplicate requests
  if (isFetchingSession && sessionFetchPromise) {
    return sessionFetchPromise;
  }
  
  // Set the fetching flag and create a new promise
  isFetchingSession = true;
  sessionFetchPromise = (async () => {
    try {
      const supabase = createClient();
      
      // Get the session from storage
      const { data: { session } } = await supabase.auth.getSession();
      
      // Update session cache
      sessionCache = { session, timestamp: Date.now() };
      
      // Get the user (will use cached user if available)
      const user = await getAuthenticatedUser();
      
      return { session, user };
    } catch (error) {
      console.error('Error fetching secure session:', error);
      return { session: null, user: null };
    } finally {
      // Reset the fetching flag
      isFetchingSession = false;
      sessionFetchPromise = null;
    }
  })();
  
  return sessionFetchPromise;
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
  const supabase = createClient();
  
  // Set up the auth state change listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event) => {
      // Clear cache on auth state changes
      userCache = null;
      queryCache.clear();
      
      // Instead of using the session from the event, get the validated user
      const user = await getAuthenticatedUser();
      
      // Call the callback with the event and validated user
      callback(event, user);
    }
  );
  
  return { subscription };
}

/**
 * Optimized query function with caching
 * @param table The table to query
 * @param query The query function
 * @param cacheKey A unique key for caching
 * @param ttl Optional custom TTL in milliseconds
 * @returns The query result
 */
export async function cachedQuery<T>(
  table: string,
  query: (supabase: ReturnType<typeof createClient>) => Promise<{ data: T | null; error: any }>,
  cacheKey: string,
  ttl: number = QUERY_CACHE_TTL
): Promise<{ data: T | null; error: any }> {
  // Check if we have a valid cached result
  const cacheEntry = queryCache.get(cacheKey);
  if (cacheEntry && (Date.now() - cacheEntry.timestamp < ttl)) {
    return { data: cacheEntry.data, error: null };
  }
  
  // Execute the query
  const supabase = createClient();
  const result = await query(supabase);
  
  // Cache the result if there's no error
  if (!result.error && result.data) {
    queryCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
  }
  
  return result;
}

/**
 * Clear all caches
 */
export function clearCaches() {
  userCache = null;
  queryCache.clear();
}
