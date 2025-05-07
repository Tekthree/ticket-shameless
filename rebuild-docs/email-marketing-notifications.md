# Email Marketing and Notification System

This document outlines the implementation details for email collection, guest checkout functionality, and the notification system for the Ticket Shameless application.

## Email Collection Strategy

### Database Structure

```sql
-- Email Marketing Table
CREATE TABLE email_marketing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT NOT NULL, -- Where the email was collected from (signup, guest checkout, etc.)
  subscribed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_emailed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex')
);

-- Add index for performance
CREATE INDEX idx_email_marketing_email ON email_marketing(email);
CREATE INDEX idx_email_marketing_subscribed ON email_marketing(subscribed);
```

### Email Collection Points

1. **User Registration**
   - Collect email and name during the signup process
   - Add consent checkbox for marketing communications
   - Store in both auth.users and email_marketing tables

2. **Guest Checkout**
   - Collect email (required) and name (optional) during checkout
   - Add optional checkbox for marketing communications
   - Store in email_marketing table with source = 'guest_checkout'

3. **Newsletter Signup**
   - Implement dedicated newsletter signup forms on homepage and event pages
   - Collect email (required) and name (optional)
   - Store in email_marketing table with source = 'newsletter'

4. **Event Interest**
   - Add "Notify me about this event" option on sold-out events
   - Collect email and store with event association
   - Store in email_marketing table with source = 'event_interest'

### Implementation Details

#### User Registration Email Collection

```typescript
// During user registration process
async function registerUser(email: string, password: string, name: string, marketingConsent: boolean) {
  const supabase = createClient();
  
  // Register the user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (authError) throw authError;
  
  // Create profile with name
  await supabase.from('profiles').insert({
    id: authData.user.id,
    full_name: name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  
  // Add to email marketing if consent given
  if (marketingConsent) {
    await supabase.from('email_marketing').insert({
      email,
      name,
      source: 'signup',
      subscribed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  
  return authData;
}
```

#### Guest Checkout Email Collection

```typescript
// During guest checkout process
async function processGuestCheckout(email: string, name: string, marketingConsent: boolean, orderData: any) {
  const supabase = createClient();
  
  // Process the order
  const { data: orderResult, error: orderError } = await supabase
    .from('orders')
    .insert({
      email,
      name,
      ...orderData,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (orderError) throw orderError;
  
  // Add to email marketing if consent given or always add with appropriate subscribed status
  await supabase.from('email_marketing').upsert({
    email,
    name,
    source: 'guest_checkout',
    subscribed: marketingConsent,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'email',
    update: {
      name: name || undefined, // Only update if provided
      subscribed: marketingConsent, // Update subscription status
      updated_at: new Date().toISOString(),
    }
  });
  
  return orderResult;
}
```

## Guest Checkout Implementation

### Checkout Flow

1. **Ticket Selection**
   - Allow users to select tickets without requiring login
   - Store selection in local state or session storage

2. **Checkout Form**
   - Collect essential information:
     - Email (required)
     - Name (required)
     - Payment information (via Stripe)
   - Optional marketing consent checkbox
   - No account creation required

3. **Order Processing**
   - Create order record with guest information
   - Process payment through Stripe
   - Generate tickets with unique codes
   - Send confirmation email

4. **Post-Purchase**
   - Display confirmation page with ticket details
   - Provide option to create account (optional)
   - Send tickets via email

### Implementation Details

#### Guest Checkout Component

```tsx
// components/checkout/GuestCheckoutForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { processGuestCheckout } from '@/lib/checkout';

export default function GuestCheckoutForm({ event, quantity, onSuccess }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Calculate order details
      const orderData = {
        event_id: event.id,
        quantity,
        total_price: event.price * quantity,
        // Additional order data...
      };
      
      // Process checkout
      const order = await processGuestCheckout(email, name, marketingConsent, orderData);
      
      // Handle successful checkout
      onSuccess(order);
    } catch (err: any) {
      setError(err.message || 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email (required)</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
        <p className="text-xs text-gray-500">Your tickets will be sent to this email</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">Name (required)</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="marketing"
          checked={marketingConsent}
          onCheckedChange={(checked) => setMarketingConsent(!!checked)}
        />
        <Label htmlFor="marketing" className="text-sm">
          Keep me updated about future events and promotions
        </Label>
      </div>
      
      {/* Payment component would go here */}
      
      {error && (
        <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Processing...' : `Complete Purchase ($${(event.price * quantity).toFixed(2)})`}
      </Button>
    </form>
  );
}
```

#### Order Processing Server Action

