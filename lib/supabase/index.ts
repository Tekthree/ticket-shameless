/**
 * Supabase client and utilities index file
 * This file exports all Supabase-related functionality from a single entry point
 */

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
