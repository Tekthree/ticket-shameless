'use client';

import { useState, useEffect } from 'react';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/client';
import ProfileNav from '@/components/profile/ProfileNav';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
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
      <div className="container mx-auto py-10 dark:bg-gray-950 bg-white">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white">
      <ProfileNav userRoles={userRoles} />
      
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold dark:text-white text-gray-900">User Profile</h1>
          <Button 
            variant="default" 
            className="bg-red-600 hover:bg-red-700 text-white" 
            onClick={() => router.refresh()}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> 
            Refresh Profile
          </Button>
        </div>
        
        {/* Admin Access */}
        {userRoles.includes('admin') && (
          <div className="mb-8 p-6 bg-blue-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-800 border-gray-200">
            <h2 className="text-xl font-bold mb-2 dark:text-white">Admin Access</h2>
            <p className="mb-4 dark:text-gray-200">You have administrator privileges.</p>
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
}
