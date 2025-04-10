// Suppress deprecation warnings during tests
process.env.NODE_NO_WARNINGS = 1;

// Specifically for punycode deprecation
const originalEmit = process.emit;
process.emit = function(event, error) {
  if (
    event === 'warning' && 
    error && 
    error.name === 'DeprecationWarning' && 
    error.code === 'DEP0040'
  ) {
    return false;
  }
  return originalEmit.apply(process, arguments);
};
