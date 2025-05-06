'use server';

import { cookies } from 'next/headers';
import { createServerClient as createClient } from '@supabase/ssr';
import { executeWithRetry, batchQueries } from './server';

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

// Function to fetch site content from the server with retries
export async function fetchSiteContent() {
  'use server';
  
  const supabase = await getServerSideSupabaseClient();
  
  const { data, error } = await executeWithRetry<any[]>(
    () => supabase.from('site_content').select('*'),
    'fetchSiteContent'
  );
    
  if (error) {
    console.error("Error fetching site content:", error);
    return null;
  }
  
  // Organize content by section
  const organizedContent = (data || []).reduce((acc: Record<string, any>, item: any) => {
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

// Function to synchronize ticket counts with retries and batching
export async function syncTicketCounts(eventId: string) {
  'use server';
  
  const supabase = await getServerSideSupabaseClient();
  
  try {
    // Use batch queries to get orders and event data in parallel
    const [ordersResult, eventResult] = await batchQueries<any>([
      {
        queryFn: () => supabase
          .from('orders')
          .select('quantity')
          .eq('event_id', eventId)
          .eq('status', 'completed'),
        queryName: 'getOrderQuantities'
      },
      {
        queryFn: () => supabase
          .from('events')
          .select('tickets_total')
          .eq('id', eventId)
          .single(),
        queryName: 'getEventDetails'
      }
    ]);
    
    const { data: orderData, error: orderError } = ordersResult;
    const { data: eventData, error: eventError } = eventResult;
    
    if (orderError) {
      console.error('Error getting order quantities:', orderError);
      return { success: false, error: orderError.message };
    }
    
    if (eventError) {
      console.error('Error getting event:', eventError);
      return { success: false, error: eventError.message };
    }
    
    // Calculate total sold tickets
    const soldTickets = (orderData || []).reduce((total: number, order: any) => total + (order.quantity || 0), 0);
    
    // Calculate tickets remaining
    const ticketsTotal = eventData?.tickets_total || 0;
    const ticketsRemaining = Math.max(0, ticketsTotal - soldTickets);
    const soldOut = ticketsRemaining <= 0;
    
    // Update the event with retries
    const { error: updateError } = await executeWithRetry<any>(
      () => supabase
        .from('events')
        .update({
          tickets_remaining: ticketsRemaining,
          sold_out: soldOut
        })
        .eq('id', eventId),
      'updateEventTickets'
    );
    
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

/**
 * Fetch event artists with retries and batching
 * @param eventId The event ID to fetch artists for
 * @returns Array of event artists with their details
 */
export async function fetchEventArtists(eventId: string) {
  'use server';
  
  const supabase = await getServerSideSupabaseClient();
  
  const { data, error } = await executeWithRetry<any[]>(
    () => supabase
      .from('event_artists')
      .select('artist_id,performance_time,artists:artist_id(id,name,image,bio,mix_url)')
      .eq('event_id', eventId),
    'fetchEventArtists'
  );
  
  if (error) {
    console.error('Error fetching event artists:', error);
    return { success: false, error: error.message, data: null };
  }
  
  return { success: true, data };
}

/**
 * Fetch multiple events' data in a single batch request
 * @param eventIds Array of event IDs to fetch
 * @returns Object with event IDs as keys and their data as values
 */
export async function batchFetchEvents(eventIds: string[]) {
  'use server';
  
  const supabase = await getServerSideSupabaseClient();
  
  try {
    // Create a batch of queries, one for each event
    const queries = eventIds.map(eventId => ({
      queryFn: () => supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single(),
      queryName: `fetchEvent:${eventId}`
    }));
    
    // Execute all queries in parallel
    const results = await batchQueries<any>(queries);
    
    // Transform results into a map of eventId -> eventData
    const eventsMap = eventIds.reduce((acc: Record<string, any>, eventId, index) => {
      const { data, error } = results[index];
      if (!error && data) {
        acc[eventId] = data;
      }
      return acc;
    }, {});
    
    return { success: true, data: eventsMap };
  } catch (error) {
    console.error('Error in batch fetch events:', error);
    return { success: false, error: String(error), data: null };
  }
}
