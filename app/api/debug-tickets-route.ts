import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }
    
    const supabase = createClient();
    
    // Get the event information
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('tickets_total, tickets_remaining')
      .eq('id', eventId)
      .single();
    
    if (eventError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found' 
      }, { status: 404 });
    }
    
    // Count total tickets sold from orders
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('quantity')
      .eq('event_id', eventId)
      .eq('status', 'completed');
    
    if (orderError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get order data' 
      }, { status: 500 });
    }
    
    // Calculate correct tickets remaining
    const totalSold = orderData.reduce((sum, order) => sum + order.quantity, 0);
    const correctTicketsRemaining = Math.max(0, event.tickets_total - totalSold);
    
    // Check if counts match
    const countsMatch = event.tickets_remaining === correctTicketsRemaining;
    
    return NextResponse.json({
      success: true,
      event: {
        id: eventId,
        ticketsTotal: event.tickets_total,
        ticketsRemaining: event.tickets_remaining
      },
      orders: {
        count: orderData.length,
        totalSold: totalSold
      },
      correctTicketsRemaining: correctTicketsRemaining,
      countsMatch: countsMatch
    });
    
  } catch (error) {
    console.error('Error checking ticket counts:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}