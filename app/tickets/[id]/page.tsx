'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Define a simple QR Code component
// In a real application, consider using a library like 'react-qr-code'
function QRCode({ value }: { value: string }) {
  // This would generate a QR code with the given value in a real implementation
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="h-64 w-64 grid grid-cols-10 grid-rows-10 gap-0">
          {/* This is a simplified visual representation of a QR code */}
          {Array(100).fill(0).map((_, i) => {
            // Use a deterministic pattern based on the value string and position
            const isDark = (i + value.charCodeAt(i % value.length)) % 3 === 0;
            return (
              <div 
                key={i} 
                className={`${isDark ? 'bg-black' : 'bg-white'} border border-gray-100`}
              />
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">Scan to verify ticket</p>
    </div>
  );
}

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  
  useEffect(() => {
    async function fetchTicketData() {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        // Fetch ticket data
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
            customer_name,
            events:event_id (
              title,
              slug,
              date,
              time,
              venue,
              address,
              image,
              age_restriction
            )
          `)
          .eq('id', params.id)
          .single();
        
        if (error || !data) {
          throw new Error('Ticket not found');
        }
        
        // Verify the ticket belongs to the current user
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.email !== data.customer_email) {
          // This ticket doesn't belong to the current user
          throw new Error('You do not have access to this ticket');
        }
        
        setTicket(data);
      } catch (err: any) {
        console.error('Error fetching ticket:', err);
        setError(err.message);
        router.push('/profile');
      } finally {
        setLoading(false);
      }
    }
    
    if (params.id) {
      fetchTicketData();
    }
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Loading Ticket...</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !ticket) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-8">Error Loading Ticket</h1>
          <p className="text-red-500 mb-4">{error || 'Ticket not found'}</p>
          <Link href="/profile" className="text-blue-600 hover:underline">
            Return to Profile
          </Link>
        </div>
      </div>
    );
  }
  
  // Generate a verification value for the QR code
  const verificationValue = `TICKET:${ticket.id}:${ticket.event_id}:${ticket.quantity}`;
  
  return (
    <div className="container mx-auto py-10 px-4">
      <Link href="/profile" className="inline-flex items-center text-blue-600 hover:underline mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Profile
      </Link>
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Your Ticket</h1>
        
        <Card className="overflow-hidden mb-8">
          <div className="bg-gray-900 text-white p-6">
            <h2 className="text-2xl font-bold">{ticket.events.title}</h2>
            <p className="text-gray-400">Ticket #{ticket.id.slice(0, 8).toUpperCase()}</p>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <img
                  src={ticket.events.image}
                  alt={ticket.events.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-gray-600">
                      {format(new Date(ticket.events.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-gray-600">{ticket.events.time}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Venue</p>
                    <p className="text-gray-600">{ticket.events.venue}</p>
                    <p className="text-gray-600 text-sm">{ticket.events.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Tickets</p>
                    <p className="text-gray-600">{ticket.quantity} x General Admission</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <QRCode value={verificationValue} />
              
              <div className="mt-8 w-full">
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <p className="text-gray-600">Order ID</p>
                    <p className="font-mono">{ticket.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-600">Purchased</p>
                    <p>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-600">Purchaser</p>
                    <p>{ticket.customer_name}</p>
                  </div>
                  {ticket.events.age_restriction && (
                    <div className="flex justify-between">
                      <p className="text-gray-600">Age Restriction</p>
                      <p>{ticket.events.age_restriction}</p>
                    </div>
                  )}
                  <div className="flex justify-between font-bold mt-4 pt-2 border-t border-gray-200">
                    <p>Total</p>
                    <p>${ticket.amount_total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <div className="text-center">
          <Button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2"
          >
            Print Ticket
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            Please bring this ticket (printed or on your device) to the event.
          </p>
        </div>
      </div>
    </div>
  );
}
