'use client';

import { useState, useEffect } from 'react';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/client';
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
import { Button } from '@/components/ui/button';
import { Ticket, Calendar } from 'lucide-react';

interface TicketHistoryProps {
  // No props needed anymore, component fetches user data directly
}

// Define interfaces for our data types
interface Event {
  title?: string;
  slug?: string;
  date?: string;
  venue?: string;
  image?: string;
}

interface Order {
  id: string;
  event_id?: string;
  created_at: string;
  amount_total: number;
  quantity: number;
  status: string;
  customer_email?: string;
  user_id?: string;
  events?: Event;
}

interface Ticket {
  id: string;
  order_id?: string;
  event_id?: string;
  created_at: string;
  status?: string;
  price?: number;
  orders?: {
    customer_email?: string;
    customer_name?: string;
    amount_total?: number;
    quantity?: number;
    order_status?: string;
  };
  events?: Event;
}

export default function TicketHistory() {
  const supabase = createClient();
  const [tickets, setTickets] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        
        // Get current user's information securely
        const user = await getAuthenticatedUser();
        
        if (!user) {
          throw new Error('No user information found');
          return;
        }
        
        const userEmail = user.email;
        const currentUserId = user.id;
        
        console.log('Fetching tickets for user:', { 
          id: currentUserId, 
          email: userEmail 
        });
        
        // APPROACH 1: Query the orders table by email
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id, 
            event_id,
            created_at,
            amount_total,
            quantity,
            status,
            customer_email,
            user_id,
            events:event_id (
              title, 
              slug, 
              date, 
              venue, 
              image
            )
          `)
          .eq('customer_email', userEmail)
          .order('created_at', { ascending: false });
        
        console.log('Orders query results:', { 
          count: ordersData?.length || 0, 
          hasError: !!ordersError,
          errorMessage: ordersError ? ordersError.message : null
        });
        
        // APPROACH 2: Query the tickets table for tickets associated with this user
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select(`
            id,
            order_id,
            event_id,
            created_at,
            status,
            price,
            orders:order_id (
              customer_email,
              customer_name,
              amount_total,
              quantity,
              status as order_status
            ),
            events:event_id (
              title,
              slug,
              date,
              venue,
              image
            )
          `)
          .order('created_at', { ascending: false });
        
        console.log('Tickets query results:', { 
          count: ticketsData?.length || 0, 
          hasError: !!ticketsError,
          errorMessage: ticketsError ? ticketsError.message : null
        });
        
        // Combine and deduplicate results from both queries
        let combinedTickets: Order[] = [];
        
        // Process orders data
        if (ordersData && ordersData.length > 0) {
          combinedTickets = [...ordersData] as Order[];
        }
        
        // Process tickets data and add any that aren't already included via orders
        if (ticketsData && ticketsData.length > 0) {
          // Filter tickets to only include those where the order email matches the user's email
          const userTickets = ticketsData.filter((ticket: any) => 
            ticket.orders && ticket.orders.customer_email === userEmail
          );
          
          // Group tickets by order_id to avoid duplicates
          const orderIds = new Set(combinedTickets.map(order => order.id));
          
          // Add tickets from orders not already included
          userTickets.forEach((ticket: any) => {
            if (ticket.order_id && !orderIds.has(ticket.order_id)) {
              // Convert ticket to order-like format
              combinedTickets.push({
                id: ticket.order_id,
                event_id: ticket.event_id,
                created_at: ticket.created_at,
                amount_total: ticket.orders?.amount_total || ticket.price || 0,
                quantity: ticket.orders?.quantity || 1,
                status: ticket.orders?.order_status || ticket.status || 'unknown',
                customer_email: ticket.orders?.customer_email || userEmail,
                events: ticket.events
              });
              orderIds.add(ticket.order_id);
            }
          });
        }
        
        // Sort combined results by created_at date (newest first)
        combinedTickets.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        console.log('Combined results:', {
          count: combinedTickets.length,
          sources: {
            fromOrders: ordersData?.length || 0,
            fromTickets: ticketsData?.filter((t: any) => t.orders?.customer_email === userEmail).length || 0
          }
        });
        
        // Set the tickets state with the combined results
        setTickets(combinedTickets);

        
        if (ordersError || ticketsError) {
          const errorMessage = ordersError?.message || ticketsError?.message || 'Error fetching tickets';
          setError(errorMessage);
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
        <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">Ticket History</h2>
      </div>
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
      <div className="text-center py-10 border dark:border-gray-800 border-gray-200 rounded-lg dark:bg-gray-900/30">
        <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't purchased any tickets yet.</p>
        <Button variant="outline" asChild className="mt-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
          <Link href="/events">
            <Calendar className="h-4 w-4 mr-2" />
            Browse events to find something you'll love!
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Title removed as it's in the layout now */}
      
      <div className="grid gap-6">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-800 border">
            <div className="flex flex-col md:flex-row">
              <div className="relative w-full md:w-48 h-40">
                {/* Add debugging info */}
                {process.env.NODE_ENV === 'development' && !ticket.events?.image && (
                  <div className="absolute top-0 left-0 bg-red-500 text-white text-xs p-1 z-10">
                    Missing image (event_id: {ticket.event_id?.substring(0, 8)})
                  </div>
                )}
                <div 
                  className="w-full h-full bg-cover bg-center" 
                  style={{ backgroundImage: ticket.events?.image ? `url(${ticket.events.image})` : 'url(/images/placeholder-event.jpg)' }}
                />
              </div>
              
              <div className="flex-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{ticket.events?.title || 'Event Not Found'}</CardTitle>
                      <CardDescription>
                        {ticket.events?.date ? 
                          `${format(new Date(ticket.events.date), 'EEEE, MMMM d, yyyy')} • ${ticket.events.venue || 'Unknown Venue'}` : 
                          'Event details not available'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Order Date</p>
                      <p>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tickets</p>
                      <p>{ticket.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Order ID</p>
                      <p className="font-mono text-xs">{ticket.id.substring(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                      <p>${ticket.amount_total.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  {ticket.events?.slug ? (
                    <Button variant="link" asChild className="p-0 h-auto text-blue-600 dark:text-blue-400">
                      <Link href={`/events/${ticket.events.slug}`}>
                        <Calendar className="h-4 w-4 mr-1" />
                        View Event
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="link" disabled className="p-0 h-auto text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      Event Unavailable
                    </Button>
                  )}
                  
                  {(ticket.status.toLowerCase() === 'complete' || ticket.status.toLowerCase() === 'completed') && (
                    <Button variant="default" asChild className="bg-red-600 hover:bg-red-700">
                      <Link href={`/tickets/${ticket.id}`}>
                        <Ticket className="h-4 w-4 mr-2" />
                        View Ticket
                      </Link>
                    </Button>
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
