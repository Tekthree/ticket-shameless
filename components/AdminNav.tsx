"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

export default function AdminNav() {
  const pathname = usePathname()
  
  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <Icons.home className="h-4 w-4 mr-2" />,
      active: pathname === '/admin'
    },
    {
      title: "Events",
      href: "/admin/events",
      icon: <Icons.calendar className="h-4 w-4 mr-2" />,
      active: pathname.startsWith('/admin/events')
    },
    {
      title: "Artists",
      href: "/admin/artists",
      icon: <Icons.music className="h-4 w-4 mr-2" />,
      active: pathname.startsWith('/admin/artists')
    },
    {
      title: "Site Content",
      href: "/admin/content",
      icon: <Icons.fileText className="h-4 w-4 mr-2" />,
      active: pathname.startsWith('/admin/content')
    }
  ]

  return (
    <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-1">
            {navItems.map((item, i) => (
              <Link href={item.href} key={i}>
                <Button 
                  variant={item.active ? "default" : "ghost"} 
                  className={`text-sm ${
                    item.active ? 
                      "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700" : 
                      "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.title}
                </Button>
              </Link>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Icons.home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            
            <Button asChild variant="ghost" size="sm">
              <Link href="/profile">
                <Icons.user className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
            
            <div className="border-l border-gray-300 dark:border-gray-700 h-6 mx-2" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}
