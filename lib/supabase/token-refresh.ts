/**
 * Token refresh mechanism to proactively refresh authentication tokens
 * before they expire to prevent authentication issues
 */

import { createClient } from './client';

// Configuration
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // Refresh token if it expires in less than 5 minutes
const CHECK_INTERVAL_MS = 60 * 1000; // Check token expiry every minute

// Track if we've already set up the refresh mechanism
let isRefreshMechanismSetup = false;

/**
 * Set up automatic token refresh to prevent authentication issues
 * This should be called early in the application lifecycle
 */
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

/**
 * Check if the token needs refreshing and refresh it if needed
 */
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
      console.log(`Auth token expiring soon (${Math.round(timeUntilExpiry / 1000)}s), refreshing...`);
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

/**
 * Manually trigger a token refresh
 * This can be used when encountering authentication errors
 */
export async function forceTokenRefresh(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Failed to force refresh auth token:', error);
      return false;
    }
    
    console.log('Auth token force refreshed successfully');
    return true;
  } catch (error) {
    console.error('Error during force token refresh:', error);
    return false;
  }
}
