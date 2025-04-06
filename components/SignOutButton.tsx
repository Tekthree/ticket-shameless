'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  
  const handleSignOut = async () => {
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      router.push('/auth/enhanced-login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}