```typescript
// lib/checkout.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function processGuestOrder(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Extract form data
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;
  const eventId = formData.get('eventId') as string;
  const quantity = parseInt(formData.get('quantity') as string);
  const marketingConsent = formData.get('marketing') === 'on';
  
  try {
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    
    if (eventError) throw new Error('Event not found');
    
    // Check ticket availability
    if (event.tickets_remaining < quantity) {
      throw new Error('Not enough tickets available');
    }
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        email,
        name,
        event_id: eventId,
        quantity,
        total_price: event.price * quantity,
        status: 'pending',
      })
      .select()
      .single();
    
    if (orderError) throw new Error('Failed to create order');
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: event.title,
              description: `${quantity} ticket(s) for ${event.title}`,
            },
            unit_amount: Math.round(event.price * 100), // Convert to cents
          },
          quantity,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${event.slug}?success=true&order=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${event.slug}?canceled=true`,
      customer_email: email, // Pre-fill customer email
      metadata: {
        order_id: order.id,
        event_id: eventId,
      },
    });
    
    // Add to email marketing
    await supabase.from('email_marketing').upsert({
      email,
      name,
      source: 'guest_checkout',
      subscribed: marketingConsent,
    }, {
      onConflict: 'email',
    });
    
    return { sessionId: session.id, sessionUrl: session.url };
  } catch (error: any) {
    console.error('Checkout error:', error);
    throw new Error(error.message || 'An error occurred during checkout');
  }
}
```

## Email Notification System

### Notification Types

1. **Transactional Emails**
   - Order confirmation
   - Ticket delivery
   - Event updates (time/venue changes)
   - Event cancellation
   - Reminder (24 hours before event)

2. **Marketing Emails**
   - New event announcements
   - Promotional offers
   - Newsletter
   - Similar event recommendations

### Implementation Architecture

#### Email Service Provider Integration

```typescript
// lib/email/index.ts
import { createTransport } from 'nodemailer';
import { renderToString } from 'react-dom/server';
import { OrderConfirmationTemplate } from './templates/OrderConfirmation';
import { EventUpdateTemplate } from './templates/EventUpdate';
import { NewsletterTemplate } from './templates/Newsletter';

// Configure email transport
const transporter = createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send order confirmation email
export async function sendOrderConfirmationEmail(order: any, event: any, tickets: any[]) {
  const htmlContent = renderToString(
    OrderConfirmationTemplate({
      order,
      event,
      tickets,
    })
  );
  
  return transporter.sendMail({
    from: `"Ticket Shameless" <${process.env.EMAIL_FROM}>`,
    to: order.email,
    subject: `Your Tickets for ${event.title}`,
    html: htmlContent,
    attachments: [
      // PDF tickets would be attached here
    ],
  });
}

// Send event update notification
export async function sendEventUpdateEmail(eventId: string, updateType: string, updateDetails: any) {
  // Get all orders for this event
  const supabase = createClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('email, name')
    .eq('event_id', eventId)
    .eq('status', 'completed');
  
  if (!orders || orders.length === 0) return;
  
  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
  
  if (!event) return;
  
  // Send email to each customer
  const emailPromises = orders.map(order => {
    const htmlContent = renderToString(
      EventUpdateTemplate({
        event,
        updateType,
        updateDetails,
        recipientName: order.name,
      })
    );
    
    return transporter.sendMail({
      from: `"Ticket Shameless" <${process.env.EMAIL_FROM}>`,
      to: order.email,
      subject: `Important Update: ${event.title}`,
      html: htmlContent,
    });
  });
  
  return Promise.all(emailPromises);
}

