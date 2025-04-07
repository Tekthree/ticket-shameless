'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    activeTickets: 0,
    totalSales: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();
  
  useEffect(() => {
    async function loadEvents() {
      try {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('You need to be logged in');
          return;
        }
        
        // Load events for display
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true })
          .limit(6); // Get up to 6 events for the dashboard display
          
        if (eventsError) {
          console.error('Error loading events:', eventsError);
          setError('Failed to load events');
          return;
        }
        
        // Format the events for display
        const formattedEvents = eventsData?.map(event => {
          // Format date for display
          const eventDate = new Date(event.date);
          const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          return {
            id: event.id,
            title: event.title,
            slug: event.slug,
            date: formattedDate,
            time: event.time,
            venue: event.venue,
            price: event.price,
            ticketsAvailable: event.tickets_remaining,
            ticketsTotal: event.tickets_total,
            status: event.tickets_remaining > 0 ? 'Available' : 'Sold Out'
          };
        }) || [];
        
        setEvents(formattedEvents);
        
        // Get accurate statistics counts
        await loadStats();
        
      } catch (e) {
        console.error('Unhandled error:', e);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    async function loadStats() {
      try {
        // Get total events count
        const { count: totalCount, error: totalError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });
          
        if (totalError) {
          console.error('Error counting events:', totalError);
          return;
        }
        
        // Get upcoming events count (events with dates in the future)
        const { count: upcomingCount, error: upcomingError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .gte('date', new Date().toISOString());
          
        if (upcomingError) {
          console.error('Error counting upcoming events:', upcomingError);
          return;
        }
        
        // Get ticket stats
        const { data: ticketData, error: ticketError } = await supabase
          .from('events')
          .select('tickets_remaining, tickets_total');
          
        if (ticketError) {
          console.error('Error getting ticket stats:', ticketError);
          return;
        }
        
        // Calculate ticket statistics
        const activeTickets = ticketData?.reduce((total, event) => 
          total + (event.tickets_remaining || 0), 0) || 0;
          
        const totalSales = ticketData?.reduce((total, event) => 
          total + ((event.tickets_total || 0) - (event.tickets_remaining || 0)), 0) || 0;
        
        // Update stats state
        setStats({
          totalEvents: totalCount || 0,
          upcomingEvents: upcomingCount || 0,
          activeTickets,
          totalSales
        });
        
        console.log('Stats loaded:', { 
          totalEvents: totalCount, 
          upcomingEvents: upcomingCount,
          activeTickets,
          totalSales
        });
        
      } catch (e) {
        console.error('Error loading stats:', e);
      }
    }
    
    loadEvents();
  }, []);

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
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
              <p>Loading events...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">
              <Icons.alertCircle className="mx-auto h-8 w-8 mb-4" />
              <p>{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <Icons.calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No events found.</p>
              <Button asChild variant="shameless" className="mt-4">
                <Link href="/admin/events/new">Create your first event</Link>
              </Button>
            </div>
          ) : (
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
          )}
          <div className="p-4 text-center border-t">
            <Button asChild variant="outline">
              <Link href="/admin/events">
                View All Events
                <Icons.arrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
