// Webhook inspection script
// Run with: node scripts/inspect-webhook.js

const fs = require('fs');
const path = require('path');

// Path to the webhook handler
const webhookPath = path.join(__dirname, '..', 'app', 'api', 'webhooks', 'stripe', 'route.ts');

console.log('===== WEBHOOK HANDLER INSPECTION =====');

// Check if the file exists
if (!fs.existsSync(webhookPath)) {
  console.error(`Webhook handler not found at: ${webhookPath}`);
  process.exit(1);
}

// Read the file
const webhookCode = fs.readFileSync(webhookPath, 'utf8');
console.log(`Read webhook handler file: ${webhookPath} (${webhookCode.length} bytes)`);

// Check for key imports and functions
const checks = [
  { name: 'Import createServerClient', pattern: /import\s+{\s*createServerClient\s*}\s+from\s+['"]@supabase\/ssr['"]/g },
  { name: 'Import Stripe', pattern: /import\s+Stripe\s+from\s+['"]stripe['"]/g },
  { name: 'Initialize Stripe client', pattern: /new\s+Stripe\s*\(\s*process\.env\.STRIPE_SECRET_KEY/g },
  { name: 'Webhook verification', pattern: /stripe\.webhooks\.constructEvent\s*\(\s*payload\s*,\s*sig\s*,\s*endpointSecret\s*\)/g },
  { name: 'Handle checkout.session.completed', pattern: /case\s+['"]checkout\.session\.completed['"]/g },
  { name: 'Create Supabase client', pattern: /const\s+supabase\s*=\s*createServerClient\s*\(/g },
  { name: 'Insert order', pattern: /\.from\s*\(\s*['"]orders['"]\s*\)\s*\.\s*insert\s*\(/g },
  { name: 'UUID validation', pattern: /uuidRegex\s*=\s*\/\^[0-9a-f]/g },
  { name: 'Emergency insertion', pattern: /EMERGENCY\s+INSERTION\s+ATTEMPT/g }
];

// Run the checks
console.log('\nChecking webhook handler implementation:');
checks.forEach(check => {
  const matches = webhookCode.match(check.pattern) || [];
  const passed = matches.length > 0;
  console.log(`${passed ? '✅' : '❌'} ${check.name}: ${passed ? 'Found' : 'Missing'}`);
  
  // Print context if check failed and it's important
  if (!passed && ['Create Supabase client', 'Insert order', 'Emergency insertion'].includes(check.name)) {
    console.log(`   WARNING: ${check.name} is missing or incorrect. This could explain the insertion failure.`);
  }
});

// Check for specific bug patterns
console.log('\nChecking for potential issues:');

// Check 1: Misuse of service key
const serviceKeyPattern = /SUPABASE_SERVICE_ROLE_KEY/g;
const serviceKeyMatches = webhookCode.match(serviceKeyPattern) || [];
console.log(`${serviceKeyMatches.length > 0 ? '✅' : '❌'} Service role key usage: ${serviceKeyMatches.length} occurrences`);

// Check 2: Error handling around database operations
const errorHandlingPattern = /error\s*:\s*[\w]+Error\s*}\s*=\s*await\s+supabase/g;
const errorHandlingMatches = webhookCode.match(errorHandlingPattern) || [];
console.log(`${errorHandlingMatches.length > 0 ? '✅' : '❌'} Database error handling: ${errorHandlingMatches.length} occurrences`);

// Check 3: Try-catch blocks
const tryCatchPattern = /try\s*{[\s\S]*?}\s*catch\s*\(/g;
const tryCatchMatches = webhookCode.match(tryCatchPattern) || [];
console.log(`${tryCatchMatches.length > 0 ? '✅' : '❌'} Try-catch blocks: ${tryCatchMatches.length} occurrences`);

console.log('\n===== END OF INSPECTION =====');
