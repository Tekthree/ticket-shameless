'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import SignOutButton from './SignOutButton';
import { useUserRoles } from '@/hooks/useUserRoles';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('/images/logo.png'); // Default logo
  const [user, setUser] = useState(null);
  const { isAdmin, isEventManager, isBoxOffice, isArtist } = useUserRoles();
  
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('site_content')
          .select('content')
          .eq('section', 'navigation')
          .eq('field', 'logo')
          .single();
          
        if (data && !error) {
          setLogoUrl(data.content);
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };
    
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    fetchLogo();
    checkUser();
  }, []);

  return (
    <nav className="bg-black text-white shadow-lg">
      <div className="container mx-auto px-4 py-6"> {/* Increased padding for height */}
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src={logoUrl}
              alt="Shameless Productions"
              width={250} /* Increased from 150 */
              height={75} /* Increased from 45 */
              className="h-16 w-auto object-contain" /* Increased from h-10 */
            />
          </Link>
          
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="text-lg hover:text-indigo-300 transition"> {/* Increased text size */}
              Home
            </Link>
            <Link href="/events" className="text-lg hover:text-indigo-300 transition">
              Events
            </Link>
            <Link href="/#about" className="text-lg hover:text-indigo-300 transition">
              About
            </Link>
            <Link href="#contact" className="text-lg hover:text-indigo-300 transition">
              Contact
            </Link>
            {user ? (
              <>
                <Link href="/profile" className="text-lg hover:text-indigo-300 transition">
                  Profile
                </Link>
                {(isAdmin() || isEventManager() || isBoxOffice() || isArtist()) && (
                  <Link href="/admin" className="text-lg hover:text-indigo-300 transition">
                    Dashboard
                  </Link>
                )}
                <SignOutButton />
              </>
            ) : (
              <Link href="/auth/enhanced-login" className="text-lg hover:text-indigo-300 transition">
                Login
              </Link>
            )}
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
            >
              <svg
                className="h-8 w-8" /* Increased from h-6 w-6 */
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3"> {/* Increased spacing */}
            <Link
              href="/"
              className="block py-3 px-4 text-lg hover:bg-gray-800 rounded transition" /* Increased padding and text size */
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/events"
              className="block py-3 px-4 text-lg hover:bg-gray-800 rounded transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/#about"
              className="block py-3 px-4 text-lg hover:bg-gray-800 rounded transition"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="#contact"
              className="block py-3 px-4 text-lg hover:bg-gray-800 rounded transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="block py-3 px-4 text-lg hover:bg-gray-800 rounded transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                {(isAdmin() || isEventManager() || isBoxOffice() || isArtist()) && (
                  <Link
                    href="/admin"
                    className="block py-3 px-4 text-lg hover:bg-gray-800 rounded transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                <div className="py-3 px-4">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <Link
                href="/auth/enhanced-login"
                className="block py-3 px-4 text-lg hover:bg-gray-800 rounded transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
