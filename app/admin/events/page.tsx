'use client';

import { useState, useEffect } from 'react';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function EventsManagementPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();
  
  useEffect(() => {
    async function loadEvents() {
      try {
        // Check authentication securely
        const user = await getAuthenticatedUser();
        
        if (!user) {
          setError('You need to be logged in');
          return;
        }
        
        console.log('User authenticated:', user.email);
        
        // Load ALL events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: false });
          
        if (eventsError) {
          console.error('Error loading events:', eventsError);
          setError('Failed to load events');
          return;
        }
        
        console.log('Total events in database:', eventsData?.length || 0);
        console.log('Full events data:', eventsData);
        
        // Store all events
        setEvents(eventsData || []);
        
      } catch (e) {
        console.error('Unhandled error:', e);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadEvents();
  }, []);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Filter events based on search term
  const filteredEvents = events.filter(event => {
    if (searchTerm.trim() === '') {
      return true; // Show all events when no search term
    }
    
    const searchLower = searchTerm.toLowerCase();
    return (
      event.title?.toLowerCase().includes(searchLower) ||
      event.venue?.toLowerCase().includes(searchLower) ||
      (event.date && new Date(event.date).toLocaleDateString().includes(searchLower)) ||
      (event.id && event.id.toString().includes(searchLower))
    );
  });
  
  console.log('Filtered events:', filteredEvents.length);
  
  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Events Management</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-destructive mb-4">Error</h1>
        <p className="mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/admin">
            Return to Admin Dashboard
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Events Management</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="shameless">
            <Link href="/admin/events/new">
              <Icons.add className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">
              <Icons.arrowRight className="mr-2 h-4 w-4 rotate-180" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 max-w-md">
          <Input
            type="search"
            placeholder="Search by title, venue, date or ID..."
            className="w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSearchTerm('')}
              className="h-10 w-10"
            >
              <Icons.close className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {searchTerm ? 
            `Found ${filteredEvents.length} of ${events.length} total events` : 
            `Showing all ${events.length} events`}
        </p>
      </div>
      
      <Card>
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center">
            <Icons.calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No events found.</p>
            {events.length > 0 && searchTerm !== '' ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your search.
              </p>
            ) : (
              <Button asChild variant="shameless" className="mt-4">
                <Link href="/admin/events/new">
                  Create your first event
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map(event => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <div>{event.title}</div>
                    <div className="text-sm text-muted-foreground">{event.slug}</div>
                  </TableCell>
                  <TableCell>
                    {formatDate(event.date)}
                  </TableCell>
                  <TableCell>{event.venue}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span>Available:</span>
                        <Badge variant="outline">{event.tickets_remaining}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Total:</span>
                        <Badge variant="outline">{event.tickets_total}</Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/events/${event.id}`}>
                          <Icons.edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/events/${event.id}/guest-list`}>
                          <Icons.users className="h-4 w-4 mr-1" />
                          Guest List
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
