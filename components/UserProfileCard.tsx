'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient, getAuthenticatedUser, clearCaches } from '@/lib/supabase/optimized-client';
import { useRouter } from 'next/navigation';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useUserProfile } from '@/hooks/useUserProfile';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

export default function UserProfileCard() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [userName, setUserName] = useState<string>('');
  const [userInitial, setUserInitial] = useState<string>('?');
  
  // Refresh role status when the profile changes
  useEffect(() => {
    if (profile) {
      setUserName(profile.display_name || profile.full_name || 'User');
      
      const initial = profile.display_name?.[0] || 
                     profile.full_name?.[0] || 
                     profile.email?.[0] || 
                     '?';
      setUserInitial(initial.toUpperCase());
    }
  }, [profile]);
  const { isAdmin, isEventManager, isBoxOffice, isArtist } = useUserRoles();
  
  // Refresh role status with this effect
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [hasArtistAccess, setHasArtistAccess] = useState(false);
  
  useEffect(() => {
    // Force clear any stale caches when component mounts
    clearCaches();
    
    // Check authentication status directly
    const checkAuth = async () => {
      const user = await getAuthenticatedUser();
      console.log('UserProfileCard auth check:', !!user);
    };
    
    checkAuth();
    
    setHasAdminAccess(isAdmin() || isEventManager() || isBoxOffice());
    setHasArtistAccess(isArtist());
  }, [isAdmin, isEventManager, isBoxOffice, isArtist, profile]);
  
  const handleSignOut = () => {
    setIsLoading(true);
    
    try {
      // Clear all cookies related to Supabase auth
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.includes('supabase') || name.includes('sb-')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      
      // Clear localStorage items related to Supabase
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Force redirect to login page
      window.location.replace('http://localhost:3000/auth/login');
    } catch (error) {
      console.error('Error during manual sign out:', error);
      // Force redirect anyway
      window.location.replace('http://localhost:3000/auth/login');
    }
  };
  
  // Guest user view (not logged in)
  if (!profile) {
    // Check authentication status directly when profile is missing
    getAuthenticatedUser().then(user => {
      console.log('UserProfileCard missing profile but auth check:', !!user);
      if (user) {
        // If authenticated but no profile, force refresh to try to get profile
        window.location.reload();
      }
    });
    
    return (
      <div className="flex items-center space-x-2">
        <Button asChild variant="ghost" className="text-white hover:text-indigo-300">
          <Link href="#contact">
            <Icons.mail className="mr-2 h-5 w-5" />
            Contact
          </Link>
        </Button>
        <Button asChild variant="ghost" className="text-white hover:text-indigo-300">
          <Link href="/auth/login">
            <Icons.logIn className="mr-2 h-5 w-5" />
            Login
          </Link>
        </Button>
      </div>
    );
  }
  
  // User is logged in, show profile dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-gray-700 hover:border-indigo-300">
          <Avatar className="h-9 w-9">
            <AvatarImage 
              src={profile.avatar_url || ''} 
              alt={userName}
              className="object-cover"
            />
            <AvatarFallback className="bg-gray-800 text-white">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-gray-900 border-gray-700 text-white" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-gray-400">{profile.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-700" />
        
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <Icons.user className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/profile/tickets" className="cursor-pointer">
            <Icons.ticket className="mr-2 h-4 w-4" />
            <span>My Tickets</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="#contact" className="cursor-pointer">
            <Icons.mail className="mr-2 h-4 w-4" />
            <span>Contact Us</span>
          </Link>
        </DropdownMenuItem>
        
        {(hasAdminAccess || hasArtistAccess) && (
          <>
            <DropdownMenuSeparator className="bg-gray-700" />
            {hasAdminAccess && (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="cursor-pointer">
                  <Icons.settings className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
            )}
            {hasArtistAccess && (
              <DropdownMenuItem asChild>
                <Link href="/artist" className="cursor-pointer">
                  <Icons.music className="mr-2 h-4 w-4" />
                  <span>Artist Portal</span>
                </Link>
              </DropdownMenuItem>
            )}
          </>
        )}
        
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={isLoading}
          className="cursor-pointer"
        >
          {isLoading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <Icons.logOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
