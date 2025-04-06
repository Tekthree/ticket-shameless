'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SimpleAdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadUserData() {
      try {
        // Create Supabase client
        const supabase = createClient();
        
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to get user session');
          return;
        }
        
        if (!session) {
          console.log('No session found');
          setError('Not logged in');
          return;
        }
        
        console.log('User authenticated:', session.user.email);
        setUser(session.user);
        
      } catch (e) {
        console.error('Unhandled error:', e);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, []);
  
  // Simple loading state
  if (loading) {
    return <div className="p-8">Loading admin dashboard...</div>;
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p>{error}</p>
        <div className="mt-4">
          <Link href="/auth/enhanced-login" className="text-blue-500 hover:underline">
            Return to login
          </Link>
        </div>
      </div>
    );
  }
  
  // Not logged in
  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Access Required</h1>
        <p>You need to be logged in to view this page.</p>
        <div className="mt-4">
          <Link href="/auth/enhanced-login" className="text-blue-500 hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }
  
  // Admin dashboard
  return (
    <div className="container mx-auto p-8">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        
        <div className="mb-6">
          <p>Welcome, <span className="font-semibold">{user.email}</span></p>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 border rounded-lg hover:bg-gray-50">
            <h2 className="text-xl font-bold mb-2">User Management</h2>
            <p className="mb-2">Manage user roles and permissions</p>
            <Link href="/admin/users" className="text-blue-500 hover:underline">
              Manage Users →
            </Link>
          </div>
          
          <div className="p-4 border rounded-lg hover:bg-gray-50">
            <h2 className="text-xl font-bold mb-2">Events</h2>
            <p className="mb-2">Manage your events</p>
            <Link href="/admin/events" className="text-blue-500 hover:underline">
              Manage Events →
            </Link>
          </div>
          
          <div className="p-4 border rounded-lg hover:bg-gray-50">
            <h2 className="text-xl font-bold mb-2">Site Content</h2>
            <p className="mb-2">Edit website content</p>
            <Link href="/admin/site-content" className="text-blue-500 hover:underline">
              Edit Content →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
