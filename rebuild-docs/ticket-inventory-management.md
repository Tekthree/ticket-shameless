# Ticket Inventory Management System

This document outlines the centralized ticket inventory management system for the Ticket Shameless application, ensuring consistent ticket counts, accurate sales tracking, and proper inventory management.

## Database Structure

### Events Table

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  venue_id UUID REFERENCES venues(id),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  -- Other event fields...
);
```

### Ticket Types Table

```sql
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- In cents
  initial_inventory INTEGER NOT NULL, -- Total tickets created initially
  total_inventory INTEGER NOT NULL, -- Current total tickets (can increase)
  sold_count INTEGER DEFAULT 0, -- Number of tickets sold
  reserved_count INTEGER DEFAULT 0, -- Number of tickets reserved but not purchased
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints to ensure counts are valid
  CONSTRAINT valid_inventory CHECK (total_inventory >= 0),
  CONSTRAINT valid_sold CHECK (sold_count >= 0),
  CONSTRAINT valid_reserved CHECK (reserved_count >= 0),
  CONSTRAINT available_tickets CHECK (sold_count + reserved_count <= total_inventory)
);

-- Index for performance
CREATE INDEX idx_ticket_types_event_id ON ticket_types(event_id);
```

### Inventory Audit Log

```sql
CREATE TABLE inventory_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'increase', 'decrease', 'sale', 'refund', 'reserve', 'release'
  quantity INTEGER NOT NULL,
  previous_total INTEGER NOT NULL,
  new_total INTEGER NOT NULL,
  previous_sold INTEGER NOT NULL,
  new_sold INTEGER NOT NULL,
  previous_reserved INTEGER NOT NULL,
  new_reserved INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_inventory_audit_ticket_type ON inventory_audit_log(ticket_type_id);
CREATE INDEX idx_inventory_audit_created_at ON inventory_audit_log(created_at);
```

## Core Functions

### 1. Get Available Ticket Count

```typescript
/**
 * Get the available ticket count for a ticket type
 * This is the single source of truth for available tickets
 */
