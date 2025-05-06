import { createBrowserClient } from '@supabase/ssr'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { sleep } from '../utils'

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

// Request tracking for debugging
const requestLog: Array<{
  timestamp: number;
  method: string;
  path: string;
  success: boolean;
  duration: number;
  retries?: number;
}> = [];

// Maximum number of request log entries to keep
const MAX_REQUEST_LOG_SIZE = 100;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500; // Start with 500ms delay
const RETRY_BACKOFF_FACTOR = 1.5; // Increase delay by this factor for each retry

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}

/**
 * Securely get the authenticated user with caching, request deduplication, and retries
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
    const startTime = Date.now();
    let retries = 0;
    
    try {
      while (retries <= MAX_RETRIES) {
        try {
          const supabase = createClient();
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error) throw error;
          
          // Update the cache
          userCache = { user, timestamp: Date.now() };
          
          // Log successful request
          logRequest('GET', '/auth/user', true, Date.now() - startTime, retries);
          
          return user;
        } catch (error) {
          if (retries === MAX_RETRIES) {
            // Log failed request on final retry
            logRequest('GET', '/auth/user', false, Date.now() - startTime, retries);
            console.error(`Failed to fetch authenticated user after ${MAX_RETRIES} retries:`, error);
            throw error;
          }
          
          // Calculate exponential backoff delay
          const delay = RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_FACTOR, retries);
          console.warn(`Retrying getAuthenticatedUser (${retries + 1}/${MAX_RETRIES}) after ${delay}ms`);
          await sleep(delay);
          retries++;
        }
      }
      
      return null;
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
 * Get the current session securely with caching, request deduplication, and retries
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
    const startTime = Date.now();
    let retries = 0;
    
    try {
      while (retries <= MAX_RETRIES) {
        try {
          const supabase = createClient();
          
          // Get the session from storage
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) throw sessionError;
          
          // Update session cache
          sessionCache = { session, timestamp: Date.now() };
          
          // Get the user (will use cached user if available)
          const user = await getAuthenticatedUser();
          
          // Log successful request
          logRequest('GET', '/auth/session', true, Date.now() - startTime, retries);
          
          return { session, user };
        } catch (error) {
          if (retries === MAX_RETRIES) {
            // Log failed request on final retry
            logRequest('GET', '/auth/session', false, Date.now() - startTime, retries);
            console.error(`Failed to fetch secure session after ${MAX_RETRIES} retries:`, error);
            throw error;
          }
          
          // Calculate exponential backoff delay
          const delay = RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_FACTOR, retries);
          console.warn(`Retrying getSecureSession (${retries + 1}/${MAX_RETRIES}) after ${delay}ms`);
          await sleep(delay);
          retries++;
        }
      }
      
      return { session: null, user: null };
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
      sessionCache = null;
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
 * Execute a Supabase query with automatic retries and error handling
 * @param queryFn Function that executes the Supabase query
 * @param queryName Name of the query for logging
 * @returns The query result
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  queryName: string
): Promise<{ data: T | null; error: any }> {
  const startTime = Date.now();
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      const result = await queryFn();
      
      if (result.error) {
        if (retries === MAX_RETRIES) {
          // Log failed request on final retry
          logRequest('QUERY', queryName, false, Date.now() - startTime, retries);
          console.error(`Query "${queryName}" failed after ${MAX_RETRIES} retries:`, result.error);
          return result;
        }
        
        // Calculate exponential backoff delay
        const delay = RETRY_DELAY_MS * Math.pow(RETRY_BACKOFF_FACTOR, retries);
        console.warn(`Retrying query "${queryName}" (${retries + 1}/${MAX_RETRIES}) after ${delay}ms`);
        await sleep(delay);
        retries++;
      } else {
        // Log successful request
        logRequest('QUERY', queryName, true, Date.now() - startTime, retries);
        return result;
      }
    } catch (error) {
      if (retries === MAX_RETRIES) {
        // Log failed request on final retry
        logRequest('QUERY', queryName, false, Date.now() - startTime, retries);
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
 * Optimized query function with caching and retries
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
  
  // Execute the query with retries
  const supabase = createClient();
  const result = await executeWithRetry<T>(
    () => query(supabase),
    `${table}:${cacheKey}`
  );
  
  // Cache the result if there's no error
  if (!result.error && result.data) {
    queryCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
  }
  
  return result;
}

/**
 * Batch multiple queries into a single request to reduce network overhead
 * @param queries Array of query functions to execute
 * @returns Array of query results in the same order
 */
