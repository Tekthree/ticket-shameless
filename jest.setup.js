import '@testing-library/jest-dom';

// Only mock window-specific APIs in jsdom environment
if (typeof window !== 'undefined') {
  // Mock window.matchMedia which is not available in Jest
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
  }),
  usePathname: jest.fn().mockReturnValue('/'),
  useSearchParams: jest.fn().mockReturnValue({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    forEach: jest.fn(),
  }),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue({
    elements: jest.fn().mockReturnValue({
      create: jest.fn(),
      getElement: jest.fn(),
    }),
    confirmPayment: jest.fn(),
  }),
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => {
  const mockToast = jest.fn();
  mockToast.success = jest.fn();
  mockToast.error = jest.fn();
  
  return {
    __esModule: true,
    default: mockToast,
    success: jest.fn(),
    error: jest.fn(),
  };
});

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Check if the error is related to act warnings or other expected test warnings
  if (
    args[0]?.includes('Warning:') ||
    args[0]?.includes('React does not recognize the') ||
    args[0]?.includes('Invalid DOM property') ||
    // Suppress expected auth error messages in tests
    args[0]?.includes('Sign in error:') ||
    args[0]?.includes('Registration error:') ||
    args[0]?.includes('Email already in use') ||
    args[0]?.includes('Invalid credentials')
  ) {
    // Still log these during development if needed
    if (process.env.DEBUG_TEST_ERRORS) {
      originalConsoleError('Suppressed error in test:', ...args);
    }
    return;
  }
  originalConsoleError(...args);
};
