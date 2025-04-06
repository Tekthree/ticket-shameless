'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icons } from '@/components/ui/icons'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ActionCard } from '@/components/admin/ActionCard'
import { StatCard } from '@/components/admin/StatCard'

export default function AdminDashboard() {
  // Sample data - in a real app, this would come from an API or database
  const events = [
    {
      id: '1',
      title: 'Memorial Day Hijinks',
      slug: 'memorial-day-hijinks',
      date: 'Sunday, April 27, 2025',
      time: '18:53',
      venue: 'Monkey Loft',
      price: 35.00,
      ticketsAvailable: 200,
      ticketsTotal: 200,
      status: 'Available'
    },
    {
      id: '2',
      title: 'Deck\'d Out',
      slug: 'deckd-out',
      date: 'Tuesday, May 6, 2025',
      time: '21:49',
      venue: 'Monkey Loft',
      price: 20.00,
      ticketsAvailable: 200,
      ticketsTotal: 200,
      status: 'Available'
    },
    {
      id: '3',
      title: 'bum the bum',
      slug: 'bum-the-bum',
      date: 'Thursday, May 29, 2025',
      time: '10:22',
      venue: 'Monkey Loft',
      price: 10.00,
      ticketsAvailable: 1,
      ticketsTotal: 350,
      status: 'Available'
    },
  ]

  const stats = {
    totalEvents: 6,
    upcomingEvents: 6,
    activeTickets: '-',
    totalSales: '-'
  }

  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button asChild variant="shameless">
          <Link href="/admin/events/new">Create New Event</Link>
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <ActionCard 
              href="/admin/events/new"
              icon={<Icons.add className="h-6 w-6 text-white" />}
              title="New Event"
              description="Create a new event"
              bgColor="bg-blue-100 dark:bg-blue-900"
              iconBgColor="bg-blue-500"
            />
            <ActionCard 
              href="/admin/artists"
              icon={<Icons.users className="h-6 w-6 text-white" />}
              title="Manage Artists"
              description="Add or edit artists"
              bgColor="bg-purple-100 dark:bg-purple-900"
              iconBgColor="bg-purple-500"
            />
            <ActionCard 
              href="/admin/site-content"
              icon={<Icons.fileText className="h-6 w-6 text-white" />}
              title="Site Content"
              description="Edit landing page content"
              bgColor="bg-green-100 dark:bg-green-900"
              iconBgColor="bg-green-500"
            />
            <ActionCard 
              href="/"
              icon={<Icons.eye className="h-6 w-6 text-white" />}
              title="View Site"
              description="Preview public website"
              bgColor="bg-blue-100 dark:bg-blue-900"
              iconBgColor="bg-blue-500"
            />
          </CardContent>
        </Card>
        
        {/* Site Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Site Statistics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <StatCard 
              title="Total Events"
              value={stats.totalEvents.toString()}
            />
            <StatCard 
              title="Upcoming Events"
              value={stats.upcomingEvents.toString()}
            />
            <StatCard 
              title="Active Tickets"
              value={stats.activeTickets.toString()}
            />
            <StatCard 
              title="Total Sales"
              value={stats.totalSales.toString()}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Events Management */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Events Management</h2>
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search events..."
            className="max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <div>{event.title}</div>
                    <div className="text-sm text-muted-foreground">{event.slug}</div>
                  </TableCell>
                  <TableCell>
                    <div>{event.date}</div>
                    <div className="text-sm text-muted-foreground">{event.time}</div>
                  </TableCell>
                  <TableCell>{event.venue}</TableCell>
                  <TableCell>${event.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>{event.ticketsAvailable} / {event.ticketsTotal}</div>
                      <Badge variant="outline">{event.status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/events/${event.slug}`} target="_blank">
                          <Icons.eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/events/${event.id}`}>
                          <Icons.edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Icons.trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
