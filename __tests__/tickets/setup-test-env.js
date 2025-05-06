/**
 * Setup Test Environment
 * 
 * This script helps set up the test environment for ticket count tests.
 * It loads environment variables from .env.test if available.
 * 
 * Usage:
 * - Create a .env.test file with your test database credentials
 * - Run tests with: NODE_ENV=test npm test
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Paths to potential env files
const envPaths = [
  path.resolve(process.cwd(), '.env.test'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env')
];

// Try to load environment variables from one of the files
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading test environment variables from ${envPath}`);
    dotenv.config({ path: envPath });
    break;
  }
}

// Verify if we have the required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️  Missing environment variables for ticket tests:');
  missingVars.forEach(varName => {
    console.warn('\x1b[33m%s\x1b[0m', `   - ${varName}`);
  });
  console.warn('\x1b[33m%s\x1b[0m', '   Tests will be skipped. Create a .env.test file with these variables to run tests.');
  console.warn('\x1b[33m%s\x1b[0m', '   Example .env.test file:');
  console.warn('\x1b[33m%s\x1b[0m', '   NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url');
  console.warn('\x1b[33m%s\x1b[0m', '   SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key');
} else {
  console.log('\x1b[32m%s\x1b[0m', '✅ Test environment variables loaded successfully.');
}

module.exports = {};
