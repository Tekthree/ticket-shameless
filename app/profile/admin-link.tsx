'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Settings } from 'lucide-react';

export default function AdminLink() {
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function checkAdminRole() {
      try {
        const supabase = createClient();
        // Get authenticated user securely
        const user = await getAuthenticatedUser();
        
        if (!user) return;
        
        // Fetch user roles
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', user.id);
          
        const roleNames = rolesData?.map((role: any) => role.roles?.name) || [];
        setHasAdminRole(roleNames.includes('admin'));
      } catch (error) {
        console.error('Error checking admin role:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAdminRole();
  }, []);
  
  if (isLoading || !hasAdminRole) return null;
  
  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
      <h3 className="font-bold text-lg dark:text-white">Admin Access</h3>
      <p className="mb-2 dark:text-gray-200">You have administrator privileges</p>
      <div className="space-x-4">
        <Button variant="default" asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/admin">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Main Admin
          </Link>
        </Button>
        <Button variant="default" asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/simple-admin">
            <Settings className="h-4 w-4 mr-2" />
            Simple Admin
          </Link>
        </Button>
      </div>
    </div>
  );
}
