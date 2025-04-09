# Testing Guide for Ticket Shameless

## Overview

This document outlines the comprehensive testing approach for our application. We've consolidated our authentication to focus on the main login page at `/auth/login` and the direct registration page at `/direct-register` while removing redundant login components to simplify the codebase and testing. We've also enabled and fixed tests for payment processing and order management.

## Test Structure

### Authentication Test Files

- `__tests__/auth/LoginPage.test.jsx` - Tests for the main login page
- `__tests__/auth/DirectRegisterPage.test.jsx` - Tests for the signup/registration page

### Payment Test Files

- `__tests__/payments/stripe-webhook.test.js` - Tests for Stripe webhook handling
- `__tests__/supabase/payment-records.test.js` - Tests for order creation and management

### Deprecated Components

We've moved unused authentication components and their tests to a dedicated `deprecated` folder:
- `deprecated/components/Auth.tsx`
- `deprecated/components/SimpleAuth.tsx`
- `deprecated/components/auth/EnhancedAuth.tsx`
- `deprecated/__tests__/Auth.test.jsx`
- `deprecated/__tests__/SimpleAuth.test.jsx`
- `deprecated/__tests__/EnhancedAuth.test.jsx`
- `deprecated/app/auth/enhanced-login/page.tsx`

### Test Utilities

- `__tests__/utils/auth-test-utils.js` - Authentication testing utilities
- `__tests__/utils/supabase-mock.js` - Supabase mocking utilities

## Running Tests

We've created a PowerShell script to make running tests easier:

```powershell
# Run all tests
.\run-tests.ps1

# Run authentication tests
.\run-tests.ps1 login     # Run only login page tests
.\run-tests.ps1 signup    # Run only signup page tests
.\run-tests.ps1 auth      # Run all authentication tests

# Run payment tests
.\run-tests.ps1 webhook    # Run Stripe webhook tests
.\run-tests.ps1 payments   # Run payment records tests
.\run-tests.ps1 payment-all # Run all payment-related tests

# Run tests with options
.\run-tests.ps1 verbose    # Run tests with verbose output
.\run-tests.ps1 coverage   # Run tests with coverage

# Run specific test file or pattern
.\run-tests.ps1 "auth/LoginPage"
```

## Testing Approach

### Component Testing

We use React Testing Library to test our components with a focus on user interactions rather than implementation details. This ensures our tests are more resilient to refactoring.

### Mocking

We mock the following dependencies:

1. **Supabase Client** - For authentication operations and database interactions
2. **Next.js Router** - For navigation after authentication
3. **UI Components** - To simplify testing and focus on functionality
4. **Toast Notifications** - To verify success/error messages
5. **Stripe API** - For payment processing and webhook events

### Test Coverage

Our tests cover the following scenarios:

#### Authentication

##### Login Page
1. **Rendering** - Verify the login form renders correctly
2. **Successful Sign In** - Test the happy path for signing in
3. **Failed Sign In** - Test error handling for invalid credentials
4. **Password Reset** - Test the password reset functionality
5. **Form Validation** - Test form validation (e.g., disabled buttons when fields are empty)

##### Registration Page
1. **Rendering** - Verify the registration form renders correctly
2. **Successful Registration** - Test the happy path for creating an account
3. **Failed Registration** - Test error handling for registration failures
4. **Password Validation** - Test password matching validation
5. **Post-Registration Flow** - Test the email verification notification and navigation

#### Payments

##### Stripe Webhook Handling
1. **Checkout Session Completed** - Test order creation after successful payment
2. **Error Handling** - Test handling of database errors during order creation

##### Payment Records
1. **Order Creation** - Test creating order records after successful payments
2. **Ticket Updates** - Test updating ticket counts after purchases
3. **Error Handling** - Test handling database errors and constraints
4. **Order History** - Test retrieving order history for users

## Best Practices

1. **Use Role-Based Selectors** - Prefer `getByRole` over `getByTestId` when possible
2. **Test User Behavior** - Focus on what users do, not implementation details
3. **Isolate Tests** - Each test should be independent and not rely on state from other tests
4. **Clear Mocks Between Tests** - Use `beforeEach` to reset mocks
5. **Use Descriptive Test Names** - Test names should describe the behavior being tested

## Recent Improvements

1. **Consolidated Authentication** - Simplified the auth flow by focusing on the main login and direct registration pages
2. **Moved Deprecated Components** - Organized unused components into a dedicated deprecated folder
3. **Fixed Navigation** - Updated all redirects to use the main login page at `/auth/login`
4. **Enabled Payment Tests** - Fixed and enabled tests for Stripe webhooks and payment records
5. **Updated Jest Configuration** - Modified the Jest config to ignore tests in the deprecated folder

## Future Improvements

1. **Fix Skipped Tests** - Address the 2 skipped tests in DirectRegisterPage.test.jsx
2. **Add E2E Tests** - Consider adding end-to-end tests with Cypress or Playwright
3. **Test Coverage Goals** - Aim for 80%+ coverage of both authentication and payment flows
4. **Integration Tests** - Add tests that verify integration between components
5. **Accessibility Testing** - Add tests for accessibility compliance
6. **CI Integration** - Set up continuous integration to automatically run tests on code changes

## Troubleshooting

### Common Issues

1. **Deprecation Warnings** - The `punycode` module deprecation warning can be ignored for now
2. **Test Failures** - If tests fail, check mock implementations first
3. **Async Testing** - Use `waitFor` or `findBy` queries for asynchronous operations
4. **TypeScript Errors** - There are some TypeScript errors in the Navbar component that should be addressed
5. **Jest Configuration** - Make sure the `testPathIgnorePatterns` in jest.config.js includes `/deprecated/` to exclude deprecated tests
