# Supabase Data Fetching Fixes

This document outlines the fixes implemented to address issues with Supabase data fetching in the Ticket Shameless application.

## Issues Identified

Based on the Supabase logs and code analysis, we identified several issues causing frontend data fetching problems:

1. **Incorrect Query Structure**: The middleware was using an incorrect structure for fetching user roles.
2. **No Error Handling or Retries**: Failed requests weren't being retried, causing cascading failures.
3. **Excessive API Calls**: Multiple identical requests were being made simultaneously.
4. **Caching Issues**: Cache invalidation wasn't properly handled, leading to stale data.
5. **Authentication Token Expiration**: Tokens were expiring without proactive refresh.
6. **Type Safety Issues**: TypeScript errors in Supabase client implementations.

## Implemented Fixes

### 1. Fixed Middleware Query Structure

Updated the user roles query in middleware.ts to use the correct structure:

```typescript
// Before
const { data: userRoles, error: rolesError } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)

// After
const { data: userRoles, error: rolesError } = await supabase
  .from('user_roles')
  .select('roles(name)')
  .eq('user_id', userId)

// Also updated the role extraction logic
// Before
roles = new Set((userRoles || []).map(r => r.role.toLowerCase()))

// After
roles = new Set((userRoles || []).map(r => r.roles?.name?.toLowerCase() || '').filter(Boolean))
```

### 2. Implemented Error Handling and Retries

Created an enhanced client with automatic retries and error handling in `lib/supabase/enhanced-client.ts`:

```typescript
export async function executeWithRetry<T>(
  queryFn: () => any,
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
      // Error handling and retry logic
      // ...
    }
  }
  
  return { data: null, error: new Error(`Query failed after ${MAX_RETRIES} retries`) };
}
```

Added a sleep utility function in `lib/utils.ts`:

```typescript
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 3. Optimized Request Batching

Created a request batching system in `lib/supabase/request-batching.ts` to reduce the number of API calls:

```typescript
export function batchRequest<T>(
  table: string,
  queryFn: (supabase: ReturnType<typeof createClient>) => any
): Promise<{ data: T | null; error: any }> {
  return new Promise((resolve, reject) => {
    // Add request to queue
    batchQueues[table].push({
      table,
      queryFn,
      resolve,
      reject
    });
    
    // Set timeout to process batch
    batchTimeouts[table] = setTimeout(() => {
      processBatch(table);
    }, BATCH_WINDOW_MS);
  });
}
```

Implemented specialized batch functions for common operations:

```typescript
export async function batchTableQueries<T>(
  table: string,
  queryBuilders: Array<(supabase: ReturnType<typeof createClient>) => any>
): Promise<Array<{ data: T | null; error: any }>> {
  // Implementation details
}

export async function batchEventQueries(eventIds: string[]): Promise<Record<string, any>> {
  // Implementation details
}
```

### 4. Improved Cache Invalidation

Enhanced the caching mechanism in the Supabase client:

```typescript
// Cache for user data to reduce redundant requests
let userCache: { user: User | null; timestamp: number } | null = null;
let sessionCache: { session: Session | null; timestamp: number } | null = null;
const USER_CACHE_TTL = 300000; // 5 minutes in milliseconds
const SESSION_CACHE_TTL = 300000; // 5 minutes in milliseconds

// Cache for query results
const queryCache = new Map<string, { data: any; timestamp: number }>();
const QUERY_CACHE_TTL = 30000; // 30 seconds in milliseconds

// Clear caches on auth state changes
export function onSecureAuthStateChange(
  callback: (event: AuthChangeEvent, user: User | null) => void
) {
  const supabase = createClient();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event) => {
      // Clear cache on auth state changes
      userCache = null;
      sessionCache = null;
      queryCache.clear();
      
      // Get the validated user
      const user = await getAuthenticatedUser();
      
      // Call the callback
      callback(event, user);
    }
  );
  
  return { subscription };
}

// Targeted cache invalidation
export function invalidateCache(pattern: RegExp): void {
  for (const key of queryCache.keys()) {
    if (pattern.test(key)) {
      queryCache.delete(key);
    }
  }
}
```

### 5. Added Token Refresh Mechanism

Implemented proactive token refresh in `lib/supabase/token-refresh.ts`:

```typescript
export function setupTokenRefresh() {
  // Prevent multiple setups
  if (isRefreshMechanismSetup) return;
  isRefreshMechanismSetup = true;
  
  console.log('Setting up automatic token refresh mechanism');
  
  // Initial check
  refreshTokenIfNeeded();
  
  // Set up periodic checks
  setInterval(() => {
    refreshTokenIfNeeded();
  }, CHECK_INTERVAL_MS);
  
  // Also refresh on auth state changes
  const supabase = createClient();
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      console.log(`Auth state changed: ${event}`);
    }
  });
}

