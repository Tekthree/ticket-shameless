// Webhook handler validation script
// This script will analyze your webhook handler code and check for common issues
// Run with: node scripts/validate-webhook-handler.js

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Configuration
const webhookHandlerPath = path.join(__dirname, '..', 'app', 'api', 'webhooks', 'stripe', 'route.ts');

// Utility to check if an environment variable exists and is not empty
function checkEnvVar(name) {
  const value = process.env[name];
  return {
    exists: !!value,
    value: value ? `${value.substring(0, 5)}...${value.substring(value.length - 5)}` : null,
    length: value ? value.length : 0
  };
}

// Main analysis function
async function analyzeWebhookHandler() {
  console.log('=== WEBHOOK HANDLER VALIDATION ===');
  
  // Step 1: Check if the webhook handler file exists
  console.log('\n----- CHECKING WEBHOOK HANDLER FILE -----');
  if (!fs.existsSync(webhookHandlerPath)) {
    console.error(`Webhook handler file not found at: ${webhookHandlerPath}`);
    return;
  }
  console.log(`Webhook handler file found: ${webhookHandlerPath}`);
  
  // Step 2: Check environment variables
  console.log('\n----- CHECKING ENVIRONMENT VARIABLES -----');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_BASE_URL'
  ];
  
  let missingEnvVars = false;
  
  requiredEnvVars.forEach(varName => {
    const check = checkEnvVar(varName);
    if (check.exists) {
      console.log(`✅ ${varName}: Found (${check.length} characters)`);
    } else {
      console.error(`❌ ${varName}: Missing or empty`);
      missingEnvVars = true;
    }
  });
  
  if (missingEnvVars) {
    console.error('Some required environment variables are missing! Fix before continuing.');
  }
  
  // Step 3: Read and analyze the webhook handler code
  console.log('\n----- ANALYZING WEBHOOK HANDLER CODE -----');
  const code = fs.readFileSync(webhookHandlerPath, 'utf8');
  
  // Check for common issues
  const checks = [
    {
      name: 'Proper error handling',
      pass: code.includes('catch') && code.includes('error'),
      details: 'Webhook handler should include proper try/catch blocks'
    },
    {
      name: 'Stripe signature verification',
      pass: code.includes('stripe.webhooks.constructEvent'),
      details: 'Webhook handler should verify Stripe signature'
    },
    {
      name: 'checkout.session.completed handling',
      pass: code.includes('checkout.session.completed'),
      details: 'Webhook handler should process checkout.session.completed events'
    },
    {
      name: 'Database insertion',
      pass: code.includes('.insert(') && code.includes('from(\'orders\')'),
      details: 'Webhook handler should insert data into orders table'
    },
    {
      name: 'Service role usage',
      pass: code.includes('SUPABASE_SERVICE_ROLE_KEY'),
      details: 'Webhook handler should use service role key for admin database access'
    }
  ];
  
  let issuesFound = false;
  
  checks.forEach(check => {
    if (check.pass) {
      console.log(`✅ ${check.name}: Found`);
    } else {
      console.error(`❌ ${check.name}: Not found - ${check.details}`);
      issuesFound = true;
    }
  });
  
  // Step 4: Check for specific logic issues
  console.log('\n----- CHECKING FOR SPECIFIC LOGIC ISSUES -----');
  
  const logicIssues = [
    {
      name: 'Proper field extraction',
      condition: code.includes('eventId = session.metadata?.eventId'),
      details: 'Webhook should correctly extract eventId from session metadata'
    },
    {
      name: 'Error logging',
      condition: code.includes('console.error') && code.includes('orderError'),
      details: 'Webhook should log errors when order insertion fails'
    },
    {
      name: 'Fallback mechanisms',
      condition: code.includes('retryOrderData') || code.includes('delete'),
      details: 'Webhook should have fallback mechanisms when insertion fails'
    },
    {
      name: 'Response handling',
      condition: code.includes('return NextResponse.json'),
      details: 'Webhook should return proper response objects'
    }
  ];
  
  logicIssues.forEach(issue => {
    if (issue.condition) {
      console.log(`✅ ${issue.name}: Implemented`);
    } else {
      console.log(`⚠️ ${issue.name}: Not found - ${issue.details}`);
    }
  });
  
  // Final summary and recommendations
  console.log('\n----- SUMMARY AND RECOMMENDATIONS -----');
  
  if (missingEnvVars) {
    console.error('❌ Missing environment variables detected');
    console.log('Action: Add the missing environment variables to your .env.local file');
  }
  
  if (issuesFound) {
    console.error('❌ Issues found in webhook handler code');
    console.log('Action: Review and fix the issues in the webhook handler');
  }
  
  // Check for the most common webhook issues
  if (!code.includes('console.log')) {
    console.log('⚠️ Limited logging detected - Add more detailed logging to troubleshoot');
  }
  
  if (!code.includes('retryOrderData') && !code.includes('retry')) {
    console.log('⚠️ No retry logic detected - Consider adding retry mechanisms for failed insertions');
  }
  
  // Specific issue related to eventId
  if (code.includes('const eventId = session.metadata?.eventId')) {
    console.log('✅ EventId extraction looks correct');
  } else {
    console.log('⚠️ Check how eventId is extracted from session metadata - may be incorrect');
  }
  
  // Specific SQL issues
  if (code.includes('RLS') || code.includes('Row Level Security')) {
    console.log('⚠️ The code mentions RLS - make sure policies allow webhook insertions');
    console.log('Action: Run the fix-webhook-permissions.sql script in Supabase SQL editor');
  }
  
  console.log('\n=== END OF VALIDATION ===');
}

// Run the analysis
analyzeWebhookHandler().catch(err => {
  console.error('Unhandled error during validation:', err);
});
