'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminLink() {
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function checkAdminRole() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        // Fetch user roles
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', session.user.id);
          
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
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-bold text-lg">Admin Access</h3>
      <p className="mb-2">You have administrator privileges</p>
      <div className="space-x-4">
        <Link 
          href="/admin" 
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Main Admin
        </Link>
        <Link 
          href="/simple-admin" 
          className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Simple Admin
        </Link>
      </div>
    </div>
  );
}
