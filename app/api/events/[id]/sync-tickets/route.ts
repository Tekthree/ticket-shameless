import { NextRequest, NextResponse } from 'next/server';
import { syncTicketCounts } from '@/lib/supabase/server-actions';

export async function POST(
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
    // Call the server action to sync ticket counts
    const result = await syncTicketCounts(id);
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to sync ticket counts' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      ticketsRemaining: result.ticketsRemaining,
      soldOut: result.soldOut
    });
  } catch (error) {
    console.error('Error syncing ticket counts:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}