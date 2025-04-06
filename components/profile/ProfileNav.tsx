"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ProfileNavProps {
  userRoles: string[]
}

export default function ProfileNav({ userRoles }: ProfileNavProps) {
  const pathname = usePathname()
  
  const navItems = [
    {
      title: "Profile Settings",
      href: "/profile",
      icon: <Icons.user className="h-4 w-4 mr-2" />,
      active: pathname === '/profile'
    },
    {
      title: "Ticket History",
      href: "/profile/tickets",
      icon: <Icons.ticket className="h-4 w-4 mr-2" />,
      active: pathname === '/profile/tickets'
    },
    {
      title: "Your Roles",
      href: "/profile/roles",
      icon: <Icons.shield className="h-4 w-4 mr-2" />,
      active: pathname === '/profile/roles',
      show: userRoles.length > 0
    }
  ]

  return (
    <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-1">
            {navItems.map((item, i) => (
              item.show !== false && (
                <Link href={item.href} key={i}>
                  <Button 
                    variant={item.active ? "default" : "ghost"} 
                    className={cn(
                      "text-sm",
                      item.active ? 
                        "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700" : 
                        "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </Button>
                </Link>
              )
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Icons.home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            
            {(userRoles.includes('admin') || userRoles.includes('eventManager') || userRoles.includes('boxOffice')) && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin">
                  <Icons.settings className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}
            
            <div className="border-l border-gray-300 dark:border-gray-700 h-6 mx-2" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}
