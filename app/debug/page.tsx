'use client';

import { useState, useEffect } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';
import Link from 'next/link';

export default function DebugPage() {
  const { roles, primaryRole, isLoading, hasRole, isAdmin, isEventManager } = useUserRoles();
  const [apiRoles, setApiRoles] = useState<any>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchRolesFromApi = async () => {
    setIsApiLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug-roles');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setApiRoles(data);
    } catch (err) {
      console.error('Error fetching roles from API:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsApiLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRolesFromApi();
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Role Debug Page</h1>
      
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Client-Side Role Information</h2>
        {isLoading ? (
          <p>Loading client roles...</p>
        ) : (
          <div>
            <p className="mb-2"><strong>Detected Roles:</strong> {roles.length ? roles.join(', ') : 'No roles found'}</p>
            <p className="mb-2"><strong>Primary Role:</strong> {primaryRole || 'Not set'}</p>
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Role Checks:</h3>
              <ul className="list-disc pl-6">
                <li>Admin: {isAdmin() ? 'Yes' : 'No'}</li>
                <li>Event Manager: {isEventManager() ? 'Yes' : 'No'}</li>
                <li>Has 'event_manager' role: {hasRole('event_manager') ? 'Yes' : 'No'}</li>
                <li>Has 'EVENT_MANAGER' role: {hasRole('EVENT_MANAGER') ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Server-Side Role Information</h2>
        {isApiLoading ? (
          <p>Loading server roles...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : apiRoles ? (
          <div>
            <p className="mb-2"><strong>Authenticated:</strong> {apiRoles.authenticated ? 'Yes' : 'No'}</p>
            {apiRoles.authenticated && (
              <>
                <p className="mb-2"><strong>User ID:</strong> {apiRoles.user?.id}</p>
                <p className="mb-2"><strong>User Email:</strong> {apiRoles.user?.email}</p>
                <p className="mb-2"><strong>Roles:</strong> {apiRoles.roles?.length ? apiRoles.roles.join(', ') : 'No roles found'}</p>
                <p className="mb-2"><strong>Primary Role:</strong> {apiRoles.primaryRole || 'Not set'}</p>
                
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Raw Role Data:</h3>
                  <pre className="bg-gray-200 p-4 rounded overflow-x-auto">
                    {JSON.stringify(apiRoles.rawRoleData, null, 2)}
                  </pre>
                </div>
                
                {apiRoles.profile && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Profile Data:</h3>
                    <pre className="bg-gray-200 p-4 rounded overflow-x-auto">
                      {JSON.stringify(apiRoles.profile, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <p>No API data available</p>
        )}
        <button 
          onClick={fetchRolesFromApi} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh API Data
        </button>
      </div>
      
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Access Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/admin" 
            className="p-4 border rounded text-center hover:bg-gray-200 transition-colors"
          >
            Test Admin Dashboard Access
          </Link>
          <Link 
            href="/admin/events" 
            className="p-4 border rounded text-center hover:bg-gray-200 transition-colors"
          >
            Test Events Management Access
          </Link>
          <Link 
            href="/admin/artists" 
            className="p-4 border rounded text-center hover:bg-gray-200 transition-colors"
          >
            Test Artists Management Access
          </Link>
          <Link 
            href="/admin/tickets" 
            className="p-4 border rounded text-center hover:bg-gray-200 transition-colors"
          >
            Test Tickets Management Access
          </Link>
          <Link 
            href="/box-office" 
            className="p-4 border rounded text-center hover:bg-gray-200 transition-colors"
          >
            Test Box Office Access
          </Link>
          <Link 
            href="/artist/dashboard" 
            className="p-4 border rounded text-center hover:bg-gray-200 transition-colors"
          >
            Test Artist Dashboard Access
          </Link>
        </div>
      </div>
      
      <Link 
        href="/" 
        className="inline-block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}