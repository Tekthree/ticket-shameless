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
      
      // Calculate total amount
      const { data: ticketTypesData, error: ticketTypesError } = await supabase
        .from('ticket_types')
        .select('id, price')
        .in('id', Object.keys(saleData.selectedTickets));
        
      if (ticketTypesError) throw ticketTypesError;
      
      const ticketPrices: {[key: string]: number} = {};
      ticketTypesData.forEach(tt => {
        ticketPrices[tt.id] = tt.price;
      });
      
      const total = Object.entries(saleData.selectedTickets).reduce((sum, [typeId, quantity]) => {
        return sum + (ticketPrices[typeId] || 0) * quantity;
      }, 0);
      
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          event_id: saleData.eventId,
          customer_email: saleData.customerEmail,
          customer_name: saleData.customerName,
          amount_total: total,
          status: 'completed',
          quantity: Object.values(saleData.selectedTickets).reduce((sum, qty) => sum + qty, 0),
          processed_by: profile.id,
          processing_location: saleData.location,
          payment_method: saleData.paymentMethod,
          stripe_session_id: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        })
        .select()
        .single();
        
      if (orderError) throw orderError;
      
      // Create tickets
      const ticketInserts = [];
      for (const [typeId, quantity] of Object.entries(saleData.selectedTickets)) {
        if (quantity > 0) {
          for (let i = 0; i < quantity; i++) {
            // Generate QR code (simplified)
            const qrCode = `${orderData.id}_${typeId}_${i}_${Date.now()}`;
            
            ticketInserts.push({
              order_id: orderData.id,
              event_id: saleData.eventId,
              ticket_type_id: typeId,
              qr_code: qrCode,
              status: 'active'
            });
          }
        }
      }
      
      if (ticketInserts.length > 0) {
        const { error: ticketError } = await supabase
          .from('tickets')
          .insert(ticketInserts);
          
        if (ticketError) throw ticketError;
      }
      
      // Record transaction
      const { error: transactionError } = await supabase
        .from('ticket_transactions')
        .insert({
          order_id: orderData.id,
          event_id: saleData.eventId,
          action: 'sale',
          performed_by: profile.id,
          location: saleData.location,
          device_info: navigator.userAgent,
          notes: `Box office sale - ${saleData.paymentMethod}`
        });
        
      if (transactionError) throw transactionError;
      
      return { success: true, orderId: orderData.id };
    } catch (err) {
      console.error('Error processing sale:', err);
      setError('Failed to process sale');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
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
