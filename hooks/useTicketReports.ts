import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface EventScanStats {
  event_id: string;
  event_name: string;
  event_date: string;
  total_tickets: number;
  scanned_tickets: number;
  scan_percentage: number;
}

export interface StaffSaleStats {
  staff_id: string;
  staff_name: string;
  transactions_processed: number;
  tickets_sold: number;
  total_sales: number;
  first_transaction: string;
  last_transaction: string;
}

export interface TicketTransaction {
  id: string;
  ticket_id: string | null;
  order_id: string | null;
  event_id: string;
  action: string;
  performed_by: string;
  location: string | null;
  device_info: string | null;
  notes: string | null;
  created_at: string;
  profiles: {
    display_name: string;
  };
}

export function useTicketReports() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Get event scanning statistics
  async function getEventStats() {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('event_scan_status')
        .select('*');
        
      if (error) throw error;
      
      return { eventStats: data || [] };
    } catch (err) {
      console.error('Error fetching event stats:', err);
      setError('Failed to load event statistics');
      return { eventStats: [] };
    } finally {
      setIsLoading(false);
    }
  }

  // Get staff sales statistics
  async function getStaffStats() {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('ticket_sales_by_staff')
        .select('*')
        .order('total_sales', { ascending: false });
        
      if (error) throw error;
      
      return { staffStats: data || [] };
    } catch (err) {
      console.error('Error fetching staff stats:', err);
      setError('Failed to load staff statistics');
      return { staffStats: [] };
    } finally {
      setIsLoading(false);
    }
  }

  // Get ticket transactions for an event
  async function getEventTransactions(eventId: string) {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('ticket_transactions')
        .select(`
          *,
          profiles:performed_by (display_name)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return { transactions: data || [] };
    } catch (err) {
      console.error('Error fetching event transactions:', err);
      setError('Failed to load event transactions');
      return { transactions: [] };
    } finally {
      setIsLoading(false);
    }
  }

  // Export event data to CSV
  function exportEventDataToCsv(eventStats: EventScanStats[]) {
    const headers = ['Event', 'Date', 'Total Tickets', 'Scanned Tickets', 'Percentage'];
    const csvData = eventStats.map(event => [
      event.event_name,
      new Date(event.event_date).toLocaleDateString(),
      event.total_tickets.toString(),
      event.scanned_tickets.toString(),
      `${event.scan_percentage}%`
    ]);
    
    return generateCsv(headers, csvData, 'event-scan-stats');
  }

  // Export staff data to CSV
  function exportStaffDataToCsv(staffStats: StaffSaleStats[]) {
    const headers = ['Staff Member', 'Transactions', 'Tickets Sold', 'Total Sales', 'Last Transaction'];
    const csvData = staffStats.map(staff => [
      staff.staff_name,
      staff.transactions_processed.toString(),
      staff.tickets_sold.toString(),
      (staff.total_sales / 100).toFixed(2),
      new Date(staff.last_transaction).toLocaleString()
    ]);
    
    return generateCsv(headers, csvData, 'staff-sales-stats');
  }

  // Export transactions to CSV
  function exportTransactionsToCsv(transactions: TicketTransaction[]) {
    const headers = ['Date', 'Action', 'Staff Member', 'Location', 'Notes'];
    const csvData = transactions.map(tx => [
      new Date(tx.created_at).toLocaleString(),
      tx.action,
      tx.profiles?.display_name || 'Unknown',
      tx.location || 'Unknown',
      tx.notes || ''
    ]);
    
    return generateCsv(headers, csvData, 'ticket-transactions');
  }

  // Helper function to generate CSV and trigger download
  function generateCsv(headers: string[], data: string[][], filename: string) {
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    isLoading,
    error,
    getEventStats,
    getStaffStats,
    getEventTransactions,
    exportEventDataToCsv,
    exportStaffDataToCsv,
    exportTransactionsToCsv
  };
}
