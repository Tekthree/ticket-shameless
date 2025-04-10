import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, getAuthenticatedUser, onSecureAuthStateChange } from '@/lib/supabase/client';

export type Role = 'admin' | 'event_manager' | 'box_office' | 'artist' | 'guest_list_manager' | 'customer';

export function useUserRoles() {
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [primaryRole, setPrimaryRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    async function fetchUserRoles() {
      try {
        // Get authenticated user securely
        const user = await getAuthenticatedUser();
        
        if (!user) {
          setRoles([]);
          setPrimaryRole(null);
          setIsLoading(false);
          return;
        }
        
        // Fetch the user's roles
        const { data: userRolesData, error: userRolesError } = await supabase
          .from('user_roles')
          .select(`
            roles (
              id,
              name,
              description
            )
          `)
          .eq('user_id', user.id);
          
        if (userRolesError) {
          console.error('Error fetching user roles:', userRolesError);
          throw userRolesError;
        }
        
        // Fetch the user's primary role from profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            primary_role_id,
            roles:primary_role_id (
              name
            )
          `)
          .eq('id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') { // Ignore "not found" errors
          console.error('Error fetching user profile:', profileError);
        }
        
        // Extract role names
        const roleNames = userRolesData && Array.isArray(userRolesData)
          ? userRolesData.map(item => item.roles?.name as string).filter(Boolean)
          : [];
        
        setRoles(roleNames);
        setPrimaryRole(profileData?.roles?.name as string || null);
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
  
  return { 
    roles, 
    primaryRole,
    isLoading, 
    hasRole: (role: string) => roles.includes(role),
    isAdmin: () => roles.includes('admin'),
    isEventManager: () => roles.includes('event_manager') || roles.includes('admin'),
    isBoxOffice: () => roles.includes('box_office') || roles.includes('admin'),
    isArtist: () => roles.includes('artist'),
    isGuestListManager: () => roles.includes('guest_list_manager') || roles.includes('admin') || roles.includes('event_manager'),
    isCustomer: () => roles.includes('customer') || roles.length > 0, // Everyone with any role can do customer things
  };
}
