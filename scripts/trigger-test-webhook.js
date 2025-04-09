// Script to manually trigger the test webhook endpoint
// Run with: node scripts/trigger-test-webhook.js

const http = require('http');

function triggerTestWebhook() {
  console.log('===== TRIGGERING TEST WEBHOOK =====');
  
  const testEvent = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'test_cs_' + Date.now(),
        customer_email: 'test@example.com',
        customer_details: {
          name: 'Test Customer',
          email: 'test@example.com'
        },
        amount_total: 2500, // $25.00
        metadata: {}
      }
    }
  };
  
  console.log('Sending test event to webhook endpoint...');
  
  const data = JSON.stringify(testEvent);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/test-webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Stripe-Signature': 'test_signature_' + Date.now() // Dummy signature
    }
  };
  
  const req = http.request(options, (res) => {
    console.log('Response status:', res.statusCode);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(responseData);
        console.log('Response data:', parsedData);
      } catch (e) {
        console.log('Raw response:', responseData);
      }
      
      console.log('\nNow check the logs directory for test-webhook.log');
    });
  });
  
  req.on('error', (error) => {
    console.error('Error triggering webhook:', error);
  });
  
  req.write(data);
  req.end();
}

// Run the function
triggerTestWebhook();
