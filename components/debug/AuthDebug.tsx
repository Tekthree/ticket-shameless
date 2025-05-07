'use client';

import { useState, useEffect } from 'react';
import { createClient, getAuthenticatedUser, forceSignOut } from '@/lib/supabase/client';

export default function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({
    loading: true,
    user: null,
    error: null,
    sessionChecked: false
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        // Get the Supabase client
        const supabase = createClient();
        
        // Check session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        // Get user
        const user = await getAuthenticatedUser();
        
        // Update debug info
        setDebugInfo({
          loading: false,
          user: user,
          session: sessionData.session,
          sessionError: sessionError,
          sessionChecked: true,
          lastChecked: new Date().toISOString()
        });
        
        // Log for debugging
        console.log('Auth Debug:', {
          user,
          session: sessionData.session,
          sessionError
        });
      } catch (error) {
        console.error('Error in auth debug:', error);
        setDebugInfo({
          loading: false,
          error: error,
          sessionChecked: true,
          lastChecked: new Date().toISOString()
        });
      }
    }
    
    checkAuth();
    
    // Check auth status every 5 seconds
    const interval = setInterval(checkAuth, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 bg-black/80 text-white p-2 text-xs z-50 max-w-xs overflow-auto max-h-40">
      <h3 className="font-bold">Auth Debug</h3>
      {debugInfo.loading ? (
        <p>Loading auth state...</p>
      ) : (
        <>
          <p>User: {debugInfo.user ? '✅ ' + debugInfo.user.email : '❌ Not logged in'}</p>
          <p>Session: {debugInfo.session ? '✅ Valid' : '❌ None'}</p>
          <div className="flex flex-col gap-1 mt-1">
            <button 
              onClick={async () => {
                await forceSignOut();
                window.location.href = '/auth/login';
              }}
              className="bg-red-500 text-white px-2 py-1 text-xs rounded"
            >
              Force Sign Out
            </button>
            <button 
              onClick={() => {
                // Display all storage items for debugging
                const storageItems: Record<string, string | null> = {};
                Object.keys(localStorage).forEach(key => {
                  if (key.startsWith('sb-') || key.includes('supabase')) {
                    storageItems[key] = localStorage.getItem(key);
                  }
                });
                console.log('Supabase localStorage items:', storageItems);
                
                // Display all session items
                const sessionItems: Record<string, string | null> = {};
                Object.keys(sessionStorage).forEach(key => {
                  if (key.startsWith('sb-') || key.includes('supabase')) {
                    sessionItems[key] = sessionStorage.getItem(key);
                  }
                });
                console.log('Supabase sessionStorage items:', sessionItems);
              }}
              className="bg-blue-500 text-white px-2 py-1 text-xs rounded"
            >
              Debug Storage
            </button>
          </div>
        </>
      )}
    </div>
  );
}
