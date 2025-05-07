# Ticket Shameless: Integration Guide

This document provides a comprehensive guide for ensuring all components of the Ticket Shameless application work together efficiently. It outlines the integration points between different features, data flows, and implementation dependencies.

## Component Integration Map

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Authentication     │────▶│  User Management    │────▶│  Role-Based Access  │
│  System             │     │  System             │     │  Control            │
│                     │     │                     │     │                     │
└─────────┬───────────┘     └─────────┬───────────┘     └─────────────────────┘
          │                           │                            ▲
          │                           │                            │
          ▼                           ▼                            │
┌─────────────────────┐     ┌─────────────────────┐               │
│                     │     │                     │               │
│  Email Marketing    │     │  Storage System     │───────────────┘
│  System             │     │                     │
│                     │     │                     │
└─────────┬───────────┘     └─────────┬───────────┘
          │                           │
          │                           │
          ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Ticket System      │────▶│  CMS System        │────▶│  Homepage & Event   │
│  (Guest & Auth)     │     │                     │     │  Pages              │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## Authentication System Integration

The authentication system serves as the foundation for user identity and security across the application.

### Integration Points

1. **User Management System**
   - Authentication provides verified user identity to the profile system
   - User profiles are created/updated after successful authentication
   - Email addresses are collected during authentication for marketing

2. **Email Marketing System**
   - Authentication events trigger email collection with proper consent
   - OAuth providers supply additional user data for marketing personalization
   - Authentication status determines marketing email content

3. **Ticket System**
   - Authentication state determines checkout flow (guest vs. authenticated)
   - Authenticated users have order history tied to their account
   - Guest purchases can be linked to accounts upon later registration

### Implementation Dependencies

```typescript
// Authentication -> Email Marketing
// In OAuth callback handler
if (!error && data.user) {
  // Get authenticated user securely
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Add user to email marketing database if not linking an existing account
    if (!isLinking) {
      await addToEmailMarketing({
        email: user.email || '',
        name: user.user_metadata?.full_name || '',
        source: 'google_oauth',
        subscribed: true
      });
    }
  }
}

// Authentication -> User Management
// In profile sync function
export async function syncUserProfile(userId: string, userData: any) {
  // Get authenticated user securely
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Update or create profile...
}

// Authentication -> Role-Based Access
// In middleware
export async function middleware(request: NextRequest) {
  // Get authenticated user securely
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // Check user roles...
}
```

## Email Marketing System Integration

The email marketing system collects and manages email addresses for both transactional and marketing communications.

### Integration Points

1. **Authentication System**
   - Collects emails during registration and social login
   - Manages marketing consent preferences
   - Updates email records when users change their email

2. **Ticket System**
   - Collects emails during guest checkout
   - Sends order confirmations and tickets via email
   - Provides purchase data for targeted marketing

3. **CMS System**
   - Email templates use content managed through the CMS
   - Marketing campaigns reference events and content from CMS
   - Newsletter signup forms are managed through CMS

### Implementation Dependencies

```typescript
// Email Marketing -> Ticket System
// In guest checkout process
export async function processGuestOrder(formData: FormData) {
  // Process order...
  
  // Add to email marketing
  await addToEmailMarketing({
    email: email,
    name: name,
    source: 'guest_checkout',
    subscribed: marketingConsent,
  });
  
  // Send order confirmation email
  await sendOrderConfirmationEmail(order, event, tickets);
}

// Email Marketing -> CMS System
// In email template rendering
export async function renderEmailTemplate(templateName: string, data: any) {
  // Get content from CMS
  const content = await getSiteContentServer();
  
  // Use CMS content in email template
  const emailContent = {
    logo: content?.branding?.logo?.content || '/default-logo.png',
    footerText: content?.emails?.footer?.content || 'Default footer text',
    // ...
  };
  
  // Render template with content
  return renderToString(
    EmailTemplate({
      ...data,
      content: emailContent,
    })
  );
}
```

## CMS System Integration

The CMS system manages content across the application, ensuring consistent branding and messaging.

### Integration Points

1. **Homepage & Event Pages**
   - CMS provides dynamic content for all public-facing pages
   - Content is mapped to specific design elements
   - Media assets are managed and optimized through CMS

2. **Email Marketing System**
   - Email templates use CMS-managed content
   - Marketing campaigns reference CMS-managed events
   - Branding elements are consistent across web and email

3. **Role-Based Access Control**
   - CMS access is restricted based on user roles
   - Content editing permissions are role-dependent
   - Audit logs track content changes by user

