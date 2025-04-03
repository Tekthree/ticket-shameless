/**
 * This script simulates a Stripe webhook event
 * Run it with: node scripts/webhook-test.js
 * Make sure your development server is running
 */

const crypto = require('crypto');
const http = require('http');

// Load environment variables (in a real scenario, you'd use dotenv)
// Replace these with your values or load them from .env
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
const EVENT_TYPE = 'checkout.session.completed';

// Sample checkout session completed event
const event = {
  id: `evt_${Math.random().toString(36).substring(2, 15)}`,
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  type: EVENT_TYPE,
  data: {
    object: {
      id: `cs_test_${Math.random().toString(36).substring(2, 15)}`,
      object: 'checkout.session',
      amount_total: 2500, // $25.00
      currency: 'usd',
      customer_details: {
        email: 'test@example.com',
        name: 'Test Customer'
      },
      metadata: {
        eventId: '1', // This should match an event ID in your database
        quantity: '2'
      },
      payment_status: 'paid',
      status: 'complete'
    }
  }
};

// Convert the event to a string
const payload = JSON.stringify(event);

// Create the signature
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(signedPayload)
  .digest('hex');

// Create the signature header
const stripeSignature = `t=${timestamp},v1=${signature}`;

// Options for the HTTP request
const options = {
  hostname: 'localhost',
  port: 3000, // Change if your Next.js is running on a different port
  path: '/api/webhooks/stripe',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length,
    'Stripe-Signature': stripeSignature
  }
};

// Send the request
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    console.log('Webhook test complete!');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write the payload to the request
req.write(payload);
req.end();

console.log('Sending test webhook to local server...');
console.log(`Event type: ${EVENT_TYPE}`);
