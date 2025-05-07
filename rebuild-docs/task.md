# Ticket Shameless: Rebuild Tasks

## Current Issues to Address

### Authentication & Security
- **Supabase Authentication Warnings**: Current implementation uses `getSession()` directly which is insecure. All components should use `getUser()` instead.
- **Multiple Login Pages**: Consolidate `/auth/login` and `/auth/enhanced-login` to a single login flow.
- **Inconsistent Redirects**: Fix navigation issues where components redirect to deprecated paths.
- **Token Management**: Implement proper token refresh mechanism to prevent session timeouts.
- **Guest Checkout**: Need to implement a secure guest checkout flow that doesn't require user registration.

### Data Fetching & State Management
- **Excessive API Calls**: Reduce redundant Supabase queries causing performance issues.
- **Caching Issues**: Implement proper cache invalidation to prevent stale data.
- **Error Handling**: Add comprehensive error handling with retry mechanisms.
- **Type Safety**: Fix TypeScript errors in Supabase client implementations.

### UI/UX Consistency
- **Navigation Issues**: Fix inconsistent navigation paths and redirects.
- **Profile Updates**: Ensure user profile updates correctly after sign-in/sign-out.
- **Role-Based UI**: Properly display UI elements based on user roles.

### Email & Notifications
- **Email Collection**: Need to collect and store emails for marketing purposes from all users and guests.
- **Email Notifications**: Implement comprehensive email notification system for order confirmations and event updates.
- **Marketing System**: Create system for sending marketing emails to collected addresses with proper consent management.

## Rebuild Approach

### Phase 1: Project Setup & Architecture

1. **Initialize Next.js Project**
   - Set up Next.js 14+ with App Router
   - Configure TypeScript with strict mode
   - Set up Tailwind CSS with proper theming
   - Configure ESLint and Prettier

2. **Authentication Architecture**
   - Implement Supabase client with secure authentication
   - Create centralized auth helpers using `getUser()` instead of `getSession()`
   - Set up middleware for route protection
   - Implement role-based access control

3. **Database Setup**
   - Create Supabase tables with proper relationships
   - Set up RLS policies for security
   - Create migration scripts for database schema
   - Set up seed data for development

### Phase 2: Core Features Implementation

4. **User Management**
   - Implement unified login/registration flow
   - Configure Google OAuth integration with Supabase
   - Implement social login profile linking and management
   - Create profile management with avatar support
   - Implement role management system
   - Add user settings page

5. **Event System**
   - Create event listing and filtering
   - Implement event detail pages
   - Add artist association with events
   - Implement event image management

6. **Ticket System**
   - Integrate Stripe for payments
   - Implement ticket purchase flow with both authenticated and guest checkout options
   - Create ticket history and management
   - Add QR code generation for tickets
   - Implement email delivery of tickets
   - Collect customer emails for marketing during checkout

7. **Box Office System**
   - Create dedicated POS interface for in-person sales
   - Implement ticket scanning interface with real-time validation
   - Build staff performance tracking and reporting
   - Develop guest list management system
   - Create cash/card payment handling
   - Implement receipt generation (print/email)
   - Build real-time attendance tracking dashboard
   - Add duplicate entry prevention system

7. **Admin Dashboard**
   - Create admin layout with navigation
   - Implement event management interface
   - Add user management for admins
   - Create sales reporting dashboard

### Phase 3: Optimization & Enhancement

8. **Performance Optimization**
   - Implement request batching for Supabase queries
   - Add strategic caching with proper invalidation
   - Optimize image loading and rendering
   - Implement server-side rendering where appropriate

9. **Error Handling & Reliability**
   - Add comprehensive error boundaries
   - Implement retry mechanisms for API calls
   - Create fallback UI for error states
   - Add logging for debugging

10. **Testing & Quality Assurance**
    - Write unit tests for critical components
    - Create integration tests for user flows
    - Set up CI/CD pipeline with GitHub Actions
    - Implement end-to-end testing

11. **Email Marketing & Notifications**
    - Create email marketing database structure
    - Implement email collection at all customer touchpoints
    - Build transactional email system for order confirmations and updates
    - Develop marketing email templates and sending infrastructure
    - Implement scheduled notifications (event reminders, etc.)
    - Create unsubscribe and consent management system

11. **UI/UX Refinement**
    - Ensure consistent styling across all pages
    - Implement responsive design for all screen sizes
    - Add animations and transitions for better UX
    - Ensure accessibility compliance

### Phase 4: Deployment & Monitoring

12. **Deployment Setup**
    - Configure production environment
    - Set up CDN for static assets
    - Implement proper environment variable management
    - Configure monitoring and error tracking

13. **Documentation**
    - Create comprehensive API documentation
    - Write developer guides for future maintenance
    - Document database schema and relationships
    - Create user guides for admin features

## Priority Issues to Fix

1. **Authentication Security**: Replace all instances of `getSession()` with `getAuthenticatedUser()` helper.
2. **Login Flow Consolidation**: Remove deprecated login pages and standardize on `/auth/login`.
3. **Data Fetching Optimization**: Implement request batching and caching to reduce API calls.
4. **Error Handling**: Add retry mechanisms for all Supabase queries.
5. **Role-Based Access**: Fix permission checks in middleware and UI components.
6. **UI Consistency**: Ensure consistent navigation and styling across the application.
7. **Testing**: Fix and enable all skipped tests to ensure functionality works as expected.