### Implementation Dependencies

```typescript
// CMS -> Homepage
// In homepage component
export default async function HomePage() {
  // Get content from CMS
  const content = await getSiteContentServer();
  
  // Use content in page
  const heroTitle = content?.hero?.title?.content || 'Default Title';
  const heroSubtitle = content?.hero?.subtitle?.content || 'Default Subtitle';
  
  // Render page with content
  return (
    <div>
      <h1>{heroTitle}</h1>
      <p>{heroSubtitle}</p>
      {/* ... */}
    </div>
  );
}

// CMS -> Role-Based Access
// In CMS admin page
export default async function SiteContentPage() {
  // Get authenticated user
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  // Check if user has admin role
  const isAdmin = await hasRole(user.id, 'admin');
  
  if (!isAdmin) {
    redirect('/');
  }
  
  // Render CMS interface
  // ...
}
```

## Storage System Integration

The storage system manages all media assets across the application using Supabase Storage, providing a centralized repository for images, videos, and other files.

### Integration Points

1. **User Management System**
   - Stores and manages user avatar images
   - Provides profile picture URLs for display across the application
   - Handles user-specific file uploads and permissions

2. **CMS System**
   - Stores media assets for site content (images, videos)
   - Provides URLs for content display on the homepage and event pages
   - Manages uploaded content with metadata tracking

3. **Event Management**
   - Stores event promotional images
   - Manages artist photos and media
   - Provides optimized images for different display contexts

4. **Role-Based Access Control**
   - Enforces permissions for file operations based on user roles
   - Restricts sensitive operations to admin users
   - Allows users to manage their own content

### Implementation Dependencies

```typescript
// Storage -> User Management
// In profile component
export async function updateUserAvatar(file: File) {
  // Upload avatar to storage
  const avatarUrl = await uploadAvatar(file);
  
  // Update user profile with new avatar URL
  await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);
  
  return avatarUrl;
}

// Storage -> CMS System
// In CMS content editor
export async function updateContentMedia(section: string, field: string, file: File) {
  // Upload media to storage
  const result = await uploadSiteContent(file, section, field);
  
  // Update site_content table with media URL
  await supabase
    .from('site_content')
    .upsert({
      section,
      field,
      content: result.url,
      content_type: file.type.startsWith('image/') ? 'image' : 'video',
      is_uploaded: true,
      original_filename: file.name,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'section,field'
    });
  
  return result.url;
}

// Storage -> Role-Based Access
// In storage policy implementation
const isAdmin = await hasRole(user.id, 'admin');

if (!isAdmin && !isOwnFile(path, user.id)) {
  throw new Error('Permission denied');
}
```

## Ticket System Integration

The ticket system handles both guest and authenticated purchases, integrating with multiple components.

### Integration Points

1. **Authentication System**
   - Determines checkout flow (guest vs. authenticated)
   - Links guest purchases to accounts upon registration
   - Provides user data for personalized ticket experiences

2. **Email Marketing System**
   - Collects emails during checkout
   - Sends order confirmations and tickets
   - Provides purchase data for targeted marketing

3. **Storage System**
   - Stores ticket QR codes and digital assets
   - Provides event images for ticket display
   - Manages receipt templates and PDFs

### Implementation Dependencies

```typescript
// Ticket System -> Authentication
// In checkout component
export function CheckoutForm() {
  // Check authentication status
  const user = useUser();
  
  // Render appropriate checkout form
  return user ? <AuthenticatedCheckout user={user} /> : <GuestCheckout />;
}

// Ticket System -> Email Marketing
// In order processing
export async function processOrder(orderData) {
  // Create order
  const order = await createOrder(orderData);
  
  // Generate tickets
  const tickets = await generateTickets(order);
  
  // Send confirmation email
  await sendOrderConfirmationEmail(order, tickets);
  
  // Add to email marketing if consent given
  if (orderData.marketingConsent) {
    await addToEmailMarketing({
      email: orderData.email,
      name: orderData.name,
      source: 'purchase',
      subscribed: true,
    });
  }
  
  return { order, tickets };
}
```

## Data Flow Diagrams

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Login Page │────▶│  Supabase   │────▶│  Auth       │────▶│  Profile    │
│             │     │  Auth       │     │  Callback   │     │  Sync       │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │             │
                                        │  Email      │
                                        │  Marketing  │
                                        │             │
                                        └─────────────┘
