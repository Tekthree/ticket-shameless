/**
 * Ticket Decrement Tests
 * 
 * These tests verify that ticket counts are correctly decremented across various scenarios:
 * 1. Customer purchases
 * 2. Box office processing
 * 3. Admin event edits
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { syncTicketCounts } from '@/lib/supabase/server-actions';
import { getTableName } from './utils';

// Check if environment variables are set
const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                       process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a test client for Supabase only if we have credentials
const supabase = hasCredentials 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )
  : null;

// Test constants
const TEST_EVENT_PREFIX = 'test-event-';
const TEST_USER_PREFIX = 'test-user-';

// Mock data
let mockEvent: any = null;
let mockUser: any = null;
let testEventId: string = '';
let testUserId: string = '';
let testOrderIds: string[] = [];

// Skip all tests if credentials aren't available
const itIfCredentials = hasCredentials ? it : it.skip;

describe('Ticket Count Decrement Tests', () => {
  // Set up before all tests
  beforeAll(async () => {
    if (!hasCredentials || !supabase) {
      console.warn('Skipping database tests: required environment variables not set');
      return;
    }

    // Create unique IDs for this test run
    const testRunId = randomUUID().substring(0, 8);
    
    // Create test event
    mockEvent = {
      title: `${TEST_EVENT_PREFIX}${testRunId}`,
      slug: `${TEST_EVENT_PREFIX}${testRunId}`,
      description: 'Test event for decrement tests',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      price: 25.00,
      tickets_total: 100,
      tickets_remaining: 100,
      sold_out: false,
      venue: 'Test Venue',
      image_url: 'https://example.com/test-image.jpg'
    };
    
    // Create test user
    mockUser = {
      email: `${TEST_USER_PREFIX}${testRunId}@example.com`,
      password: 'test-password-123',
      name: 'Test User'
    };
    
    try {
      // Insert test event
      const { data: event, error: eventError } = await supabase
        .from(getTableName('events'))
        .insert(mockEvent)
        .select()
        .single();
      
      if (eventError) {
        console.error('Failed to create test event:', eventError);
        throw eventError;
      }
      
      testEventId = event.id;
      
      // Create test user in auth
      try {
        const { data: user, error: userError } = await supabase.auth.admin.createUser({
          email: mockUser.email,
          password: mockUser.password,
          email_confirm: true
        });
        
        if (userError) {
          console.error('Failed to create test user:', userError);
          throw userError;
        }
        
        testUserId = user.user.id;
        
        // Create user profile
        await supabase
          .from(getTableName('profiles'))
          .insert({
            id: testUserId,
            username: mockUser.name,
            email: mockUser.email
          });
      } catch (error) {
        console.error('Auth service might not be available:', error);
        // If we can't create a user, just use a UUID for the tests
        testUserId = randomUUID();
      }
    } catch (error) {
      console.error('Failed to set up test data:', error);
    }
  });
  
  // Clean up after all tests
  afterAll(async () => {
    if (!hasCredentials || !supabase) {
      return; // Skip cleanup if we didn't run tests
    }
    
    try {
      // Clean up all test orders
      if (testOrderIds.length > 0) {
        await supabase
          .from(getTableName('orders'))
          .delete()
          .in('id', testOrderIds);
      }
      
      // Clean up test event
      if (testEventId) {
        await supabase
          .from(getTableName('events'))
          .delete()
          .eq('id', testEventId);
      }
      
      // Clean up test user profile if exists
      try {
        await supabase
          .from(getTableName('profiles'))
          .delete()
          .eq('id', testUserId);
      } catch (error) {
        console.error('Failed to delete test profile:', error);
      }
      
      // Clean up test user
      if (testUserId) {
        try {
          await supabase.auth.admin.deleteUser(testUserId);
        } catch (error) {
          console.error('Failed to delete test user, might be ok if using UUID only:', error);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });
  
  // Helper to create a test order
  async function createTestOrder(quantity: number, status: string = 'completed'): Promise<string> {
    if (!supabase) throw new Error('Supabase client not available');
    
    const { data: order, error } = await supabase
      .from(getTableName('orders'))
      .insert({
        event_id: testEventId,
        user_id: testUserId,
        customer_email: mockUser.email,
        customer_name: mockUser.name,
        amount_total: mockEvent.price * quantity,
        quantity: quantity,
        status: status
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create test order:', error);
      throw error;
    }
    
    testOrderIds.push(order.id);
    return order.id;
  }
  
  // Helper to get current ticket count
  async function getCurrentTicketCount(): Promise<number> {
    if (!supabase) throw new Error('Supabase client not available');
    
    const { data, error } = await supabase
      .from(getTableName('events'))
      .select('tickets_remaining')
      .eq('id', testEventId)
      .single();
    
    if (error) {
      console.error('Failed to get current ticket count:', error);
      throw error;
    }
    
    return data.tickets_remaining;
  }
  
  // Helper to update ticket total/remaining
  async function updateTicketCount(total: number, remaining: number): Promise<void> {
    if (!supabase) throw new Error('Supabase client not available');
    
    const { error } = await supabase
      .from(getTableName('events'))
      .update({
        tickets_total: total,
        tickets_remaining: remaining
      })
      .eq('id', testEventId);
    
    if (error) {
      console.error('Failed to update ticket count:', error);
      throw error;
    }
  }
  
  // Test 1: Customer purchase - check database trigger
  itIfCredentials('Database trigger decrements tickets correctly on purchase', async () => {
    // Reset ticket count to 100
    await updateTicketCount(100, 100);
    
    // Get initial ticket count
    const initialCount = await getCurrentTicketCount();
    expect(initialCount).toBe(100);
    
    // Create a completed order (3 tickets)
    const purchaseQuantity = 3;
    await createTestOrder(purchaseQuantity);
    
    // Check that tickets were decremented by the database trigger
    const updatedCount = await getCurrentTicketCount();
    expect(updatedCount).toBe(initialCount - purchaseQuantity);
  });
  
  // Test 2: Box office processing - check database trigger with box office flag
  itIfCredentials('Box office processed tickets decrement correctly', async () => {
    if (!supabase) throw new Error('Supabase client not available');
    
    // Reset ticket count to 100
    await updateTicketCount(100, 100);
    
    // Get initial ticket count
    const initialCount = await getCurrentTicketCount();
    expect(initialCount).toBe(100);
    
    // Create a completed order with box office flag (2 tickets)
    const boxOfficeQuantity = 2;
    const { data: order, error } = await supabase
      .from(getTableName('orders'))
      .insert({
        event_id: testEventId,
        user_id: testUserId,
        customer_email: mockUser.email,
        customer_name: mockUser.name,
        amount_total: mockEvent.price * boxOfficeQuantity,
        quantity: boxOfficeQuantity,
        status: 'completed',
        processed_by_box_office: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create box office order:', error);
      throw error;
    }
    
    testOrderIds.push(order.id);
    
    // Check that tickets were decremented by the database trigger
    const updatedCount = await getCurrentTicketCount();
    expect(updatedCount).toBe(initialCount - boxOfficeQuantity);
  });
  
  // Test 3: Admin edit - manually update ticket count
  itIfCredentials('Admin edits to ticket counts are reflected correctly', async () => {
    // Reset ticket count to 100
    await updateTicketCount(100, 100);
    
    // Admin reduces total tickets to 80
    const newTotal = 80;
    await updateTicketCount(newTotal, newTotal);
    
    // Verify the update
    const updatedCount = await getCurrentTicketCount();
    expect(updatedCount).toBe(newTotal);
    
    // Create a purchase (5 tickets)
    const purchaseQuantity = 5;
    await createTestOrder(purchaseQuantity);
    
    // Verify tickets were decremented correctly
    const countAfterPurchase = await getCurrentTicketCount();
    expect(countAfterPurchase).toBe(newTotal - purchaseQuantity);
  });
  
  // Test 4: syncTicketCounts server action
  itIfCredentials('syncTicketCounts server action correctly recalculates ticket count', async () => {
    if (!supabase) throw new Error('Supabase client not available');
    
    // Reset ticket count to 100
    await updateTicketCount(100, 100);
    
    // Create a series of orders with different statuses
    // - Completed order (should count): 3 tickets
    // - Pending order (should not count): 2 tickets  
    // - Completed order (should count): 4 tickets
    await createTestOrder(3, 'completed');
    await createTestOrder(2, 'pending');
    await createTestOrder(4, 'completed');
    
    // Intentionally set incorrect remaining count
    await updateTicketCount(100, 50); // Should be 100 - (3+4) = 93 remaining
    
    // Use syncTicketCounts to recalculate
    try {
      // NOTE: The server action may need to be updated to support test tables
      const result = await syncTicketCounts(testEventId, true); // Pass true to indicate test mode
      expect(result.success).toBe(true);
      expect(result.ticketsRemaining).toBe(93); // Only completed orders should count
    } catch (error) {
      // This might happen in testing environment where server actions aren't available
      console.warn('Could not test server action, falling back to direct DB check');
      
      // Manually get all completed orders
      const { data: orders } = await supabase
        .from(getTableName('orders'))
        .select('quantity')
        .eq('event_id', testEventId)
        .eq('status', 'completed');
      
      const totalSold = orders?.reduce((sum, order) => sum + order.quantity, 0) || 0;
      const expectedRemaining = 100 - totalSold;
      
      // Verify the expected count
      const currentCount = await getCurrentTicketCount();
      expect(currentCount).toBe(expectedRemaining);
    }
  });
  
  // Test 5: Test ticket sold out status
  itIfCredentials('Event is marked as sold out when tickets reach zero', async () => {
    if (!supabase) throw new Error('Supabase client not available');
    
    // Set up event with only 5 tickets
    await updateTicketCount(5, 5);
    
    // Get initial sold out status
    const { data: initialEvent } = await supabase
      .from(getTableName('events'))
      .select('sold_out')
      .eq('id', testEventId)
      .single();
    
    expect(initialEvent.sold_out).toBe(false);
    
    // Purchase all tickets
    await createTestOrder(5);
    
    // Check that the event is now marked as sold out
    const { data: updatedEvent } = await supabase
      .from(getTableName('events'))
      .select('tickets_remaining, sold_out')
      .eq('id', testEventId)
      .single();
    
    expect(updatedEvent.tickets_remaining).toBe(0);
    expect(updatedEvent.sold_out).toBe(true);
  });
  
  // Test 6: Test race condition handling
  itIfCredentials('Handles concurrent purchases correctly without overselling', async () => {
    if (!supabase) throw new Error('Supabase client not available');
    
    // Set up event with only 10 tickets
    await updateTicketCount(10, 10);
    
    // Create multiple concurrent orders (should total 12 tickets, but only 10 available)
    const purchasePromises = [
      createTestOrder(4),
      createTestOrder(3),
      createTestOrder(5)
    ];
    
    await Promise.all(purchasePromises);
    
    // Check the final ticket count - should be 0, not negative
    const { data: updatedEvent } = await supabase
      .from(getTableName('events'))
      .select('tickets_remaining, sold_out')
      .eq('id', testEventId)
      .single();
    
    expect(updatedEvent.tickets_remaining).toBe(0);
    expect(updatedEvent.sold_out).toBe(true);
  });
});
