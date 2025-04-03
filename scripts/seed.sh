#!/bin/bash

# Change to the project root directory
cd "$(dirname "$0")/.."

# Install required dependencies
echo "Installing dependencies..."
npm install dotenv @supabase/supabase-js

# Run the seed script
echo "Running database seed script..."
node scripts/seed-database.js
