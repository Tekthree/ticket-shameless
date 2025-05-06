# Ticket Count Tests

This directory contains tests specifically focused on ensuring ticket counts are correctly maintained throughout the Ticket Shameless application.

## Test Coverage

The test suite verifies that ticket counts are properly handled in the following scenarios:

1. **Database Operations** (`ticket-decrement.test.ts`)
   - Customer purchases trigger correct ticket count decrements
   - Box office processing decrements tickets correctly
   - Admin edits to ticket counts are properly tracked
   - Concurrent ticket purchases don't oversell events
   - Events are properly marked as sold out when tickets reach zero
   - The `syncTicketCounts` function correctly recalculates ticket counts

2. **UI Components** (`ticket-ui.test.tsx`)
   - Ticket count displays show the correct numbers
   - UI updates when ticket counts change in the database
   - "Sold Out" labels appear when appropriate
   - Purchase forms disable invalid quantity options

3. **Validation Logic** (`ticket-validation.test.ts`)
   - Purchase validation rejects invalid quantities
   - Validation prevents purchasing more tickets than available
   - Box office operations can't oversell events
   - Race conditions are handled properly to prevent overselling

## Setting Up Test Environment

### Environment Variables

These tests require a connection to a Supabase instance. To set up your environment:

1. Copy the example test environment file:
   ```bash
   cp .env.test.example .env.test
   ```

2. Edit `.env.test` with your Supabase test database credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **IMPORTANT**: Use a test database, not your production database! The tests will create and delete data.

### Running Tests with Environment Variables

```bash
# Run with test environment
NODE_ENV=test npm test -- tickets

# Run a specific test file
NODE_ENV=test npm test -- tickets/ticket-decrement.test.ts
```

### Test Behavior Without Environment Variables

If the required environment variables are not set:

- Tests will be skipped (not fail)
- You'll see warnings in the console about missing variables
- UI tests will still run but with mocked data

## Running All Ticket Tests

```bash
npm test -- tickets
```

## Running Specific Test Files

```bash
# Database decrement tests
npm test -- tickets/ticket-decrement.test.ts

# UI component tests
npm test -- tickets/ticket-ui.test.tsx

# Validation logic tests
npm test -- tickets/ticket-validation.test.ts
```

## Test Utilities

The `utils.ts` file provides helper functions for creating test events and orders, cleaning up after tests, and checking ticket counts. These utilities can be reused in other test files if needed.

## Test Design

The tests are designed to be isolated and clean up after themselves. Each test creates its own test data and then removes it after completion. If a test fails unexpectedly, you might need to manually clean up test events with names like `test-event-*`.

## Debugging

If you need to see more detailed error messages during testing, set:

```
DEBUG_TEST_ERRORS=true
```

in your `.env.test` file.
