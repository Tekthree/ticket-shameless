'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }
  
  return (
    <header className="bg-black text-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative w-10 h-10 mr-2">
              <Image 
                src="/images/logo.png"
                alt="Shameless Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold">SHAMELESS</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <NavLink href="/events" isActive={pathname === '/events'}>
              <Icons.calendar className="mr-2 h-4 w-4" />
              Events
            </NavLink>
            <NavLink href="/about" isActive={pathname === '/about'}>
              <Icons.info className="mr-2 h-4 w-4" />
              About
            </NavLink>
            <NavLink href="/contact" isActive={pathname === '/contact'}>
              <Icons.mail className="mr-2 h-4 w-4" />
              Contact
            </NavLink>
            
            {/* Admin links would be conditionally rendered based on auth state */}
            <Button asChild variant="shameless">
              <Link href="/admin">
                <Icons.settings className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </Button>
          </nav>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            className="md:hidden text-white"
          >
            {isMenuOpen ? (
              <Icons.close className="h-6 w-6" />
            ) : (
              <Icons.menu className="h-6 w-6" />
            )}
          </Button>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-700">
            <nav className="flex flex-col space-y-4">
              <MobileNavLink 
                href="/events" 
                isActive={pathname === '/events'}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icons.calendar className="mr-2 h-4 w-4" />
                Events
              </MobileNavLink>
              <MobileNavLink 
                href="/about" 
                isActive={pathname === '/about'}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icons.info className="mr-2 h-4 w-4" />
                About
              </MobileNavLink>
              <MobileNavLink 
                href="/contact" 
                isActive={pathname === '/contact'}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icons.mail className="mr-2 h-4 w-4" />
                Contact
              </MobileNavLink>
              <div className="pt-2">
                <Button asChild variant="shameless" size="sm">
                  <Link 
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icons.settings className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

function NavLink({ href, isActive, children, className }) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center hover:text-shameless-red transition",
        isActive ? "text-shameless-red" : "",
        className
      )}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, isActive, onClick, children }) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center hover:text-shameless-red transition px-2 py-1.5 rounded",
        isActive ? "text-shameless-red bg-gray-800" : ""
      )}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}
