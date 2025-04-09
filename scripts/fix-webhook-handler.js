// Script to fix the webhook handler
// Run with: node scripts/fix-webhook-handler.js

const fs = require('fs');
const path = require('path');

// Path to the webhook handler
const webhookPath = path.join(__dirname, '..', 'app', 'api', 'webhooks', 'stripe', 'route.ts');

console.log('===== FIXING WEBHOOK HANDLER =====');

// Check if the file exists
if (!fs.existsSync(webhookPath)) {
  console.error(`Webhook handler not found at: ${webhookPath}`);
  process.exit(1);
}

// Read the file
let webhookCode = fs.readFileSync(webhookPath, 'utf8');
console.log(`Read webhook handler file: ${webhookPath} (${webhookCode.length} bytes)`);

// Fix 1: Move variable declarations before their usage
const variableDeclarationFix = webhookCode.includes('console.log(\'Environment check:\'') && 
                              webhookCode.includes('const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!');

if (variableDeclarationFix) {
  console.log('Fixing variable declaration order issue...');
  
  // Remove the existing declarations
  webhookCode = webhookCode.replace(
    /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL!\s*const supabaseServiceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY!/g, 
    ''
  );
  
  // Add declarations before the environment check
  webhookCode = webhookCode.replace(
    /console\.log\('💾 About to record order in Supabase'\)/g,
    `console.log('💾 About to record order in Supabase')\n        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!\n        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!`
  );
  
  console.log('✅ Fixed variable declaration order');
}

// Fix 2: Add error handling around supabase initialization
const supabaseInitFix = webhookCode.includes('const supabase = createServerClient(');

if (supabaseInitFix) {
  console.log('Adding additional error handling around Supabase initialization...');
  
  // Wrap the supabase initialization in a try-catch block
  webhookCode = webhookCode.replace(
    /const supabase = createServerClient\([^)]+\)/s,
    `// Try to initialize Supabase client with error handling
        let supabase;
        try {
          supabase = createServerClient(
            supabaseUrl,
            supabaseServiceKey,
            {
              cookies: {
                get: () => undefined,
                set: () => {},
                remove: () => {}
              }
            }
          )
          console.log('Supabase client initialized successfully')
        } catch (supabaseInitError) {
          console.error('CRITICAL ERROR: Failed to initialize Supabase client:', supabaseInitError)
          return NextResponse.json({ error: 'Failed to initialize database client' }, { status: 500 })
        }`
  );
  
  console.log('✅ Added error handling around Supabase initialization');
}

// Fix 3: Add debug logging for emergency insertion
const emergencyInsertionFix = webhookCode.includes('EMERGENCY INSERTION ATTEMPT');

if (emergencyInsertionFix) {
  console.log('Enhancing emergency insertion logging...');
  
  // Add more detailed logging for the emergency insertion
  webhookCode = webhookCode.replace(
    /console\.log\('EMERGENCY INSERTION ATTEMPT:', emergencyOrderData\);/g,
    `console.log('EMERGENCY INSERTION ATTEMPT:', emergencyOrderData);
          console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing');
          console.log('Supabase Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present (starts with ' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5) + '...)' : 'Missing');`
  );
  
  console.log('✅ Enhanced emergency insertion logging');
}

// Write the fixed code back to the file
fs.writeFileSync(webhookPath, webhookCode, 'utf8');
console.log(`Successfully updated webhook handler file: ${webhookPath}`);
console.log('===== WEBHOOK HANDLER FIXED =====');
console.log('\nNext steps:');
console.log('1. Restart your Next.js server');
console.log('2. Test a purchase to see if the webhook now properly inserts the order');
console.log('3. Check the console logs for any remaining errors');
