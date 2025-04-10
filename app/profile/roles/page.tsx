'use client';

import { useState, useEffect } from 'react';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/client';
import { CheckCircle } from 'lucide-react';

export default function RolesPage() {
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    async function getUserRoles() {
      try {
        // Get authenticated user securely
        const user = await getAuthenticatedUser();
        
        if (!user) {
          window.location.href = '/auth/login';
          return;
        }
        
        // Fetch user roles
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', user.id);
          
        const roleNames = rolesData?.map((role: any) => role.roles?.name) || [];
        setUserRoles(roleNames);
      } catch (error) {
        console.error('Error getting user roles:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getUserRoles();
  }, []);
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4 bg-white dark:bg-gray-900/50 p-8 rounded-lg border dark:border-gray-800 border-gray-200">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-900/50 p-8 rounded-lg border dark:border-gray-800 border-gray-200">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Your Roles & Permissions</h2>
      
      {userRoles.length > 0 ? (
        <ul className="space-y-2">
          {userRoles.map(role => (
            <li key={role} className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="capitalize dark:text-gray-200">{role}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">You don't have any assigned roles yet.</p>
      )}
    </div>
  );
}
