# Authentication Testing Guide

## Overview

This document outlines the testing approach for the authentication system in our application. We've consolidated our authentication to focus on the main login page at `/auth/login` and the direct registration page at `/direct-register` while removing redundant login components to simplify the codebase and testing.

## Test Structure

### Main Test Files

- `__tests__/auth/LoginPage.test.jsx` - Tests for the main login page
- `__tests__/auth/DirectRegisterPage.test.jsx` - Tests for the signup/registration page
- ~~`__tests__/auth/Auth.test.jsx`~~ - Deprecated (commented out)
- ~~`__tests__/auth/SimpleAuth.test.jsx`~~ - Deprecated (commented out)
- ~~`__tests__/auth/EnhancedAuth.test.jsx`~~ - Deprecated (commented out)

### Test Utilities

- `__tests__/utils/auth-test-utils.js` - Authentication testing utilities
- `__tests__/utils/supabase-mock.js` - Supabase mocking utilities

## Running Tests

We've created a PowerShell script to make running tests easier:

```powershell
# Run all tests
.\run-tests.ps1

# Run only login page tests
.\run-tests.ps1 login

# Run only signup page tests
.\run-tests.ps1 signup

# Run tests with verbose output
.\run-tests.ps1 verbose

# Run tests with coverage
.\run-tests.ps1 coverage

# Run specific test file or pattern
.\run-tests.ps1 "auth/LoginPage"
```

## Testing Approach

### Component Testing

We use React Testing Library to test our components with a focus on user interactions rather than implementation details. This ensures our tests are more resilient to refactoring.

### Mocking

We mock the following dependencies:

1. **Supabase Client** - For authentication operations
2. **Next.js Router** - For navigation after authentication
3. **UI Components** - To simplify testing and focus on functionality
4. **Toast Notifications** - To verify success/error messages

### Test Coverage

Our tests cover the following scenarios:

#### Login Page
1. **Rendering** - Verify the login form renders correctly
2. **Successful Sign In** - Test the happy path for signing in
3. **Failed Sign In** - Test error handling for invalid credentials
4. **Password Reset** - Test the password reset functionality
5. **Form Validation** - Test form validation (e.g., disabled buttons when fields are empty)

#### Registration Page
1. **Rendering** - Verify the registration form renders correctly
2. **Successful Registration** - Test the happy path for creating an account
3. **Failed Registration** - Test error handling for registration failures
4. **Password Validation** - Test password matching validation
5. **Post-Registration Flow** - Test the email verification notification and navigation

## Best Practices

1. **Use Role-Based Selectors** - Prefer `getByRole` over `getByTestId` when possible
2. **Test User Behavior** - Focus on what users do, not implementation details
3. **Isolate Tests** - Each test should be independent and not rely on state from other tests
4. **Clear Mocks Between Tests** - Use `beforeEach` to reset mocks
5. **Use Descriptive Test Names** - Test names should describe the behavior being tested

## Future Improvements

1. **Add E2E Tests** - Consider adding end-to-end tests with Cypress or Playwright
2. **Test Coverage Goals** - Aim for 80%+ coverage of authentication flows
3. **Integration Tests** - Add tests that verify integration with the backend
4. **Accessibility Testing** - Add tests for accessibility compliance

## Troubleshooting

### Common Issues

1. **Deprecation Warnings** - The `punycode` module deprecation warning can be ignored for now
2. **Test Failures** - If tests fail, check mock implementations first
3. **Async Testing** - Use `waitFor` or `findBy` queries for asynchronous operations
