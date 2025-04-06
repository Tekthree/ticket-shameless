'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import SignOutButton from './SignOutButton';
import { useUserRoles } from '@/hooks/useUserRoles';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

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
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src={logoUrl}
              alt="Shameless Productions"
              width={250}
              height={75}
              className="h-16 w-auto object-contain"
            />
          </Link>
          
          <div className="hidden md:flex space-x-8 items-center">
            <NavLink href="/">
              <Icons.home className="mr-2 h-5 w-5" />
              Home
            </NavLink>
            <NavLink href="/events">
              <Icons.calendar className="mr-2 h-5 w-5" />
              Events
            </NavLink>
            <NavLink href="/#about">
              <Icons.info className="mr-2 h-5 w-5" />
              About
            </NavLink>
            <NavLink href="#contact">
              <Icons.mail className="mr-2 h-5 w-5" />
              Contact
            </NavLink>
            {user ? (
              <>
                <NavLink href="/profile">
                  <Icons.user className="mr-2 h-5 w-5" />
                  Profile
                </NavLink>
                {(isAdmin() || isEventManager() || isBoxOffice() || isArtist()) && (
                  <NavLink href="/admin">
                    <Icons.settings className="mr-2 h-5 w-5" />
                    Dashboard
                  </NavLink>
                )}
                <SignOutButton />
              </>
            ) : (
              <NavLink href="/auth/enhanced-login">
                <Icons.logIn className="mr-2 h-5 w-5" />
                Login
              </NavLink>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white"
          >
            {isMenuOpen ? (
              <Icons.close className="h-6 w-6" />
            ) : (
              <Icons.menu className="h-6 w-6" />
            )}
          </Button>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            <MobileNavLink href="/" onClick={() => setIsMenuOpen(false)}>
              <Icons.home className="mr-2 h-5 w-5" />
              Home
            </MobileNavLink>
            <MobileNavLink href="/events" onClick={() => setIsMenuOpen(false)}>
              <Icons.calendar className="mr-2 h-5 w-5" />
              Events
            </MobileNavLink>
            <MobileNavLink href="/#about" onClick={() => setIsMenuOpen(false)}>
              <Icons.info className="mr-2 h-5 w-5" />
              About
            </MobileNavLink>
            <MobileNavLink href="#contact" onClick={() => setIsMenuOpen(false)}>
              <Icons.mail className="mr-2 h-5 w-5" />
              Contact
            </MobileNavLink>
            {user ? (
              <>
                <MobileNavLink href="/profile" onClick={() => setIsMenuOpen(false)}>
                  <Icons.user className="mr-2 h-5 w-5" />
                  Profile
                </MobileNavLink>
                {(isAdmin() || isEventManager() || isBoxOffice() || isArtist()) && (
                  <MobileNavLink href="/admin" onClick={() => setIsMenuOpen(false)}>
                    <Icons.settings className="mr-2 h-5 w-5" />
                    Dashboard
                  </MobileNavLink>
                )}
                <div className="py-3 px-4">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <MobileNavLink href="/auth/enhanced-login" onClick={() => setIsMenuOpen(false)}>
                <Icons.logIn className="mr-2 h-5 w-5" />
                Login
              </MobileNavLink>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children, className }) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center text-lg hover:text-indigo-300 transition", 
        className
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, onClick, children }) {
  return (
    <Link
      href={href}
      className="flex items-center py-3 px-4 text-lg hover:bg-gray-800 rounded transition"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}