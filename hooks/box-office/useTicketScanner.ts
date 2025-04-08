import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface ScanResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface ScanStats {
  total: number;
  scanned: number;
  percentage: number;
}

export function useTicketScanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { profile } = useUserProfile();

  // Fetch events
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

  // Get scan stats for an event
  async function getScanStats(eventId: string): Promise<ScanStats> {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, is_scanned')
        .eq('event_id', eventId);
        
      if (error) throw error;
      
      const total = data?.length || 0;
      const scanned = data?.filter(ticket => ticket.is_scanned)?.length || 0;
      const percentage = total > 0 ? Math.round((scanned / total) * 100) : 0;
      
      return { total, scanned, percentage };
    } catch (err) {
      console.error('Error getting scan stats:', err);
      setError('Failed to load scan statistics');
      return { total: 0, scanned: 0, percentage: 0 };
    } finally {
      setIsLoading(false);
    }
  }

  // Scan a ticket
  async function scanTicket(eventId: string, ticketCode: string): Promise<ScanResult> {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!profile) {
        throw new Error('User profile not found');
      }
      
      // Get ticket details
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*, orders(*), ticket_types(*)')
        .eq('qr_code', ticketCode)
        .eq('event_id', eventId)
        .single();
        
      if (ticketError) {
        return {
          success: false,
          message: 'Invalid ticket code or ticket not found for this event'
        };
      }
      
      // Check if already scanned
      if (ticket.is_scanned) {
        return {
          success: false,
          message: 'Ticket has already been scanned',
          data: ticket
        };
      }
      
      // Check ticket status
      if (ticket.status !== 'active') {
        return {
          success: false,
          message: `Ticket is ${ticket.status}`,
          data: ticket
        };
      }
      
      // Update ticket status
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          is_scanned: true,
          scanned_at: new Date().toISOString(),
          scanned_by: profile.id
        })
        .eq('id', ticket.id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Record transaction
      const { error: transactionError } = await supabase
        .from('ticket_transactions')
        .insert({
          ticket_id: ticket.id,
          order_id: ticket.order_id,
          event_id: eventId,
          action: 'scan',
          performed_by: profile.id,
          location: 'venue_entrance',
          device_info: navigator.userAgent
        });
        
      if (transactionError) {
        throw transactionError;
      }
      
      return {
        success: true,
        message: 'Ticket successfully scanned',
        data: ticket
      };
    } catch (err) {
      console.error('Error scanning ticket:', err);
      setError('Failed to scan ticket');
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    error,
    fetchEvents,
    getScanStats,
    scanTicket
  };
}
