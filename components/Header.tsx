'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
            <Link 
              href="/events" 
              className={`hover:text-red-500 transition ${
                pathname === '/events' ? 'text-red-500' : ''
              }`}
            >
              Events
            </Link>
            <Link 
              href="/about" 
              className={`hover:text-red-500 transition ${
                pathname === '/about' ? 'text-red-500' : ''
              }`}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className={`hover:text-red-500 transition ${
                pathname === '/contact' ? 'text-red-500' : ''
              }`}
            >
              Contact
            </Link>
            
            {/* Admin links would be conditionally rendered based on auth state */}
            <Link 
              href="/admin" 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Admin
            </Link>
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMenu}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
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
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-700">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/events" 
                className={`hover:text-red-500 transition ${
                  pathname === '/events' ? 'text-red-500' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Events
              </Link>
              <Link 
                href="/about" 
                className={`hover:text-red-500 transition ${
                  pathname === '/about' ? 'text-red-500' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className={`hover:text-red-500 transition ${
                  pathname === '/contact' ? 'text-red-500' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link 
                href="/admin" 
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition w-fit"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