export async function getAvailableTicketCount(ticketTypeId: string): Promise<number> {
  const supabase = createClient();
  const user = await getAuthenticatedUser();
  
  const { data, error } = await supabase
    .from('ticket_types')
    .select('total_inventory, sold_count, reserved_count')
    .eq('id', ticketTypeId)
    .single();
  
  if (error) {
    console.error('Error getting ticket count:', error);
    throw new Error(`Failed to get ticket count: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('Ticket type not found');
  }
  
  // Calculate available tickets
  const availableCount = data.total_inventory - data.sold_count - data.reserved_count;
  
  return Math.max(0, availableCount); // Ensure we never return negative
}
```

### 2. Reserve Tickets

```typescript
/**
 * Reserve tickets for a potential purchase
 * This decrements from the available count but doesn't mark as sold
 */
export async function reserveTickets(
  ticketTypeId: string, 
  quantity: number,
  expirationMinutes: number = 15
): Promise<{ success: boolean, reservation_id?: string }> {
  const supabase = createClient();
  const user = await getAuthenticatedUser();
  
  // Start a transaction
  const { data: ticketType, error: fetchError } = await supabase
    .from('ticket_types')
    .select('total_inventory, sold_count, reserved_count')
    .eq('id', ticketTypeId)
    .single();
  
  if (fetchError || !ticketType) {
    throw new Error('Failed to fetch ticket type');
  }
  
  const availableCount = ticketType.total_inventory - ticketType.sold_count - ticketType.reserved_count;
  
  if (availableCount < quantity) {
    return { success: false };
  }
  
  // Create reservation
  const reservationId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);
  
  const { error: reservationError } = await supabase
    .from('ticket_reservations')
    .insert({
      id: reservationId,
      ticket_type_id: ticketTypeId,
      quantity,
      user_id: user?.id || null,
      expires_at: expiresAt.toISOString(),
      status: 'active'
    });
  
  if (reservationError) {
    throw new Error(`Failed to create reservation: ${reservationError.message}`);
  }
  
  // Update reserved count
  const { error: updateError } = await supabase
    .from('ticket_types')
    .update({ 
      reserved_count: ticketType.reserved_count + quantity,
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketTypeId);
  
  if (updateError) {
    // Rollback reservation
    await supabase.from('ticket_reservations').delete().eq('id', reservationId);
    throw new Error(`Failed to update reserved count: ${updateError.message}`);
  }
  
  // Log the action
  await logInventoryChange(
    ticketTypeId,
    'reserve',
    quantity,
    ticketType.total_inventory,
    ticketType.total_inventory,
    ticketType.sold_count,
    ticketType.sold_count,
    ticketType.reserved_count,
    ticketType.reserved_count + quantity,
    `Reservation ${reservationId}`
  );
  
  return { success: true, reservation_id: reservationId };
}
```

### 3. Complete Ticket Sale

```typescript
/**
 * Complete a ticket sale, converting reserved tickets to sold
 */
export async function completeTicketSale(
  reservationId: string,
  orderId: string
): Promise<{ success: boolean }> {
  const supabase = createClient();
  
  // Get reservation details
  const { data: reservation, error: reservationError } = await supabase
    .from('ticket_reservations')
    .select('ticket_type_id, quantity, status')
    .eq('id', reservationId)
    .single();
  
  if (reservationError || !reservation) {
    throw new Error('Reservation not found');
  }
  
  if (reservation.status !== 'active') {
    throw new Error(`Reservation is ${reservation.status}, not active`);
  }
  
  // Get current ticket counts
  const { data: ticketType, error: ticketError } = await supabase
    .from('ticket_types')
    .select('total_inventory, sold_count, reserved_count')
    .eq('id', reservation.ticket_type_id)
    .single();
  
  if (ticketError || !ticketType) {
    throw new Error('Failed to fetch ticket type');
  }
  
  // Update ticket counts - move from reserved to sold
  const { error: updateError } = await supabase
    .from('ticket_types')
    .update({ 
      sold_count: ticketType.sold_count + reservation.quantity,
      reserved_count: ticketType.reserved_count - reservation.quantity,
      updated_at: new Date().toISOString()
    })
    .eq('id', reservation.ticket_type_id);
  
  if (updateError) {
    throw new Error(`Failed to update ticket counts: ${updateError.message}`);
  }
  
  // Update reservation status
  const { error: statusError } = await supabase
    .from('ticket_reservations')
    .update({ 
      status: 'completed',
      order_id: orderId,
      updated_at: new Date().toISOString()
    })
    .eq('id', reservationId);
  
  if (statusError) {
    throw new Error(`Failed to update reservation status: ${statusError.message}`);
  }
  
  // Log the action
  await logInventoryChange(
    reservation.ticket_type_id,
    'sale',
    reservation.quantity,
    ticketType.total_inventory,
    ticketType.total_inventory,
    ticketType.sold_count,
    ticketType.sold_count + reservation.quantity,
    ticketType.reserved_count,
    ticketType.reserved_count - reservation.quantity,
    `Order ${orderId}`
  );
  
  return { success: true };
}
```

### 4. Increase Ticket Inventory

```typescript
/**
 * Increase the total ticket inventory
 * This allows adding more tickets while preserving sales history
 */
export async function increaseTicketInventory(
  ticketTypeId: string,
  additionalQuantity: number,
  reason: string
): Promise<{ success: boolean, new_total: number }> {
  const supabase = createClient();
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  // Check if user has admin or event manager role
  const hasPermission = await hasRole(user.id, ['admin', 'event_manager']);
  if (!hasPermission) {
    throw new Error('Permission denied');
  }
  
  // Get current ticket counts
  const { data: ticketType, error: ticketError } = await supabase
    .from('ticket_types')
    .select('total_inventory, sold_count, reserved_count')
    .eq('id', ticketTypeId)
    .single();
  
  if (ticketError || !ticketType) {
    throw new Error('Failed to fetch ticket type');
  }
  
  const newTotal = ticketType.total_inventory + additionalQuantity;
  
  // Update ticket counts
  const { error: updateError } = await supabase
    .from('ticket_types')
    .update({ 
      total_inventory: newTotal,
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketTypeId);
  
  if (updateError) {
    throw new Error(`Failed to update ticket inventory: ${updateError.message}`);
  }
  
  // Log the action
  await logInventoryChange(
    ticketTypeId,
    'increase',
    additionalQuantity,
    ticketType.total_inventory,
    newTotal,
    ticketType.sold_count,
    ticketType.sold_count,
    ticketType.reserved_count,
    ticketType.reserved_count,
    reason
  );
  
  return { success: true, new_total: newTotal };
}
```

### 5. Audit Log Helper

```typescript
/**
 * Log inventory changes for audit purposes
 */
async function logInventoryChange(
  ticketTypeId: string,
  action: string,
  quantity: number,
  previousTotal: number,
  newTotal: number,
  previousSold: number,
  newSold: number,
  previousReserved: number,
  newReserved: number,
  reason: string
): Promise<void> {
  const supabase = createClient();
  const user = await getAuthenticatedUser();
  
  await supabase
    .from('inventory_audit_log')
    .insert({
      ticket_type_id: ticketTypeId,
      user_id: user?.id || null,
      action,
      quantity,
      previous_total: previousTotal,
      new_total: newTotal,
      previous_sold: previousSold,
      new_sold: newSold,
      previous_reserved: previousReserved,
      new_reserved: newReserved,
      reason
    });
}
```

## Scheduled Tasks

### 1. Release Expired Reservations

```typescript
/**
 * Scheduled function to release expired ticket reservations
 * This should run every few minutes
 */
export async function releaseExpiredReservations(): Promise<{ released: number }> {
  const supabase = createClient();
  
  // Find expired reservations
  const now = new Date().toISOString();
  const { data: expiredReservations, error: findError } = await supabase
    .from('ticket_reservations')
    .select('id, ticket_type_id, quantity')
    .eq('status', 'active')
    .lt('expires_at', now);
  
  if (findError) {
    throw new Error(`Failed to find expired reservations: ${findError.message}`);
  }
  
  if (!expiredReservations || expiredReservations.length === 0) {
    return { released: 0 };
  }
  
  // Group by ticket type for efficient updates
  const ticketTypeMap = expiredReservations.reduce((acc, reservation) => {
    if (!acc[reservation.ticket_type_id]) {
      acc[reservation.ticket_type_id] = 0;
    }
    acc[reservation.ticket_type_id] += reservation.quantity;
    return acc;
  }, {});
  
  // Update each ticket type
  for (const [ticketTypeId, quantity] of Object.entries(ticketTypeMap)) {
    // Get current counts
    const { data: ticketType, error: ticketError } = await supabase
      .from('ticket_types')
      .select('reserved_count')
      .eq('id', ticketTypeId)
      .single();
    
    if (ticketError || !ticketType) {
      console.error(`Failed to fetch ticket type ${ticketTypeId}:`, ticketError);
      continue;
    }
    
    // Update reserved count
    const newReservedCount = Math.max(0, ticketType.reserved_count - quantity);
    const { error: updateError } = await supabase
      .from('ticket_types')
      .update({ 
        reserved_count: newReservedCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketTypeId);
    
    if (updateError) {
      console.error(`Failed to update reserved count for ${ticketTypeId}:`, updateError);
      continue;
    }
    
    // Log the action
    await logInventoryChange(
      ticketTypeId,
      'release',
      quantity,
      ticketType.total_inventory,
      ticketType.total_inventory,
      ticketType.sold_count,
      ticketType.sold_count,
      ticketType.reserved_count,
      newReservedCount,
      'Expired reservations'
    );
  }
  
  // Update reservation status
  const reservationIds = expiredReservations.map(r => r.id);
  const { error: statusError } = await supabase
    .from('ticket_reservations')
    .update({ 
      status: 'expired',
      updated_at: new Date().toISOString()
    })
    .in('id', reservationIds);
  
  if (statusError) {
    throw new Error(`Failed to update reservation status: ${statusError.message}`);
  }
  
  return { released: expiredReservations.length };
}
```

## Admin Interface

The admin interface provides comprehensive ticket inventory management:

1. **Event Ticket Dashboard**
   - Shows total tickets created initially
   - Displays current total inventory
   - Shows sold tickets count
   - Shows reserved tickets count
   - Calculates available tickets

2. **Inventory Management**
   - Allows increasing ticket inventory
   - Requires reason for audit purposes
   - Shows historical changes

3. **Sales Reports**
   - Provides ticket sales by type
   - Shows inventory changes over time
   - Displays audit log for all changes

## Integration with Ticket System

The ticket system integrates with this inventory management through these key points:

1. **Ticket Purchase Flow**
   - Reserves tickets during checkout process
   - Converts reservation to sale on payment completion
   - Releases reservation on payment failure or timeout

2. **Admin Event Management**
   - Uses the same centralized functions for inventory changes
   - Records all manual adjustments in the audit log
   - Preserves sales history when increasing inventory

3. **Box Office Integration**
   - Uses the same inventory source for in-person sales
   - Records POS sales in the same system
   - Allows for real-time inventory tracking

## Implementation Guidelines

When implementing this system, follow these guidelines:

1. **Single Source of Truth**
   - Always use `getAvailableTicketCount()` to check availability
   - Never calculate available tickets manually in components
   - Use the provided functions for all inventory changes

2. **Transactional Safety**
   - Implement proper error handling for all operations
   - Use database transactions where possible
   - Log all errors for debugging

3. **Audit Trail**
   - Always provide a reason for manual inventory changes
   - Use the audit log for tracking all changes
   - Implement reporting based on the audit log

4. **Concurrency Handling**
   - Use database constraints to prevent overselling
   - Implement reservation timeouts to prevent inventory lock
   - Use optimistic locking for updates where appropriate

By following this centralized inventory management approach, you ensure that all ticket counts come from a single source, properly track both total and available tickets, and maintain an accurate history of sales and inventory changes.
