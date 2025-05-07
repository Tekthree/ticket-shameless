'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getAuthenticatedUser, cachedQuery, createClient } from '@/lib/supabase/optimized-client';
import UserProfileCard from './UserProfileCard';
import { useUserRoles } from '@/hooks/useUserRoles';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('/images/logo.png'); // Default logo
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { isAdmin, isEventManager, isBoxOffice, isArtist } = useUserRoles();
  
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        // Use cachedQuery to reduce redundant requests
        const { data, error } = await cachedQuery<{ content: string }>(
          'site_content',
          async (supabase) => {
            return await supabase
              .from('site_content')
              .select('content')
              .eq('section', 'navigation')
              .eq('field', 'logo')
              .single();
          },
          'navbar_logo',
          300000 // Cache for 5 minutes
        );
          
        if (data && !error) {
          setLogoUrl(data.content);
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };
    
    const checkUser = async () => {
      const authUser = await getAuthenticatedUser();
      setUser(authUser);
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
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6 items-center">
            <NavLink href="/events">
              <Icons.calendar className="mr-2 h-5 w-5" />
              Events
            </NavLink>

            <NavLink href="/#about">
              <Icons.info className="mr-2 h-5 w-5" />
              About
            </NavLink>
            <ThemeToggle />
            <UserProfileCard />
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
            <MobileNavLink href="/events" onClick={() => setIsMenuOpen(false)}>
              <Icons.calendar className="mr-2 h-5 w-5" />
              Events
            </MobileNavLink>
            <MobileNavLink href="/#about" onClick={() => setIsMenuOpen(false)}>
              <Icons.info className="mr-2 h-5 w-5" />
              About
            </MobileNavLink>
            {user ? (
              <>
                <MobileNavLink href="/profile" onClick={() => setIsMenuOpen(false)}>
                  <Icons.user className="mr-2 h-5 w-5" />
                  Profile
                </MobileNavLink>
                <MobileNavLink href="/profile/tickets" onClick={() => setIsMenuOpen(false)}>
                  <Icons.ticket className="mr-2 h-5 w-5" />
                  My Tickets
                </MobileNavLink>
                {(isAdmin() || isEventManager() || isBoxOffice()) && (
                  <MobileNavLink href="/admin" onClick={() => setIsMenuOpen(false)}>
                    <Icons.settings className="mr-2 h-5 w-5" />
                    Admin Dashboard
                  </MobileNavLink>
                )}
                {isArtist() && (
                  <MobileNavLink href="/artist" onClick={() => setIsMenuOpen(false)}>
                    <Icons.music className="mr-2 h-5 w-5" />
                    Artist Portal
                  </MobileNavLink>
                )}
                <MobileNavLink 
                  href="#" 
                  onClick={() => {
                    setIsMenuOpen(false);
                    const supabase = createClient();
                    supabase.auth.signOut().then(() => {
                      router.push('/auth/login');
                      router.refresh();
                    });
                  }}
                >
                  <Icons.logOut className="mr-2 h-5 w-5" />
                  Sign Out
                </MobileNavLink>
              </>
            ) : (
              <MobileNavLink href="/auth/login" onClick={() => setIsMenuOpen(false)}>
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

function NavLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
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

function MobileNavLink({ href, onClick, children }: { href: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center py-3 px-4 text-lg hover:bg-gray-800 rounded transition"
      onClick={(e) => {
        if (href === '#') e.preventDefault();
        if (onClick) onClick();
      }}
    >
      {children}
    </Link>
  );
}