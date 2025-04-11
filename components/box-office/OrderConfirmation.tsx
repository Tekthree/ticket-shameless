'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';

interface Order {
  id: string;
  event_id: string;
  customer_email: string;
  customer_name: string;
  amount_total: number;
  status: string;
  quantity: number;
  payment_method: string;
  processing_location: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
}

interface Ticket {
  id: string;
  ticket_type_id: string;
  qr_code: string;
  ticket_type: {
    name: string;
    price: number;
  };
}

export default function OrderConfirmation({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  // Fetch order details on component mount
  useEffect(() => {
    async function fetchOrderDetails() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
          
        if (orderError) throw orderError;
        
        setOrder(orderData);
        
        // Get event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('id, title, date, time, venue')
          .eq('id', orderData.event_id)
          .single();
          
        if (eventError) throw eventError;
        
        setEvent(eventData);
        
        // Get tickets with their ticket types
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select(`
            id,
            ticket_type_id,
            qr_code,
            price,
            ticket_types(name, price)
          `)
          .eq('order_id', orderId);
          
        if (ticketError) throw ticketError;
        
        console.log('Raw ticket data:', ticketData);
        
        // Transform the data to match the Ticket interface
        const formattedTickets = ticketData.map((ticket: any) => ({
          id: ticket.id,
          ticket_type_id: ticket.ticket_type_id,
          qr_code: ticket.qr_code,
          ticket_type: {
            name: ticket.ticket_types?.name || '',
            // Try to get price from ticket first, then fall back to ticket_type
            price: ticket.price || ticket.ticket_types?.price || 0
          }
        }));
        
        console.log('Formatted tickets:', formattedTickets);
        
        setTickets(formattedTickets);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Handle email receipt
  const handleEmailReceipt = async () => {
    if (!order || !event) return;
    
    toast.success('Receipt sent to ' + order.customer_email);
    // In a real implementation, you would send an API request to send the email
  };

  // Handle print receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Navigate back to POS
  const handleBackToPOS = () => {
    router.push('/box-office/pos');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order || !event) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-500">
          <p>{error || 'Order not found'}</p>
          <Button 
            variant="outline" 
            onClick={handleBackToPOS} 
            className="mt-4"
          >
            Back to Point of Sale
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="mb-6 print:shadow-none">
        <CardHeader className="bg-green-50 print:bg-white">
          <CardTitle className="flex items-center justify-between">
            <span>Order Confirmation</span>
            <span className="text-green-600">#{order.id.slice(0, 8)}</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="text-2xl font-bold mb-1">{event.title}</div>
            <div>{new Date(event.date).toLocaleDateString()} - {event.time}</div>
            <div>{event.venue}</div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Customer</h3>
              <div>{order.customer_name}</div>
              <div>{order.customer_email}</div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Order Details</h3>
              <div>Date: {new Date(order.created_at).toLocaleString()}</div>
              <div>Payment Method: {order.payment_method.replace('_', ' ').toUpperCase()}</div>
              <div>Location: {order.processing_location}</div>
              <div>Status: {order.status.toUpperCase()}</div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Tickets</h3>
              <div className="bg-gray-50 rounded-md p-3 print:bg-white print:border">
                {tickets.map((ticket, index) => (
                  <div key={ticket.id} className="flex justify-between py-2 border-b last:border-b-0">
                    <span>{ticket.ticket_type.name}</span>
                    <span>${(ticket.ticket_type.price / 100).toFixed(2)}</span>
                  </div>
                ))}
                
                <div className="flex justify-between pt-3 font-bold">
                  <span>Total</span>
                  <span>${(order.amount_total / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="hidden print:block text-center mt-8 text-gray-500 text-sm">
              <p>Thank you for your purchase!</p>
              <p>Ticket QR codes will be sent in the email receipt.</p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-4 print:hidden">
          <Button 
            variant="outline" 
            onClick={handleBackToPOS}
          >
            Back to POS
          </Button>
          
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={handlePrintReceipt}
            >
              Print
            </Button>
            
            <Button 
              onClick={handleEmailReceipt}
            >
              Email Receipt
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
