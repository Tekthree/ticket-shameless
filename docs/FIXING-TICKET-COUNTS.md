# Fixing the Double-Decrementing Ticket Count Issue

## Problem Overview

The Ticket Shameless application has been experiencing an issue where ticket counts are being decremented twice when a purchase is made through Stripe. Each purchase reduces the `tickets_remaining` count by double the actual quantity purchased, causing inventory discrepancies.

## Root Cause Analysis

After investigating the codebase, we identified that ticket counts were being updated in multiple places:

1. **Stripe Webhook Handler**: In `app/api/webhooks/stripe/route.ts`, the code explicitly updates the `tickets_remaining` field in the `events` table when a Stripe checkout session is completed.

2. **Database Functions**: The `decrement` function defined in `schema.sql` is called from other parts of the application, causing a second update to the ticket count.

3. **Sync Functions**: The `syncTicketCounts` function in `server-actions.ts` also updates ticket counts based on order data.

This led to multiple processes independently updating the ticket count, resulting in double-counting.

## Implemented Solution

We've implemented a comprehensive solution that ensures ticket counts are only updated once per purchase:

### 1. Single Source of Truth

A database trigger now serves as the single source of truth for ticket count updates:

```sql
CREATE TRIGGER orders_ticket_count_trigger
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_ticket_count_update();
```

This trigger automatically updates the `tickets_remaining` count whenever a new order is inserted or updated, and includes safeguards to prevent double-counting.

### 2. Webhook Handler Update

The Stripe webhook handler has been modified to no longer update ticket counts directly. It now:
- Creates the order record
- Lets the database trigger handle the ticket count update

### 3. Diagnostic and Fix Tools

We've added several tools to help diagnose and fix any existing issues:

- **Database Functions**: 
  - `check_ticket_counts(event_uuid)`: Checks for discrepancies without making changes
  - `fix_ticket_counts(event_uuid)`: Resets and recalculates ticket counts for an event
  - `fix_all_ticket_counts()`: Checks and fixes all events at once

- **API Endpoints**:
  - `/api/tickets/verify-counts`: Verifies and optionally fixes ticket counts

- **Admin Interface**:
  - A new admin page at `/admin/ticket-counts` allows monitoring and fixing ticket count issues
  - The `TicketCountFixer` component provides a user-friendly way to check and fix individual events

## Usage Guide

### Diagnosing Issues

1. Visit the admin page at `/admin/ticket-counts` to see all events
2. Events with count discrepancies will be highlighted in red
3. Click "Manage Tickets" to check counts for a specific event

### Fixing Counts

1. For a single event with issues:
   - Go to `/admin/ticket-counts`
   - Click "Manage Tickets" on the event
   - Click "Check Counts" to verify the discrepancy
   - Click "Fix Counts" to correct it

2. Using the API directly:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"eventId": "event-uuid", "fix": true}' \
     http://localhost:3000/api/tickets/verify-counts
   ```

3. Using SQL (in Supabase SQL Editor):
   ```sql
   -- Check counts for an event
   SELECT * FROM check_ticket_counts('event-uuid');
   
   -- Fix counts for an event
   CALL fix_ticket_counts('event-uuid');
   
   -- Fix all events
   SELECT * FROM fix_all_ticket_counts();
   ```

## Monitoring and Prevention

To prevent these issues in the future:

1. **Use the Database Trigger**: Always rely on the database trigger to handle ticket count updates automatically.

2. **Regular Verification**: Schedule regular checks using the `fix_all_ticket_counts()` function to ensure counts remain accurate.

3. **Avoid Manual Updates**: Do not manually update the `tickets_remaining` field directly - always use the appropriate functions and APIs.

## Technical Details

### Database Trigger

The database trigger uses these safeguards to prevent double-counting:

- Tracks processed orders with the `ticket_count_updated` flag
- Only processes each order once
- Updates in a single transaction to maintain consistency
- Uses proper locking to prevent race conditions

### Webhook Handler

The updated webhook handler:

- Verifies Stripe signatures
- Creates orders with completed status
- Includes checks to prevent duplicate order processing

## Support

If you encounter any issues with ticket counts, please consult the development team.