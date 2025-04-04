'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const supabase = createClient();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };
  
  return (
    <header className="bg-white shadow-sm mb-8">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="text-xl font-bold text-gray-800">
              Shameless Admin
            </Link>
            
            <nav className="hidden md:flex space-x-4">
              <Link 
                href="/admin" 
                className={`px-3 py-2 rounded-md ${
                  pathname === '/admin' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/events" 
                className={`px-3 py-2 rounded-md ${
                  pathname === '/admin/events' || pathname.startsWith('/admin/events/') 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Events
              </Link>
              <Link 
                href="/admin/artists" 
                className={`px-3 py-2 rounded-md ${
                  pathname === '/admin/artists' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Artists
              </Link>
              <Link 
                href="/admin/site-content" 
                className={`px-3 py-2 rounded-md ${
                  pathname === '/admin/site-content' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Site Content
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={handleSignOut}
              className="ml-4 px-4 py-2 text-sm text-gray-700 hover:text-indigo-600"
            >
              Sign Out
            </button>
            
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2">
              <Link 
                href="/admin" 
                className={`px-3 py-2 rounded-md ${
                  pathname === '/admin' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/events" 
                className={`px-3 py-2 rounded-md ${
                  pathname === '/admin/events' || pathname.startsWith('/admin/events/') 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Events
              </Link>
              <Link 
                href="/admin/artists" 
                className={`px-3 py-2 rounded-md ${
                  pathname === '/admin/artists' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Artists
              </Link>
              <Link 
                href="/admin/site-content" 
                className={`px-3 py-2 rounded-md ${
                  pathname === '/admin/site-content' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Site Content
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