```

### Ticket Purchase Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Event Page │────▶│  Checkout   │────▶│  Payment    │────▶│  Order      │
│             │     │  Form       │     │  Processing │     │  Creation   │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   │
                          ┌─────────────┐                          │
                          │             │                          │
                          │  Email      │◀─────────────────────────┘
                          │  Delivery   │
                          │             │
                          └─────────────┘
```

### Content Management Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Admin      │────▶│  Content    │────▶│  Media      │────▶│  Database   │
│  Dashboard  │     │  Editor     │     │  Upload     │     │  Update     │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   │
                          ┌─────────────┐                          │
                          │             │                          │
                          │  Homepage   │◀─────────────────────────┘
                          │  Update     │
                          │             │
                          └─────────────┘
```

## API Integration

### Authentication APIs

| Endpoint | Method | Description | Integration Points |
|----------|--------|-------------|-------------------|
| `/auth/callback` | GET | Handles OAuth callback | Email Marketing, Profile System |
| `/api/auth/sync-profile` | POST | Syncs user profile data | Profile System, Role Management |
| `/api/auth/user` | GET | Gets authenticated user | All authenticated components |

### Email Marketing APIs

| Endpoint | Method | Description | Integration Points |
|----------|--------|-------------|-------------------|
| `/api/email/subscribe` | POST | Subscribes email to marketing | Homepage, Event Pages |
| `/api/email/unsubscribe` | GET | Unsubscribes email | Email Templates |
| `/api/email/preferences` | GET/POST | Manages email preferences | User Profile |

### CMS APIs

| Endpoint | Method | Description | Integration Points |
|----------|--------|-------------|-------------------|
| `/api/site-content` | GET | Gets site content | Homepage, Event Pages, Email Templates |
| `/api/site-content` | PUT | Updates site content | Admin Dashboard |
| `/api/media` | POST | Uploads media | CMS, Event Management |

### Ticket System APIs

| Endpoint | Method | Description | Integration Points |
|----------|--------|-------------|-------------------|
| `/api/checkout` | POST | Processes checkout | Payment System, Email Marketing |
| `/api/tickets` | GET | Gets user tickets | User Profile, Box Office |
| `/api/events/:id/tickets-remaining` | GET | Gets ticket availability | Event Pages |

## Security Integration

### Authentication Security

- All components use `getAuthenticatedUser()` instead of `getSession()`
- Token validation occurs on the server side for all authenticated requests
- Role-based middleware protects sensitive routes

### Data Access Security

- Supabase RLS policies restrict data access based on user roles
- API routes validate authentication and authorization
- Guest checkout data is properly sanitized and validated

### Content Security

- CMS updates require admin role verification
- Media uploads are validated and sanitized
- Content rendering includes XSS protection

## Implementation Sequence

To ensure all components work together efficiently, implement them in this order:

1. **Authentication System**
   - Secure authentication with `getAuthenticatedUser()`
   - Google OAuth integration
   - Role-based access control

2. **Database Schema**
   - Core tables including email_marketing
   - RLS policies for security
   - Indexes for performance

3. **CMS System**
   - Content management interface
   - Media upload functionality
   - Content delivery APIs

4. **Email Marketing Foundation**
   - Email collection infrastructure
   - Consent management
   - Basic transactional emails

5. **Ticket System**
   - Event display
   - Authenticated checkout
   - Guest checkout
   - Ticket generation

6. **Integration Layer**
   - Connect authentication to email marketing
   - Link CMS to email templates
   - Integrate ticket system with email delivery

7. **Testing & Optimization**
   - End-to-end testing of all flows
   - Performance optimization
   - Security validation

## Testing Integration Points

To verify that all components work together correctly, test these critical integration points:

1. **Authentication → Email Marketing**
   - Register new user and verify email is added to marketing database
   - Sign in with Google and verify email collection
   - Update email preferences and verify database update

2. **Ticket System → Email Marketing**
   - Complete guest checkout and verify email collection
   - Purchase tickets as authenticated user and verify order email
   - Test marketing consent checkbox functionality

3. **CMS → Homepage**
   - Update content in CMS and verify homepage updates
   - Test different content types (text, image, video)
   - Verify responsive behavior across devices

4. **Role-Based Access → CMS**
   - Test admin access to CMS
   - Verify non-admin users cannot access CMS
   - Test different role permissions

By following this integration guide, all components of the Ticket Shameless application will work together efficiently, providing a seamless experience for users and administrators while maintaining security and performance.