import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Toaster } from 'react-hot-toast';
import EventsTicketManager from '@/components/admin/EventsTicketManager';

export const metadata: Metadata = {
  title: 'Ticket Count Management | Ticket Shameless',
  description: 'Manage and fix ticket counts for events',
};

export default async function TicketCountsPage() {
  const supabase = createClient();
  
  // Get all events
  const { data: events } = await supabase
    .from('events')
    .select('id, title, date, tickets_total, tickets_remaining, sold_out')
    .order('date', { ascending: false });
  
  // Get events with potential issues
  const { data: fixResult } = await supabase
    .rpc('fix_all_ticket_counts');
  
  return (
    <div className="container py-10">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ticket Count Management</h1>
          <p className="text-muted-foreground">
            Verify and fix ticket count issues for events
          </p>
        </div>
      </div>
      
      {/* Pass data to the client component */}
      <EventsTicketManager 
        events={events || []} 
        fixResults={fixResult || []} 
      />
    </div>
  );
}