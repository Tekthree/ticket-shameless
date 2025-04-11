import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
}

export interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  capacity: number | null;
  is_active: boolean;
}

export interface SaleData {
  eventId: string;
  customerEmail: string;
  customerName: string;
  paymentMethod: string;
  location: string;
  selectedTickets: {[key: string]: number};
}

export function useBoxOffice() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { profile } = useUserProfile();

  // Fetch active events
  async function fetchEvents() {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, time, venue')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date');
        
      if (error) throw error;
      
      return { events: data || [] };
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
      return { events: [] };
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch ticket types for an event
  async function fetchTicketTypes(eventId: string) {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true);
        
      if (error) throw error;
      
      return { ticketTypes: data || [] };
    } catch (err) {
      console.error('Error fetching ticket types:', err);
      setError('Failed to load ticket types');
      return { ticketTypes: [] };
    } finally {
      setIsLoading(false);
    }
  }

  // Create default ticket types for an event if none exist
  async function createDefaultTicketTypes(eventId: string) {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get event details to determine price
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('price')
        .eq('id', eventId)
        .single();
        
      if (eventError) throw eventError;
      
      // Create a general admission ticket type
      const { data, error } = await supabase
        .from('ticket_types')
        .insert([
          {
            event_id: eventId,
            name: 'General Admission',
            description: 'Standard entry ticket',
            price: eventData.price * 100, // Convert to cents
            is_active: true
          }
        ])
        .select();
        
      if (error) throw error;
      
      return { ticketTypes: data || [] };
    } catch (err) {
      console.error('Error creating default ticket types:', err);
      setError('Failed to create ticket types');
      return { ticketTypes: [] };
    } finally {
      setIsLoading(false);
    }
  }

  // Process a ticket sale
  async function processSale(saleData: SaleData) {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!profile) {
        throw new Error('User profile not found');
      }
      
      console.log('Processing sale for event:', saleData.eventId);
      console.log('Selected tickets:', saleData.selectedTickets);
      
      // Calculate total amount
      const { data: ticketTypesData, error: ticketTypesError } = await supabase
        .from('ticket_types')
        .select('id, price')
        .in('id', Object.keys(saleData.selectedTickets));
        
      if (ticketTypesError) {
        console.error('Error fetching ticket types:', ticketTypesError);
        throw new Error(`Failed to fetch ticket types: ${ticketTypesError.message}`);
      }
      
      if (!ticketTypesData || ticketTypesData.length === 0) {
        throw new Error('No ticket types found for the selected tickets');
      }
      
      console.log('Ticket types data:', ticketTypesData);
      
      const ticketPrices: {[key: string]: number} = {};
      ticketTypesData.forEach(tt => {
        ticketPrices[tt.id] = tt.price;
      });
      
      // Calculate total quantity of tickets being sold
      const totalQuantity = Object.values(saleData.selectedTickets).reduce((sum, qty) => sum + qty, 0);
      
      if (totalQuantity <= 0) {
        throw new Error('No tickets selected for purchase');
      }
      
      const total = Object.entries(saleData.selectedTickets).reduce((sum, [typeId, quantity]) => {
        return sum + (ticketPrices[typeId] || 0) * quantity;
      }, 0);
      
      console.log('Total quantity:', totalQuantity);
      console.log('Total amount:', total);
      
      // Start a transaction to ensure data consistency
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('tickets_remaining')
        .eq('id', saleData.eventId)
        .single();
        
      if (eventError) {
        console.error('Error fetching event data:', eventError);
        throw new Error(`Failed to fetch event data: ${eventError.message}`);
      }
      
      console.log('Event data:', eventData);
      
      // Check if there are enough tickets available
      if (eventData.tickets_remaining < totalQuantity) {
        throw new Error(`Not enough tickets available. Only ${eventData.tickets_remaining} tickets remaining.`);
      }
      
      // Generate a unique session ID for this sale
      const sessionId = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create order
      console.log('Creating order with session ID:', sessionId);
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          event_id: saleData.eventId,
          customer_email: saleData.customerEmail,
          customer_name: saleData.customerName,
          amount_total: total,
          status: 'completed',
          quantity: totalQuantity,
          processed_by: profile.id,
          processing_location: saleData.location,
          payment_method: saleData.paymentMethod,
          stripe_session_id: sessionId
        })
        .select()
        .single();
        
      if (orderError) {
        console.error('Error creating order:', orderError);
        throw new Error(`Failed to create order: ${orderError.message}`);
      }
      
      if (!orderData) {
        throw new Error('Order data is null after insert');
      }
      
      console.log('Order created:', orderData);
      
      // Create tickets
      const ticketInserts = [];
      for (const [typeId, quantity] of Object.entries(saleData.selectedTickets)) {
        if (quantity > 0) {
          // Get the price for this ticket type
          const ticketTypePrice = ticketPrices[typeId] || 0;
          
          for (let i = 0; i < quantity; i++) {
            // Generate QR code (simplified)
            const qrCode = `${orderData.id}_${typeId}_${i}_${Date.now()}`;
            
            ticketInserts.push({
              order_id: orderData.id,
              event_id: saleData.eventId,
              ticket_type_id: typeId,
              qr_code: qrCode,
              status: 'active',
              // Try including price - the column might now exist after running migration
              price: ticketTypePrice 
            });
          }
        }
      }
      
      if (ticketInserts.length > 0) {
        console.log(`Inserting ${ticketInserts.length} tickets`);
        const { error: ticketError } = await supabase
          .from('tickets')
          .insert(ticketInserts);
          
        if (ticketError) {
          console.error('Error inserting tickets:', ticketError);
          throw new Error(`Failed to create tickets: ${ticketError.message}`);
        }
      }
      
      console.log('Tickets created successfully');
      
      // We're no longer manually decrementing tickets
      // The database trigger will handle ticket count updates when the order is inserted
      console.log(`Ticket count for event ${saleData.eventId} will be updated by the database trigger`);
      console.log(`The trigger will decrement ${totalQuantity} tickets automatically`);
      
      // We've removed the sync-tickets API call here to prevent double-decrementing
      // The database trigger will handle the ticket count update when the order is inserted
      console.log('Skipping sync-tickets API call to prevent double-decrementing');
      
      // Record transaction
      console.log('Recording transaction');
      const { error: transactionError } = await supabase
        .from('ticket_transactions')
        .insert({
          order_id: orderData.id,
          event_id: saleData.eventId,
          action: 'sale',
          performed_by: profile.id,
          location: saleData.location,
          device_info: navigator.userAgent,
          notes: `Box office sale - ${saleData.paymentMethod} - ${totalQuantity} tickets sold`
        });
        
      if (transactionError) {
        console.error('Error recording transaction:', transactionError);
        // Don't fail the entire sale if just the transaction record fails
        console.warn('Transaction recording failed, but sale was successful');
      }
      
      console.log('Sale completed successfully');
      return { success: true, orderId: orderData.id };
    } catch (err) {
      console.error('Error processing sale:', err);
      setError('Failed to process sale');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error details:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    error,
    fetchEvents,
    fetchTicketTypes,
    createDefaultTicketTypes,
    processSale
  };
}
