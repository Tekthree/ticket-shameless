'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TicketHistoryProps {
  // No props needed anymore, component fetches user data directly
}

export default function TicketHistory() {
  const supabase = createClient();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        
        // Get current user's information first
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email;
        const currentUserId = session?.user?.id;
        
        if (!userEmail && !currentUserId) {
          throw new Error('No user information found');
        }
        
        // Fetch orders using a more general query without reference to auth.users
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, 
            event_id,
            created_at,
            amount_total,
            quantity,
            status,
            customer_email,
            events:event_id (
              title, 
              slug, 
              date, 
              venue, 
              image
            )
          `)
          .or(`customer_email.eq.${userEmail},user_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false });

        
        if (error) throw error;
        
        // Only set tickets from the first query if results were found or if we didn't do the fallback query
        if (data && data.length > 0) {
          setTickets(data);
        }
      } catch (err: any) {
        console.error('Error fetching tickets:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTickets();
  }, []); // Removed userId from dependencies since we're using auth.getSession now
  
  const getStatusBadge = (status: string) => {
    // Normalize the status for comparison
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'complete':
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'cancelled':
      case 'canceled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Your Tickets</h2>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex gap-4">
              <Skeleton className="w-20 h-20 rounded-md" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">Failed to load ticket history.</p>
        <p>{error}</p>
      </div>
    );
  }
  
  if (tickets.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-6">Your Tickets</h2>
        <p className="text-gray-500 mb-4">You haven't purchased any tickets yet.</p>
        <Link href="/events" className="text-blue-600 hover:underline">
          Browse events to find something you'll love!
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Your Tickets</h2>
      
      <div className="grid gap-6">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="relative w-full md:w-48 h-40">
                <div 
                  className="w-full h-full bg-cover bg-center" 
                  style={{ backgroundImage: `url(${ticket.events.image})` }}
                />
              </div>
              
              <div className="flex-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{ticket.events.title}</CardTitle>
                      <CardDescription>
                        {format(new Date(ticket.events.date), 'EEEE, MMMM d, yyyy')} • {ticket.events.venue}
                      </CardDescription>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tickets</p>
                      <p>{ticket.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="font-mono text-xs">{ticket.id.substring(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p>${(ticket.amount_total / 100).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Link 
                    href={`/events/${ticket.events.slug}`} 
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Event
                  </Link>
                  
                  {(ticket.status.toLowerCase() === 'complete' || ticket.status.toLowerCase() === 'completed') && (
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="inline-flex items-center gap-2 text-sm bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      View Ticket
                    </Link>
                  )}
                </CardFooter>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
