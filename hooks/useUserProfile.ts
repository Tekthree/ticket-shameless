import { useState, useEffect } from 'react';
import { createClient, getAuthenticatedUser, onSecureAuthStateChange } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();
  
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setIsLoading(true);
        
        // Use secure authentication helper
        const user = await getAuthenticatedUser();
        
        if (!user) {
          setProfile(null);
          return;
        }
        
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, display_name, avatar_url, bio')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          throw profileError;
        }
        
        setProfile(data as UserProfile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserProfile();
    
    // Set up auth state change listener using our secure wrapper
    // This uses getAuthenticatedUser() internally for security
    const { subscription } = onSecureAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          fetchUserProfile();
          router.refresh();
        }
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);
  
  
  return { profile, isLoading, error };
}
