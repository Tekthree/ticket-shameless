// Webhook test script
// This script will create a test checkout.session.completed event and send it to your webhook
// Run with: node scripts/test-webhook.js

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const crypto = require('crypto');
const Stripe = require('stripe');

// Get environment variables
const webhookEndpoint = process.env.NEXT_PUBLIC_BASE_URL + '/api/webhooks/stripe';
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!webhookEndpoint || !endpointSecret || !stripeSecretKey) {
  console.error('Missing required environment variables');
  console.log('Required:');
  console.log('- NEXT_PUBLIC_BASE_URL');
  console.log('- STRIPE_WEBHOOK_SECRET');
  console.log('- STRIPE_SECRET_KEY');
  process.exit(1);
}

// Initialize Stripe for creating an actual event
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15',
});

// Create a sample event payload
async function createSampleEvent() {
  // Get a real event from our account
  try {
    // First, let's create a test checkout session with minimal data
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Event',
            },
            unit_amount: 1000, // $10.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: {
        eventId: '12345678-1234-1234-1234-123456789012', // Test UUID
        quantity: '1',
      },
    });

    console.log('Created test checkout session:', session.id);

    // Create a test event manually
    // We need to prevent Stripe from actually sending this event to our endpoint
    // So we're constructing it manually
    const timestamp = Math.floor(Date.now() / 1000);
    
    const event = {
      id: `evt_test_${timestamp}`,
      object: 'event',
      api_version: '2022-11-15',
      created: timestamp,
      data: {
        object: {
          id: session.id,
          object: 'checkout.session',
          amount_total: 1000,
          currency: 'usd',
          customer_details: {
            email: 'test@example.com',
            name: 'Test Customer',
            phone: '+12345678901',
          },
          metadata: {
            eventId: '12345678-1234-1234-1234-123456789012',
            quantity: '1',
          },
          payment_status: 'paid',
          status: 'complete',
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: `req_test_${timestamp}`,
        idempotency_key: `idempkey_test_${timestamp}`,
      },
      type: 'checkout.session.completed',
    };

    return event;
  } catch (error) {
    console.error('Error creating sample event:', error);
    process.exit(1);
  }
}

// Send the test event to the webhook
async function sendTestEvent(event) {
  try {
    // Convert the event to a JSON string
    const payload = JSON.stringify(event);
    
    // Create a signature using the webhook secret
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', endpointSecret)
      .update(signedPayload)
      .digest('hex');
    
    // Construct the signature string as expected by the webhook handler
    const stripeSignature = `t=${timestamp},v1=${signature}`;
    
    console.log(`Sending test event to ${webhookEndpoint}`);
    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);
    console.log('Session ID:', event.data.object.id);
    
    // Send the request
    const response = await fetch(webhookEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': stripeSignature,
      },
      body: payload,
    });
    
    // Check the response
    if (response.ok) {
      const responseData = await response.json();
      console.log('Webhook response:', responseData);
      console.log('Webhook test successful!');
    } else {
      const errorText = await response.text();
      console.error('Webhook test failed with status:', response.status);
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error sending test event:', error);
  }
}

// Run the test
(async () => {
  console.log('=== STRIPE WEBHOOK TEST ===');
  const event = await createSampleEvent();
  await sendTestEvent(event);
})();
