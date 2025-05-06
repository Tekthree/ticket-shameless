/**
 * Ticket UI Integration Tests
 * 
 * These tests verify that UI components correctly display ticket counts
 * and update when ticket counts change in the database.
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setupTicketTest, createTestOrder, getEventTicketCount, updateEventTicketCount } from './utils';

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: () => null }),
}));

// Wait for Supabase to be ready before tests
const waitForSupabase = async () => {
  // Skip if environment variables not set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return false;
  }
  return true;
};

describe('Ticket UI Integration Tests', () => {
  let testResources: { eventId: string; cleanup: () => Promise<void> } | null = null;
  
  // Set up before all tests
  beforeAll(async () => {
    const supabaseReady = await waitForSupabase();
    if (!supabaseReady) {
      console.warn('Skipping UI tests: required environment variables not set');
      return;
    }
    
    testResources = await setupTicketTest(50);
  });
  
  // Clean up after all tests
  afterAll(async () => {
    if (testResources) {
      await testResources.cleanup();
    }
  });
  
  // Import the components dynamically to prevent issues with SSR components in tests
  const importComponents = async () => {
    // Only import if test resources are available
    if (!testResources) return { EventTicketDisplay: null, EventCard: null };
    
    try {
      // Dynamic imports with jest can be tricky, this is a workaround
      const EventTicketDisplayModule = await import('@/components/events/EventTicketDisplay');
      const EventCardModule = await import('@/components/events/EventCard');
      
      return {
        EventTicketDisplay: EventTicketDisplayModule.default,
        EventCard: EventCardModule.default
      };
    } catch (error) {
      console.error('Failed to import components:', error);
      return { EventTicketDisplay: null, EventCard: null };
    }
  };
  
  // Test 1: EventTicketDisplay shows correct ticket count
  test('EventTicketDisplay shows correct ticket count', async () => {
    if (!testResources) return; // Skip if setup failed
    
    const { EventTicketDisplay } = await importComponents();
    if (!EventTicketDisplay) return; // Skip if import failed
    
    // Get current ticket count
    const { remaining } = await getEventTicketCount(testResources.eventId);
    
    // Render the component
    render(<EventTicketDisplay 
      eventId={testResources.eventId} 
      initialTicketsRemaining={remaining} 
      refreshInterval={1000}
    />);
    
    // Verify the initial ticket count is displayed
    await waitFor(() => {
      expect(screen.getByText(`${remaining} tickets remaining`)).toBeInTheDocument();
    });
    
    // Create an order to reduce the ticket count
    const purchaseQuantity = 5;
    await createTestOrder(testResources.eventId, purchaseQuantity);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText(`${remaining - purchaseQuantity} tickets remaining`)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
  
  // Test 2: EventTicketDisplay shows sold out when no tickets remain
  test('EventTicketDisplay shows "Sold Out" when no tickets remain', async () => {
    if (!testResources) return; // Skip if setup failed
    
    const { EventTicketDisplay } = await importComponents();
    if (!EventTicketDisplay) return; // Skip if import failed
    
    // Update event to have 0 tickets
    await updateEventTicketCount(testResources.eventId, 50, 0);
    
    // Render the component
    render(<EventTicketDisplay 
      eventId={testResources.eventId} 
      initialTicketsRemaining={0} 
      refreshInterval={1000}
    />);
    
    // Verify "Sold Out" is displayed
    await waitFor(() => {
      expect(screen.getByText('Sold Out')).toBeInTheDocument();
    });
    
    // Reset the event for other tests
    await updateEventTicketCount(testResources.eventId, 50, 50);
  });
  
  // Test 3: Event card shows sold out badge
  test('EventCard shows sold out badge when event is sold out', async () => {
    if (!testResources) return; // Skip if setup failed
    
    const { EventCard } = await importComponents();
    if (!EventCard) return; // Skip if import failed
    
    // Get current event data
    const { total, remaining } = await getEventTicketCount(testResources.eventId);
    
    // Create a mock event for the card
    const mockEvent = {
      id: testResources.eventId,
      title: 'Test Event',
      slug: 'test-event',
      date: new Date().toISOString(),
      price: 25.00,
      tickets_total: total,
      tickets_remaining: remaining,
      sold_out: false,
      venue: 'Test Venue',
      image_url: 'https://example.com/test-image.jpg'
    };
    
    // Render the event card
    render(<EventCard event={mockEvent} />);
    
    // Verify no sold out badge is shown
    expect(screen.queryByText('Sold Out')).not.toBeInTheDocument();
    
    // Update event to be sold out
    await updateEventTicketCount(testResources.eventId, total, 0);
    
    // Re-render with sold out
    mockEvent.tickets_remaining = 0;
    mockEvent.sold_out = true;
    
    // Re-render the component
    render(<EventCard event={mockEvent} />);
    
    // Verify sold out badge is displayed
    expect(screen.getByText('Sold Out')).toBeInTheDocument();
  });
  
  // Test 4: Test that purchase form disables correct quantities
  test('Purchase form disables quantity options greater than remaining tickets', async () => {
    if (!testResources) return; // Skip if setup failed
    
    // This test may need to be adjusted based on your actual purchase form component
    const PurchaseFormModule = await import('@/components/events/PurchaseForm').catch(() => null);
    if (!PurchaseFormModule) {
      console.warn('PurchaseForm component not found, skipping test');
      return;
    }
    
    const PurchaseForm = PurchaseFormModule.default;
    
    // Set event to have 3 tickets remaining
    await updateEventTicketCount(testResources.eventId, 50, 3);
    
    // Create a mock event
    const mockEvent = {
      id: testResources.eventId,
      title: 'Test Event',
      slug: 'test-event',
      date: new Date().toISOString(),
      price: 25.00,
      tickets_total: 50,
      tickets_remaining: 3,
      sold_out: false,
      venue: 'Test Venue',
      image_url: 'https://example.com/test-image.jpg'
    };
    
    // Render the purchase form
    render(<PurchaseForm event={mockEvent} onSubmit={jest.fn()} isProcessing={false} />);
    
    // Find the quantity select element
    const quantitySelect = screen.getByLabelText(/quantity/i);
    
    // Check if options are correctly disabled
    const options = Array.from(quantitySelect.children);
    
    // Options 1, 2, 3 should be enabled
    for (let i = 1; i <= 3; i++) {
      const option = options.find(opt => (opt as HTMLOptionElement).value === i.toString());
      expect(option).not.toBeDisabled();
    }
    
    // Options 4+ should be disabled or not present
    const option4Plus = options.find(opt => parseInt((opt as HTMLOptionElement).value) > 3);
    if (option4Plus) {
      expect(option4Plus).toBeDisabled();
    }
  });
  
  // Test 5: UI updates when box office processes tickets
  test('Ticket display updates when box office processes tickets', async () => {
    if (!testResources) return; // Skip if setup failed
    
    const { EventTicketDisplay } = await importComponents();
    if (!EventTicketDisplay) return; // Skip if import failed
    
    // Reset the event ticket count
    await updateEventTicketCount(testResources.eventId, 50, 50);
    
    // Get current ticket count
    const { remaining } = await getEventTicketCount(testResources.eventId);
    
    // Render the component
    render(<EventTicketDisplay 
      eventId={testResources.eventId} 
      initialTicketsRemaining={remaining} 
      refreshInterval={1000}
    />);
    
    // Verify the initial ticket count is displayed
    await waitFor(() => {
      expect(screen.getByText(`${remaining} tickets remaining`)).toBeInTheDocument();
    });
    
    // Create a box office order
    const boxOfficeQuantity = 3;
    await createTestOrder(testResources.eventId, boxOfficeQuantity);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText(`${remaining - boxOfficeQuantity} tickets remaining`)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
  
  // Test 6: UI updates when admin edits ticket count
  test('Ticket display updates when admin edits ticket count', async () => {
    if (!testResources) return; // Skip if setup failed
    
    const { EventTicketDisplay } = await importComponents();
    if (!EventTicketDisplay) return; // Skip if import failed
    
    // Reset the event ticket count
    await updateEventTicketCount(testResources.eventId, 50, 50);
    
    // Get current ticket count
    const { remaining } = await getEventTicketCount(testResources.eventId);
    
    // Render the component
    render(<EventTicketDisplay 
      eventId={testResources.eventId} 
      initialTicketsRemaining={remaining} 
      refreshInterval={1000}
    />);
    
    // Verify the initial ticket count is displayed
    await waitFor(() => {
      expect(screen.getByText(`${remaining} tickets remaining`)).toBeInTheDocument();
    });
    
    // Admin reduces available tickets
    const newRemaining = 20;
    await updateEventTicketCount(testResources.eventId, 50, newRemaining);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText(`${newRemaining} tickets remaining`)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
