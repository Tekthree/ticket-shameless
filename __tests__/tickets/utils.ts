/**
 * Ticket Testing Utilities
 * 
 * These utilities help with testing ticket-related functionality
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Check if environment variables are set
const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                       process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use test_ prefix for tables when in test mode (default to true for safety)
const TEST_MODE = process.env.TEST_MODE !== 'false';
const TEST_PREFIX = TEST_MODE ? 'test_' : '';

// Helper to get the prefixed table name
export const getTableName = (table: string): string => {
  return `${TEST_PREFIX}${table}`;
};

// Create a Supabase client for testing only if we have credentials
export const getTestSupabaseClient = () => {
  if (!hasCredentials) {
    throw new Error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
};

// Create a test event
export const createTestEvent = async (ticketsTotal: number = 100) => {
  if (!hasCredentials) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = getTestSupabaseClient();
  const testRunId = randomUUID().substring(0, 8);
  
  const mockEvent = {
    title: `Test Event ${testRunId}`,
    slug: `test-event-${testRunId}`,
    description: 'Automated test event',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    price: 25.00,
    tickets_total: ticketsTotal,
    tickets_remaining: ticketsTotal,
    sold_out: false,
    venue: 'Test Venue',
    image_url: 'https://example.com/test-image.jpg'
  };
  
  const { data, error } = await supabase
    .from(getTableName('events'))
    .insert(mockEvent)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test event: ${error.message}`);
  }
  
  return data;
};

// Delete a test event
export const deleteTestEvent = async (eventId: string) => {
  if (!hasCredentials) return;
  
  try {
    const supabase = getTestSupabaseClient();
    
    const { error } = await supabase
      .from(getTableName('events'))
      .delete()
      .eq('id', eventId);
    
    if (error) {
      console.error(`Failed to delete test event: ${error.message}`);
    }
  } catch (error) {
    console.error('Error during event deletion:', error);
  }
};

// Create a test order
export const createTestOrder = async (eventId: string, quantity: number, status: string = 'completed') => {
  if (!hasCredentials) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = getTestSupabaseClient();
  const testUserId = randomUUID();
  
  const { data, error } = await supabase
    .from(getTableName('orders'))
    .insert({
      event_id: eventId,
      user_id: testUserId,
      customer_email: `test-${randomUUID().substring(0, 8)}@example.com`,
      customer_name: 'Test Customer',
      amount_total: 25.00 * quantity, // Assuming $25 price
      quantity: quantity,
      status: status
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test order: ${error.message}`);
  }
  
  return data;
};

// Delete a test order
export const deleteTestOrder = async (orderId: string) => {
  if (!hasCredentials) return;
  
  try {
    const supabase = getTestSupabaseClient();
    
    const { error } = await supabase
      .from(getTableName('orders'))
      .delete()
      .eq('id', orderId);
    
    if (error) {
      console.error(`Failed to delete test order: ${error.message}`);
    }
  } catch (error) {
    console.error('Error during order deletion:', error);
  }
};

// Get current ticket count for an event
export const getEventTicketCount = async (eventId: string) => {
  if (!hasCredentials) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = getTestSupabaseClient();
  
  const { data, error } = await supabase
    .from(getTableName('events'))
    .select('tickets_total, tickets_remaining, sold_out')
    .eq('id', eventId)
    .single();
  
  if (error) {
    throw new Error(`Failed to get event ticket count: ${error.message}`);
  }
  
  return {
    total: data.tickets_total,
    remaining: data.tickets_remaining,
    soldOut: data.sold_out
  };
};

// Update event ticket count (for admin edit tests)
export const updateEventTicketCount = async (eventId: string, total: number, remaining: number) => {
  if (!hasCredentials) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = getTestSupabaseClient();
  
  const { error } = await supabase
    .from(getTableName('events'))
    .update({
      tickets_total: total,
      tickets_remaining: remaining,
      sold_out: remaining <= 0
    })
    .eq('id', eventId);
  
  if (error) {
    throw new Error(`Failed to update event ticket count: ${error.message}`);
  }
};

// Create all necessary test resources
export const setupTicketTest = async (ticketsTotal: number = 100) => {
  if (!hasCredentials) {
    // Return mock data for tests that don't require actual database
    console.warn('Missing Supabase credentials, returning mock test data');
    const mockEventId = `mock-event-${randomUUID()}`;
    return {
      eventId: mockEventId,
      cleanup: async () => {} // No-op cleanup
    };
  }
  
  try {
    // Create test event
    const event = await createTestEvent(ticketsTotal);
    
    return {
      eventId: event.id,
      cleanup: async () => {
        await deleteTestEvent(event.id);
      }
    };
  } catch (error) {
    console.error('Failed to set up ticket test:', error);
    throw error;
  }
};
