import { useState, useEffect, useMemo } from 'react';
import { createClient, getAuthenticatedUser, onSecureAuthStateChange, clearCaches } from '@/lib/supabase/optimized-client';
import { useRouter } from 'next/navigation';
import { useSupabaseQuery } from './useSupabaseQuery';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export function useUserProfile() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Fetch the authenticated user
  useEffect(() => {
    async function checkUser() {
      try {
        setIsAuthLoading(true);
        // Clear caches to ensure fresh data
        clearCaches();
        
        const user = await getAuthenticatedUser();
        console.log('useUserProfile: User authenticated:', !!user);
        
        if (user) {
          console.log('useUserProfile: User ID:', user.id);
          setUserId(user.id);
        } else {
          setUserId(null);
        }
      } catch (err) {
        console.error('Error checking authenticated user:', err);
      } finally {
        setIsAuthLoading(false);
      }
    }
    
    checkUser();
    
    // Set up auth state change listener using our secure wrapper
    const { subscription } = onSecureAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          const user = await getAuthenticatedUser();
          setUserId(user?.id || null);
          router.refresh();
        }
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);
  
  // Create a cache key based on the user ID
  const cacheKey = useMemo(() => userId ? `profile_${userId}` : 'no_profile', [userId]);
  
  // Use the optimized query hook to fetch the profile
  const { 
    data: profile, 
    error, 
    isLoading: isProfileLoading,
    refetch 
  } = useSupabaseQuery<UserProfile>(
    async (supabase) => {
      if (!userId) {
        // Skip query if no user ID by returning an empty result
        return { data: null, error: null, count: null, status: 200, statusText: 'OK' };
      }
      
      // Execute the query and return the result
      return await supabase
        .from('profiles')
        .select('id, email, full_name, display_name, avatar_url, bio')
        .eq('id', userId)
        .single();
    },
    cacheKey,
    {
      enabled: !!userId, // Only run the query if we have a user ID
      cacheTime: 60000, // Cache for 1 minute
      staleTime: 30000, // Consider data stale after 30 seconds
      retries: 3
    }
  );
  
  // Combine the loading states
  const isLoading = isAuthLoading || isProfileLoading;
  
  return { 
    profile, 
    isLoading, 
    error,
    refetchProfile: refetch
  };
}