async function refreshTokenIfNeeded() {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;
    
    // Calculate token expiry time
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    // If token will expire soon, refresh it
    if (timeUntilExpiry < REFRESH_THRESHOLD_MS) {
      console.log(`Auth token expiring soon, refreshing...`);
      const { error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Failed to refresh auth token:', error);
      } else {
        console.log('Auth token refreshed successfully');
      }
    }
  } catch (error) {
    console.error('Error checking token expiry:', error);
  }
}
```

### 6. Enhanced Server-Side Data Fetching

Updated server-side functions with better error handling in `lib/supabase/server-actions.ts`:

```typescript
// Function to fetch site content from the server with retries
export async function fetchSiteContent() {
  'use server';
  
  const supabase = await getServerSideSupabaseClient();
  
  const { data, error } = await executeWithRetry<any[]>(
    () => supabase.from('site_content').select('*'),
    'fetchSiteContent'
  );
  
  // Implementation details
}

// Function to synchronize ticket counts with retries and batching
export async function syncTicketCounts(eventId: string) {
  'use server';
  
  const supabase = await getServerSideSupabaseClient();
  
  try {
    // Use batch queries to get orders and event data in parallel
    const [ordersResult, eventResult] = await batchQueries<any>([
      {
        queryFn: () => supabase
          .from('orders')
          .select('quantity')
          .eq('event_id', eventId)
          .eq('status', 'completed'),
        queryName: 'getOrderQuantities'
      },
      {
        queryFn: () => supabase
          .from('events')
          .select('tickets_total')
          .eq('id', eventId)
          .single(),
        queryName: 'getEventDetails'
      }
    ]);
    
    // Implementation details
  } catch (err) {
    console.error('Exception in syncTicketCounts:', err);
    return { success: false, error: String(err) };
  }
}
```

### 7. Created Centralized Exports

Added an index file (`lib/supabase/index.ts`) to provide a single entry point for all Supabase functionality:

```typescript
// Re-export client functions
export { 
  createClient,
  getAuthenticatedUser,
  isAuthenticated,
  getSecureSession,
  onSecureAuthStateChange
} from './enhanced-client';

// Re-export server functions
export {
  executeWithRetry,
  batchQueries
} from './server';

// Re-export server actions
export {
  fetchSiteContent,
  syncTicketCounts,
  fetchEventArtists,
  batchFetchEvents
} from './server-actions';

// Re-export token refresh
export {
  setupTokenRefresh,
  forceTokenRefresh
} from './token-refresh';

// Re-export request batching
export {
  batchRequest,
  batchTableQueries,
  batchEventQueries
} from './request-batching';

// Initialize token refresh mechanism
import { setupTokenRefresh } from './token-refresh';

// Set up token refresh if we're in the browser environment
if (typeof window !== 'undefined') {
  setupTokenRefresh();
}
```

## Implementation Guide

To implement these fixes in your project:

1. **Update Middleware Query Structure**:
   - Modify the user roles query in `middleware.ts` to use `select('roles(name)')` instead of `select('role')`
   - Update the role extraction logic accordingly

2. **Add Error Handling and Retries**:
   - Add the `sleep` utility function to `lib/utils.ts`
   - Create the `enhanced-client.ts` file with retry logic
   - Update server-side functions to use the retry mechanism

3. **Implement Request Batching**:
   - Create the `request-batching.ts` file
   - Use batching for related queries to reduce API calls

4. **Improve Cache Invalidation**:
   - Update the caching mechanism in the Supabase client
   - Add proper cache invalidation on auth state changes

5. **Add Token Refresh Mechanism**:
   - Create the `token-refresh.ts` file
   - Initialize the token refresh mechanism early in the application lifecycle

6. **Update Server-Side Data Fetching**:
   - Modify server actions to use the enhanced query functions
   - Add proper TypeScript typing for better error detection

7. **Create Centralized Exports**:
   - Create the `index.ts` file to export all Supabase functionality
   - Update imports across the application to use the centralized exports

## Benefits

These changes provide several benefits:

1. **Improved Reliability**: Automatic retries ensure temporary network issues don't cause failures
2. **Reduced API Calls**: Request batching minimizes the number of separate API calls
3. **Better Performance**: Caching with proper invalidation improves response times
4. **Prevented Authentication Issues**: Proactive token refresh prevents auth-related errors
5. **Enhanced Debugging**: Better error logging helps identify and fix issues
6. **Type Safety**: Improved TypeScript typing catches errors at compile time
7. **Simplified Imports**: Centralized exports make it easier to use Supabase functionality

## Monitoring and Maintenance

To ensure these fixes continue to work effectively:

1. **Monitor Error Logs**: Watch for any patterns in error logs that might indicate new issues
2. **Check Network Traffic**: Periodically review network traffic to ensure batching is working
3. **Update TTL Values**: Adjust cache TTL values based on application needs
4. **Review Token Refresh**: Ensure token refresh is working correctly, especially after Supabase updates
5. **Keep Dependencies Updated**: Regularly update Supabase client libraries to get the latest fixes

By implementing these fixes, the application should have significantly more reliable data fetching from Supabase, resulting in a better user experience.
