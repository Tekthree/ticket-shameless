'use server';

import { cookies } from 'next/headers';
import { createServerClient as createClient } from '@supabase/ssr';

// Default placeholder values for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export async function getServerSideSupabaseClient() {
  const cookieStore = cookies();
  
  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, any>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, any>) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// Function to fetch site content from the server
export async function fetchSiteContent() {
  'use server';
  
  const supabase = await getServerSideSupabaseClient();
  
  const { data, error } = await supabase
    .from('site_content')
    .select('*');
    
  if (error) {
    console.error("Error fetching site content:", error);
    return null;
  }
  
  // Organize content by section
  const organizedContent = data.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = {};
    }
    acc[item.section][item.field] = {
      content: item.content,
      type: item.content_type,
      id: item.id
    };
    return acc;
  }, {});
  
  return organizedContent;
}

// Function to synchronize ticket counts
export async function syncTicketCounts(eventId: string) {
  'use server';
  
  const supabase = await getServerSideSupabaseClient();
  
  try {
    // Get total tickets from orders
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('quantity')
      .eq('event_id', eventId)
      .eq('status', 'completed');
    
    if (orderError) {
      console.error('Error getting order quantities:', orderError);
      return { success: false, error: orderError.message };
    }
    
    // Calculate total sold tickets
    const soldTickets = orderData.reduce((total, order) => total + order.quantity, 0);
    
    // Get the event
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('tickets_total')
      .eq('id', eventId)
      .single();
    
    if (eventError) {
      console.error('Error getting event:', eventError);
      return { success: false, error: eventError.message };
    }
    
    // Calculate tickets remaining
    const ticketsRemaining = Math.max(0, eventData.tickets_total - soldTickets);
    const soldOut = ticketsRemaining <= 0;
    
    // Update the event
    const { error: updateError } = await supabase
      .from('events')
      .update({
        tickets_remaining: ticketsRemaining,
        sold_out: soldOut
      })
      .eq('id', eventId);
    
    if (updateError) {
      console.error('Error updating event ticket counts:', updateError);
      return { success: false, error: updateError.message };
    }
    
    return { 
      success: true, 
      ticketsRemaining: ticketsRemaining,
      soldOut: soldOut
    };
  } catch (err) {
    console.error('Exception in syncTicketCounts:', err);
    return { success: false, error: String(err) };
  }
}
