# PowerShell script to run tests in WSL

# Default: Run all tests
if ($args.Count -eq 0) {
    wsl -d Ubuntu-20.04 -e bash -c "cd ~/ticket-shameless && npm test"
}
# Run only login page tests
elseif ($args[0] -eq "login") {
    Write-Host "Running only login page tests..."
    wsl -d Ubuntu-20.04 -e bash -c "cd ~/ticket-shameless && npm test -- __tests__/auth/LoginPage.test.jsx"
}
# Run only signup page tests
elseif ($args[0] -eq "signup") {
    Write-Host "Running only signup page tests..."
    wsl -d Ubuntu-20.04 -e bash -c "cd ~/ticket-shameless && npm test -- __tests__/auth/DirectRegisterPage.test.jsx"
}
# Run all auth tests
elseif ($args[0] -eq "auth") {
    Write-Host "Running all authentication tests..."
    wsl -d Ubuntu-20.04 -e bash -c "cd ~/ticket-shameless && npm test -- __tests__/auth/LoginPage.test.jsx __tests__/auth/DirectRegisterPage.test.jsx"
}
# Run payment webhook tests
elseif ($args[0] -eq "webhook") {
    Write-Host "Running Stripe webhook tests..."
    wsl -d Ubuntu-20.04 -e bash -c "cd ~/ticket-shameless && npm test -- __tests__/payments/stripe-webhook.test.js"
}
# Run payment records tests
elseif ($args[0] -eq "payments") {
    Write-Host "Running payment records tests..."
    wsl -d Ubuntu-20.04 -e bash -c "cd ~/ticket-shameless && npm test -- __tests__/supabase/payment-records.test.js"
}
# Run all payment-related tests
elseif ($args[0] -eq "payment-all") {
    Write-Host "Running all payment-related tests..."
    wsl -d Ubuntu-20.04 -e bash -c "cd ~/ticket-shameless && npm test -- __tests__/payments/stripe-webhook.test.js __tests__/supabase/payment-records.test.js"
}
# Run tests with verbose output
elseif ($args[0] -eq "verbose") {
    Write-Host "Running tests with verbose output..."
    wsl -d Ubuntu-20.04 -e bash -c "cd ~/ticket-shameless && npm test -- --verbose"
}
# Run tests with coverage
elseif ($args[0] -eq "coverage") {
    Write-Host "Running tests with coverage..."
    wsl -d Ubuntu-20.04 -e bash -c "cd ~/ticket-shameless && npm test -- --coverage"
}
else {
    # Run specific test file or pattern
    Write-Host "Running tests matching pattern: $($args[0])"
    wsl -d Ubuntu-20.04 -e bash -c "cd ~/ticket-shameless && npm test -- $($args[0])"
}