// Send marketing newsletter
export async function sendMarketingNewsletter(subject: string, content: any) {
  // Get subscribed emails
  const supabase = createClient();
  const { data: subscribers } = await supabase
    .from('email_marketing')
    .select('email, name')
    .eq('subscribed', true);
  
  if (!subscribers || subscribers.length === 0) return;
  
  // Batch send emails (in groups of 50 to avoid rate limits)
  const batchSize = 50;
  const batches = [];
  
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    batches.push(batch);
  }
  
  for (const batch of batches) {
    const emailPromises = batch.map(subscriber => {
      const htmlContent = renderToString(
        NewsletterTemplate({
          content,
          recipientName: subscriber.name,
          unsubscribeToken: subscriber.unsubscribe_token,
        })
      );
      
      return transporter.sendMail({
        from: `"Ticket Shameless" <${process.env.EMAIL_FROM}>`,
        to: subscriber.email,
        subject,
        html: htmlContent,
      });
    });
    
    await Promise.all(emailPromises);
    
    // Add delay between batches to avoid rate limits
    if (batches.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

#### Email Templates

Email templates will be implemented as React components that can be rendered to HTML strings:

```tsx
// lib/email/templates/OrderConfirmation.tsx
import React from 'react';

interface OrderConfirmationProps {
  order: any;
  event: any;
  tickets: any[];
}

export function OrderConfirmationTemplate({ order, event, tickets }: OrderConfirmationProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#E53935', padding: '20px', textAlign: 'center', color: 'white' }}>
        <h1>Your Tickets for {event.title}</h1>
      </div>
      
      <div style={{ padding: '20px' }}>
        <p>Hello {order.name},</p>
        <p>Thank you for your purchase! Your tickets for {event.title} are attached to this email.</p>
        
        <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
          <h2>Order Summary</h2>
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Event:</strong> {event.title}</p>
          <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Venue:</strong> {event.venue}</p>
          <p><strong>Quantity:</strong> {order.quantity}</p>
          <p><strong>Total:</strong> ${order.total_price.toFixed(2)}</p>
        </div>
        
        <p>Please bring your tickets (printed or on your mobile device) to the event for entry.</p>
        <p>We're looking forward to seeing you there!</p>
        
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
            If you have any questions about your order, please contact us at support@ticketshameless.com
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Scheduled Notifications

For scheduled notifications like event reminders, we'll implement a serverless function that runs on a schedule:

```typescript
// lib/scheduled-notifications.ts
import { createClient } from '@/lib/supabase/server';
import { sendEventReminderEmail } from '@/lib/email';

export async function processEventReminders() {
  const supabase = createClient();
  
  // Find events happening in the next 24 hours
  const tomorrow = new Date();
  tomorrow.setHours(tomorrow.getHours() + 24);
  
  const today = new Date();
  
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*')
    .gte('date', today.toISOString())
    .lte('date', tomorrow.toISOString());
  
  if (!upcomingEvents || upcomingEvents.length === 0) return;
  
  // For each event, send reminders to ticket holders
  for (const event of upcomingEvents) {
    // Check if reminders have already been sent
    const { data: reminderSent } = await supabase
      .from('event_notifications')
      .select('*')
      .eq('event_id', event.id)
      .eq('type', 'reminder')
      .single();
    
    if (reminderSent) continue;
    
    // Get all completed orders for this event
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('event_id', event.id)
      .eq('status', 'completed');
    
    if (!orders || orders.length === 0) continue;
    
    // Send reminder email to each customer
    await sendEventReminderEmail(event, orders);
    
    // Mark reminders as sent
    await supabase
      .from('event_notifications')
      .insert({
        event_id: event.id,
        type: 'reminder',
        sent_at: new Date().toISOString(),
      });
  }
}
```

## Integration with Existing Systems

### Ticket Purchase Flow

1. **Update Event Page**
   - Add guest checkout option alongside login
   - Collect email and name during checkout regardless of authentication status
   - Store all customer emails in the marketing database

2. **Update Order Processing**
   - Handle both authenticated and guest orders
   - Generate and send tickets via email for all orders
   - Track order source (authenticated user or guest)

3. **Update Email Templates**
   - Create consistent branding across all emails
   - Include unsubscribe links in marketing emails
   - Ensure mobile responsiveness

## Rebuild Implementation Guide

When rebuilding the email marketing and notification system, follow these steps:

1. **Database Setup**:
   - Create the email_marketing table
   - Add appropriate indexes for performance
   - Create event_notifications table for tracking sent notifications

2. **Email Service Integration**:
   - Set up email service provider (SendGrid, Mailgun, etc.)
   - Configure email templates as React components
   - Implement email sending functions

3. **Guest Checkout Implementation**:
   - Create guest checkout form component
   - Implement order processing for guest users
   - Add email collection during checkout

4. **Notification System**:
   - Implement transactional email sending
   - Create scheduled notification functions
   - Set up tracking for sent notifications

5. **Marketing Integration**:
   - Implement newsletter signup forms
   - Create email list management functions
   - Set up unsubscribe functionality

6. **Testing**:
   - Test guest checkout flow
   - Verify email delivery for all notification types
   - Test unsubscribe functionality
   - Verify marketing consent handling

## Security and Privacy Considerations

1. **Data Protection**:
   - Store email data securely
   - Implement proper encryption for sensitive data
   - Follow GDPR and CAN-SPAM requirements

2. **Consent Management**:
   - Always get explicit consent for marketing emails
   - Provide clear unsubscribe options
   - Maintain consent records

3. **Email Security**:
   - Implement SPF, DKIM, and DMARC for email authentication
   - Use secure connection for email sending
   - Avoid including sensitive information in emails

By following these guidelines, you can implement a comprehensive email marketing and notification system that collects customer emails, supports guest checkout, and sends both transactional and marketing emails efficiently.