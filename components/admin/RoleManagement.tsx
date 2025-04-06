'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import toast from 'react-hot-toast';

export default function RoleManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useUserRoles();
  const supabase = createClient();
  
  useEffect(() => {
    async function loadData() {
      if (!isAdmin()) {
        return;
      }
      
      setIsLoading(true);
      try {
        // Load all roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .order('name');
          
        if (rolesError) throw rolesError;
        
        // Load all users with their roles
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            primary_role_id,
            user_roles!left(
              role_id
            )
          `);
          
        if (usersError) throw usersError;
        
        setRoles(rolesData || []);
        setUsers(usersData || []);
      } catch (error) {
        console.error('Error loading user and role data:', error);
        toast.error('Failed to load users and roles');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Toggle a role for a user
  async function toggleRole(userId: string, roleId: number) {
    try {
      // Check if user already has this role
      const user = users.find(u => u.id === userId);
      const hasRole = user?.user_roles?.some((ur: any) => ur.role_id === roleId);
      
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
      
      // Refresh the users data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          primary_role_id,
          user_roles!left(
            role_id
          )
        `);
        
      if (error) throw error;
      
      setUsers(data || []);
      toast.success('User roles updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    }
  }
  
  // Set primary role for a user
  async function setPrimaryRole(userId: string, roleId: number) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ primary_role_id: roleId })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, primary_role_id: roleId } : user
      ));
      
      toast.success('Primary role updated successfully');
    } catch (error) {
      console.error('Error setting primary role:', error);
      toast.error('Failed to update primary role');
    }
  }
  
  if (!isAdmin()) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Unauthorized</h2>
        <p className="mt-2">You don't have permission to manage user roles.</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Loading...</h2>
        <div className="mt-4 space-y-2">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Role Management</h1>
      
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Primary Role
              </th>
              {roles.map(role => (
                <th key={role.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name || 'No Name'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select 
                    value={user.primary_role_id || ''} 
                    onChange={(e) => setPrimaryRole(user.id, Number(e.target.value))}
                    className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">No Primary Role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
                {roles.map(role => {
                  const hasRole = user.user_roles?.some((ur: any) => ur.role_id === role.id);
                  
                  return (
                    <td key={role.id} className="px-6 py-4 whitespace-nowrap text-center">
                      <input 
                        type="checkbox" 
                        checked={hasRole || false}
                        onChange={() => toggleRole(user.id, role.id)}
                        className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
