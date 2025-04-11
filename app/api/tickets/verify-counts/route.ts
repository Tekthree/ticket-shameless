import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { eventId, fix = false } = await request.json();
    
    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }
    
    const supabase = createClient();
    
    // Check ticket counts using the database function
    const { data: checkResult, error: checkError } = await supabase
      .rpc('check_ticket_counts', { event_uuid: eventId });
    
    if (checkError) {
      console.error('Error checking ticket counts:', checkError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check ticket counts' 
      }, { status: 500 });
    }
    
    // If there's a discrepancy and fix is requested, fix the counts
    if (checkResult.discrepancy !== 0 && fix) {
      const { error: fixError } = await supabase
        .rpc('fix_ticket_counts', { event_uuid: eventId });
      
      if (fixError) {
        console.error('Error fixing ticket counts:', fixError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fix ticket counts' 
        }, { status: 500 });
      }
      
      // Get the updated counts
      const { data: updatedCheck, error: updatedError } = await supabase
        .rpc('check_ticket_counts', { event_uuid: eventId });
      
      if (updatedError) {
        console.error('Error getting updated counts:', updatedError);
        return NextResponse.json({ 
          success: true,
          message: 'Counts fixed but unable to verify new values',
          original: checkResult
        });
      }
      
      return NextResponse.json({
        success: true,
        fixed: true,
        before: {
          ticketsTotal: checkResult.tickets_total,
          currentRemaining: checkResult.current_remaining,
          calculatedRemaining: checkResult.calculated_remaining,
          discrepancy: checkResult.discrepancy
        },
        after: {
          ticketsTotal: updatedCheck.tickets_total,
          currentRemaining: updatedCheck.current_remaining,
          calculatedRemaining: updatedCheck.calculated_remaining,
          discrepancy: updatedCheck.discrepancy
        }
      });
    }
    
    // If no fix needed or requested, just return the check results
    return NextResponse.json({
      success: true,
      fixed: false,
      counts: {
        ticketsTotal: checkResult.tickets_total,
        currentRemaining: checkResult.current_remaining,
        calculatedRemaining: checkResult.calculated_remaining,
        discrepancy: checkResult.discrepancy
      }
    });
    
  } catch (error) {
    console.error('Error verifying ticket counts:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}