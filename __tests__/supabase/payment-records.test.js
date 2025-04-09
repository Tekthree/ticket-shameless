/**
 * @jest-environment node
 */

import { createClient } from '@supabase/supabase-js';
import { mockSupabaseQueryResponse } from '../utils/supabase-mock';

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

describe('Payment Records in Supabase', () => {
  let mockSupabase;
  let mockFrom;
  let mockInsert;
  let mockSelect;
  let mockUpdate;
  let mockEq;
  let mockOrder;
  let mockLimit;
  let mockSingle;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock implementations
    mockEq = jest.fn().mockReturnThis();
    mockOrder = jest.fn().mockReturnThis();
    mockLimit = jest.fn().mockReturnThis();
    mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    
    mockSelect = jest.fn().mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
    });
    
    mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        data: null, 
        error: null
      }),
    });
    
    mockUpdate = jest.fn().mockReturnValue({
      eq: mockEq,
    });
    
    mockFrom = jest.fn().mockImplementation((table) => {
      return {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        eq: mockEq,
        order: mockOrder,
        limit: mockLimit,
        single: mockSingle,
      };
    });
    
    mockSupabase = {
      from: mockFrom,
      auth: {
        getUser: jest.fn(),
      },
    };
    
    createClient.mockReturnValue(mockSupabase);
  });
  
  describe('Creating order records', () => {
    test('successfully creates an order record', async () => {
      // Mock successful insert
      const mockSelectAfterInsert = jest.fn().mockReturnValue(
        mockSupabaseQueryResponse(true, [{ id: 'order-123' }])
      );
      
      mockInsert.mockReturnValue({
        select: mockSelectAfterInsert,
      });
      
      // Create a helper function to simulate your application's order creation
      const createOrder = async (orderData) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select();
        
        return { data, error };
      };
      
      // Test order creation
      const orderData = {
        event_id: '123e4567-e89b-12d3-a456-426614174000',
        stripe_session_id: 'cs_test_123',
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        amount_total: 25,
        status: 'completed',
        quantity: 2,
      };
      
      const { data, error } = await createOrder(orderData);
      
      // Verify Supabase calls
      expect(mockFrom).toHaveBeenCalledWith('orders');
      expect(mockInsert).toHaveBeenCalledWith(orderData);
      
      // Verify result
      expect(error).toBeNull();
      expect(data).toEqual([{ id: 'order-123' }]);
    });
    
    test('handles database error when creating order', async () => {
      // Mock failed insert
      const mockSelectAfterFailedInsert = jest.fn().mockReturnValue(
        mockSupabaseQueryResponse(false, null, 'Database constraint violation')
      );
      
      mockInsert.mockReturnValue({
        select: mockSelectAfterFailedInsert,
      });
      
      // Create a helper function to simulate your application's order creation
      const createOrder = async (orderData) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select();
        
        return { data, error };
      };
      
      // Test order creation with invalid data
      const invalidOrderData = {
        // Missing required fields
        stripe_session_id: 'cs_test_123',
      };
      
      const { data, error } = await createOrder(invalidOrderData);
      
      // Verify result
      expect(data).toBeNull();
      expect(error).toEqual({
        message: 'Database constraint violation',
        code: 'PGRST_ERROR',
      });
    });
  });
  
  describe('Updating event ticket counts', () => {
    test('successfully updates ticket count after purchase', async () => {
      // Mock successful select
      const mockSingleForTickets = jest.fn().mockResolvedValue(
        mockSupabaseQueryResponse(true, { id: 'event-123', tickets_remaining: 10 })
      );
      
      const mockEqForSelect = jest.fn().mockReturnValue({
        single: mockSingleForTickets,
      });
      
      mockSelect.mockReturnValue({
        eq: mockEqForSelect,
      });
      
      // Mock successful update
      const mockEqForUpdate = jest.fn().mockResolvedValue(
        mockSupabaseQueryResponse(true, { id: 'event-123', tickets_remaining: 8, sold_out: false })
      );
      
      mockUpdate.mockReturnValue({
        eq: mockEqForUpdate,
      });
      
      // Create helper functions to simulate your application's ticket update logic
      const getEventTickets = async (eventId) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('events')
          .select('tickets_remaining')
          .eq('id', eventId)
          .single();
        
        return { data, error };
      };
      
      const updateEventTickets = async (eventId, newCount, soldOut) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('events')
          .update({
            tickets_remaining: newCount,
            sold_out: soldOut,
          })
          .eq('id', eventId);
        
        return { data, error };
      };
      
      // Test the ticket update flow
      const eventId = 'event-123';
      const purchaseQuantity = 2;
      
      // First get current tickets
      const { data: eventData } = await getEventTickets(eventId);
      
      // Calculate new ticket count
      const newTicketsRemaining = eventData.tickets_remaining - purchaseQuantity;
      const soldOut = newTicketsRemaining <= 0;
      
      // Update the event
      const { error } = await updateEventTickets(eventId, newTicketsRemaining, soldOut);
      
      // Verify Supabase calls
      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
      
      // Verify result
      expect(error).toBeNull();
    });
    
    test('handles sold out condition correctly', async () => {
      // Mock event with only 1 ticket left
      const mockSingleForLowTickets = jest.fn().mockResolvedValue(
        mockSupabaseQueryResponse(true, { id: 'event-123', tickets_remaining: 1 })
      );
      
      const mockEqForLowTickets = jest.fn().mockReturnValue({
        single: mockSingleForLowTickets,
      });
      
      mockSelect.mockReturnValue({
        eq: mockEqForLowTickets,
      });
      
      // Mock successful sold-out update
      const mockEqForSoldOut = jest.fn().mockResolvedValue(
        mockSupabaseQueryResponse(true, { id: 'event-123', tickets_remaining: 0, sold_out: true })
      );
      
      mockUpdate.mockReturnValue({
        eq: mockEqForSoldOut,
      });
      
      // Create helper functions
      const getEventTickets = async (eventId) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('events')
          .select('tickets_remaining')
          .eq('id', eventId)
          .single();
        
        return { data, error };
      };
      
      const updateEventTickets = async (eventId, newCount, soldOut) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('events')
          .update({
            tickets_remaining: newCount,
            sold_out: soldOut,
          })
          .eq('id', eventId);
        
        return { data, error };
      };
      
      // Test the ticket update flow for a purchase that will sell out the event
      const eventId = 'event-123';
      const purchaseQuantity = 2; // More than available
      
      // First get current tickets
      const { data: eventData } = await getEventTickets(eventId);
      
      // Calculate new ticket count, ensuring it doesn't go below zero
      const newTicketsRemaining = Math.max(0, eventData.tickets_remaining - purchaseQuantity);
      const soldOut = newTicketsRemaining <= 0;
      
      // Update the event
      const { error } = await updateEventTickets(eventId, newTicketsRemaining, soldOut);
      
      // Verify the sold out flag was set
      expect(soldOut).toBe(true);
      expect(newTicketsRemaining).toBe(0);
      expect(error).toBeNull();
    });
  });
  
  describe('Retrieving order history', () => {
    test('successfully retrieves user order history', async () => {
      // Mock successful select for order history
      const mockOrderData = [
        { 
          id: 'order-1',
          event_id: 'event-123',
          customer_email: 'test@example.com',
          amount_total: 25,
          created_at: '2025-04-01T12:00:00Z'
        },
        {
          id: 'order-2',
          event_id: 'event-456',
          customer_email: 'test@example.com',
          amount_total: 35,
          created_at: '2025-04-02T14:30:00Z'
        }
      ];
      
      const mockOrderResponse = mockSupabaseQueryResponse(true, mockOrderData);
      
      const mockOrderForHistory = jest.fn().mockReturnValue(mockOrderResponse);
      
      const mockEqForHistory = jest.fn().mockReturnValue({
        order: mockOrderForHistory,
      });
      
      mockSelect.mockReturnValue({
        eq: mockEqForHistory,
      });
      
      // Create a helper function to simulate retrieving order history
      const getUserOrders = async (userId) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        return { data, error };
      };
      
      // Test order history retrieval
      const userId = 'user-123';
      const { data, error } = await getUserOrders(userId);
      
      // Verify Supabase calls
      expect(mockFrom).toHaveBeenCalledWith('orders');
      expect(mockSelect).toHaveBeenCalled();
      
      // Verify result
      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('order-1');
      expect(data[1].id).toBe('order-2');
    });
  });
});
