'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  
  useEffect(() => {
    async function loadData() {
      try {
        // Check authentication
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          setError('You need to be logged in');
          return;
        }
        
        console.log('User authenticated:', data.user.email);
        
        // Load all roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .order('name');
          
        if (rolesError) {
          console.error('Error loading roles:', rolesError);
          setError('Failed to load roles');
          return;
        }
        
        console.log('Roles loaded:', rolesData?.length || 0);
        setRoles(rolesData || []);
        
        // Load all users from profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) {
          console.error('Error loading profiles:', profilesError);
          setError('Failed to load users');
          return;
        }
        
        console.log('Profiles loaded:', profilesData?.length || 0);
        
        // For each user, get their roles
        const usersWithRoles = await Promise.all(profilesData.map(async (profile) => {
          try {
            const { data: userRolesData } = await supabase
              .from('user_roles')
              .select('role_id')
              .eq('user_id', profile.id);
              
            return {
              ...profile,
              roleIds: userRolesData?.map(ur => ur.role_id) || []
            };
          } catch (error) {
            console.error(`Error fetching roles for user ${profile.id}:`, error);
            return {
              ...profile,
              roleIds: []
            };
          }
        }));
        
        setUsers(usersWithRoles);
        console.log('Users with roles:', usersWithRoles);
        
      } catch (e) {
        console.error('Unhandled error:', e);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Function to get role name from ID
  const getRoleName = (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'Unknown';
  };
  
  // Function to toggle a role for a user
  const toggleRole = async (userId: string, roleId: number, hasRole: boolean) => {
    try {
      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role_id', roleId);
          
        if (error) throw error;
      } else {
        // Add role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role_id: roleId });
          
        if (error) throw error;
      }
      
      // Update UI
      setUsers(users.map(user => {
        if (user.id === userId) {
          const roleIds = hasRole 
            ? user.roleIds.filter((id: number) => id !== roleId)
            : [...user.roleIds, roleId];
          return { ...user, roleIds };
        }
        return user;
      }));
      
    } catch (error) {
      console.error('Error toggling role:', error);
      alert('Failed to update role');
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-4">{error}</p>
        <Link href="/simple-admin" className="text-blue-500 hover:underline">
          Return to Admin Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Link 
          href="/simple-admin" 
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  {roles.map(role => (
                    <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.full_name || 'No Name'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    
                    {roles.map(role => {
                      const hasRole = user.roleIds?.includes(role.id);
                      
                      return (
                        <td key={role.id} className="px-6 py-4 whitespace-nowrap text-center">
                          <input 
                            type="checkbox" 
                            checked={hasRole || false}
                            onChange={() => toggleRole(user.id, role.id, hasRole)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