export async function batchQueries<T>(
  queries: Array<{
    queryFn: (supabase: ReturnType<typeof createClient>) => Promise<{ data: T | null; error: any }>,
    queryName: string
  }>
): Promise<Array<{ data: T | null; error: any }>> {
  const supabase = createClient();
  const startTime = Date.now();
  
  try {
    // Execute all queries in parallel
    const results = await Promise.all(
      queries.map(({ queryFn, queryName }) => 
        executeWithRetry<T>(() => queryFn(supabase), queryName)
      )
    );
    
    // Log the batch operation
    logRequest('BATCH', `Batch of ${queries.length} queries`, true, Date.now() - startTime);
    
    return results;
  } catch (error) {
    console.error('Error in batch query execution:', error);
    logRequest('BATCH', `Batch of ${queries.length} queries`, false, Date.now() - startTime);
    
    // Return error for all queries
    return queries.map(() => ({ data: null, error }));
  }
}

/**
 * Invalidate specific cache entries by key pattern
 * @param pattern Regular expression pattern to match cache keys
 */
export function invalidateCache(pattern: RegExp): void {
  for (const key of queryCache.keys()) {
    if (pattern.test(key)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Clear all caches
 */
export function clearCaches() {
  userCache = null;
  sessionCache = null;
  queryCache.clear();
  console.log('All caches cleared');
}

/**
 * Log a request for debugging purposes
 */
function logRequest(
  method: string,
  path: string,
  success: boolean,
  duration: number,
  retries?: number
) {
  // Add to the beginning of the array (most recent first)
  requestLog.unshift({
    timestamp: Date.now(),
    method,
    path,
    success,
    duration,
    retries
  });
  
  // Trim the log if it exceeds the maximum size
  if (requestLog.length > MAX_REQUEST_LOG_SIZE) {
    requestLog.length = MAX_REQUEST_LOG_SIZE;
  }
}

/**
 * Get the request log for debugging
 */
export function getRequestLog() {
  return [...requestLog];
}

/**
 * Proactively refresh the auth token before it expires
 * @param refreshThresholdMs Time in milliseconds before expiry to refresh the token
 */
export async function setupTokenRefresh(refreshThresholdMs = 5 * 60 * 1000) {
  const supabase = createClient();
  
  // Initial check
  await refreshTokenIfNeeded(refreshThresholdMs);
  
  // Set up periodic checks
  setInterval(async () => {
    await refreshTokenIfNeeded(refreshThresholdMs);
  }, 60 * 1000); // Check every minute
  
  // Also refresh on auth state changes
  supabase.auth.onAuthStateChange(async (event) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // Clear caches when auth state changes
      clearCaches();
    }
  });
}

/**
 * Refresh the token if it's close to expiring
 * @param refreshThresholdMs Time in milliseconds before expiry to refresh the token
 */
async function refreshTokenIfNeeded(refreshThresholdMs: number) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;
    
    // Calculate token expiry time
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    // If token will expire soon, refresh it
    if (timeUntilExpiry < refreshThresholdMs) {
      console.log('Auth token expiring soon, refreshing...');
      const { error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Failed to refresh auth token:', error);
      } else {
        console.log('Auth token refreshed successfully');
        // Clear caches after token refresh
        clearCaches();
      }
    }
  } catch (error) {
    console.error('Error checking token expiry:', error);
  }
}
