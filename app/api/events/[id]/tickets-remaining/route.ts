import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  if (!id) {
    return NextResponse.json({ 
      success: false, 
      error: 'Event ID is required' 
    }, { status: 400 });
  }
  
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('events')
      .select('tickets_remaining, sold_out')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching event ticket data:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      ticketsRemaining: data.tickets_remaining,
      soldOut: data.sold_out
    });
  } catch (error) {
    console.error('Error fetching ticket count:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}