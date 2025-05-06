import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, getAuthenticatedUser, onSecureAuthStateChange, cachedQuery } from '@/lib/supabase/optimized-client';

export type Role = 'admin' | 'event_manager' | 'box_office' | 'artist' | 'guest_list_manager' | 'customer';

export function useUserRoles() {
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [primaryRole, setPrimaryRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  // Create a memoized user ID for stable cache keys
  const [userId, setUserId] = useState<string | null>(null);
  
  // Update userId when authenticated user changes
  useEffect(() => {
    const updateUserId = async () => {
      const user = await getAuthenticatedUser();
      setUserId(user?.id || null);
    };
    
    updateUserId();
  }, []);
  
  // Create cache keys based on user ID
  const userRolesCacheKey = useMemo(() => 
    userId ? `user_roles_${userId}` : 'no_user_roles', 
    [userId]
  );
  
  const profileCacheKey = useMemo(() => 
    userId ? `user_profile_${userId}` : 'no_user_profile', 
    [userId]
  );
  
  useEffect(() => {
    async function fetchUserRoles() {
      try {
        setIsLoading(true);
        
        // Get authenticated user securely
        const user = await getAuthenticatedUser();
        
        if (!user) {
          setRoles([]);
          setPrimaryRole(null);
          setIsLoading(false);
          return;
        }
        
        // Fetch the user's roles with caching
        const { data: userRolesData, error: userRolesError } = await cachedQuery<any[]>(
          'user_roles',
          async (supabase) => {
            return await supabase
              .from('user_roles')
              .select(`
                roles (
                  id,
                  name,
                  description
                )
              `)
              .eq('user_id', user.id);
          },
          userRolesCacheKey,
          300000 // Cache for 5 minutes
        );
          
        if (userRolesError) {
          console.error('Error fetching user roles:', userRolesError);
          throw userRolesError;
        }
        
        // Fetch the user's primary role from profiles with caching
        const { data: profileData, error: profileError } = await cachedQuery<any>(
          'profiles',
          async (supabase) => {
            return await supabase
              .from('profiles')
              .select(`
                primary_role_id,
                roles:primary_role_id (
                  name
                )
              `)
              .eq('id', user.id)
              .single();
          },
          profileCacheKey,
          300000 // Cache for 5 minutes
        );
          
        if (profileError && profileError.code !== 'PGRST116') { // Ignore "not found" errors
          console.error('Error fetching user profile:', profileError);
        }
        
        // Extract role names
        const roleNames = userRolesData && Array.isArray(userRolesData)
          ? userRolesData.map(item => {
              // Handle the nested roles structure
              const role = item.roles as { name: string };
              return role?.name;
            }).filter(Boolean)
          : [];
        
        // Get primary role name safely
        const primaryRoleName = profileData?.roles?.name as string || null;
        
        setRoles(roleNames);
        setPrimaryRole(primaryRoleName);
      } catch (error) {
        console.error('Error in fetchUserRoles:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserRoles();
    
    // Watch for auth state changes using our secure wrapper
    // This uses getAuthenticatedUser() internally for security
    const { subscription } = onSecureAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          fetchUserRoles();
        }
      }
    );
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Helper function to check role case-insensitively
  const hasRoleCaseInsensitive = (roleToCheck: string) => {
    const roleLower = roleToCheck.toLowerCase();
    return roles.some(role => role.toLowerCase() === roleLower);
  };
  
  return { 
    roles, 
    primaryRole,
    isLoading, 
    hasRole: (role: string) => hasRoleCaseInsensitive(role),
    isAdmin: () => hasRoleCaseInsensitive('admin'),
    isEventManager: () => hasRoleCaseInsensitive('event_manager') || hasRoleCaseInsensitive('admin'),
    isBoxOffice: () => hasRoleCaseInsensitive('box_office') || hasRoleCaseInsensitive('admin'),
    isArtist: () => hasRoleCaseInsensitive('artist'),
    isGuestListManager: () => hasRoleCaseInsensitive('guest_list_manager') || hasRoleCaseInsensitive('admin') || hasRoleCaseInsensitive('event_manager'),
    isCustomer: () => hasRoleCaseInsensitive('customer') || roles.length > 0, // Everyone with any role can do customer things
  };
}
