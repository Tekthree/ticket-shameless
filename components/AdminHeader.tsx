'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/mode-toggle';

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
    <header className="bg-background border-b mb-8">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="text-xl font-bold">
              Shameless Admin
            </Link>
            
            <nav className="hidden md:flex space-x-1">
              <NavLink href="/admin" isActive={pathname === '/admin'} className="">
                <Icons.home className="mr-2 h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink 
                href="/admin/events" 
                isActive={pathname === '/admin/events' || pathname.startsWith('/admin/events/')}
                className=""
              >
                <Icons.calendar className="mr-2 h-4 w-4" />
                Events
              </NavLink>
              <NavLink 
                href="/admin/artists" 
                isActive={pathname === '/admin/artists'}
                className=""
              >
                <Icons.music className="mr-2 h-4 w-4" />
                Artists
              </NavLink>
              <NavLink 
                href="/admin/site-content" 
                isActive={pathname === '/admin/site-content'}
                className=""
              >
                <Icons.fileText className="mr-2 h-4 w-4" />
                Site Content
              </NavLink>
              <NavLink 
                href="/admin/users" 
                isActive={pathname.startsWith('/admin/users')}
                className=""
              >
                <Icons.users className="mr-2 h-4 w-4" />
                Users
              </NavLink>
            </nav>
          </div>
          
          <div className="flex items-center space-x-2">
            <ModeToggle />
            
            <Button 
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="hidden md:flex"
            >
              <Icons.logOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                >
                  <Icons.menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                <nav className="flex flex-col space-y-4 mt-6">
                  <MobileNavLink 
                    href="/admin" 
                    isActive={pathname === '/admin'} 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icons.home className="mr-2 h-5 w-5" />
                    Dashboard
                  </MobileNavLink>
                  <MobileNavLink 
                    href="/admin/events" 
                    isActive={pathname === '/admin/events' || pathname.startsWith('/admin/events/')} 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icons.calendar className="mr-2 h-5 w-5" />
                    Events
                  </MobileNavLink>
                  <MobileNavLink 
                    href="/admin/artists" 
                    isActive={pathname === '/admin/artists'} 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icons.music className="mr-2 h-5 w-5" />
                    Artists
                  </MobileNavLink>
                  <MobileNavLink 
                    href="/admin/site-content" 
                    isActive={pathname === '/admin/site-content'} 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icons.fileText className="mr-2 h-5 w-5" />
                    Site Content
                  </MobileNavLink>
                  <MobileNavLink 
                    href="/admin/users" 
                    isActive={pathname.startsWith('/admin/users')} 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icons.users className="mr-2 h-5 w-5" />
                    Users
                  </MobileNavLink>
                  
                  <div className="pt-4 mt-4 border-t flex flex-col space-y-2">
                    <div className="px-3">
                      <ModeToggle />
                    </div>
                    <Button 
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Icons.logOut className="mr-2 h-5 w-5" />
                      Sign Out
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
  className: string;
}

function NavLink({ href, isActive, children, className }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-3 py-2 rounded-md text-sm font-medium",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
}

interface MobileNavLinkProps {
  href: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function MobileNavLink({ href, isActive, onClick, children }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-3 py-2 rounded-md",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
