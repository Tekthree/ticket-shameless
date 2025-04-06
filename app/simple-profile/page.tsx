'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SimpleProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  
  useEffect(() => {
    async function getUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/simple-login');
          return;
        }
        
        setUser(session.user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getUserData();
  }, []);
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/simple-login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">Loading profile...</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null; // We're redirecting, no need to render anything
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">User ID</p>
            <p className="font-medium">{user.id}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Last Sign In</p>
            <p className="font-medium">{new Date(user.last_sign_in_at).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="mt-8">
          <button
            onClick={handleSignOut}
            className="w-full p-3 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
