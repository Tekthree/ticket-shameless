import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/auth/login/page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      signInWithPassword: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  }),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <h2 data-testid="card-title">{children}</h2>,
  CardDescription: ({ children }) => <p data-testid="card-description">{children}</p>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>,
  CardFooter: ({ children }) => <div data-testid="card-footer">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }) => <label {...props}>{children}</label>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

describe('Login Page', () => {
  let mockSignIn;
  let mockResetPassword;
  let mockRouter;
  let mockToast;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockSignIn = jest.fn();
    mockResetPassword = jest.fn();
    mockRouter = {
      push: jest.fn(),
      refresh: jest.fn(),
    };
    mockToast = {
      success: jest.fn(),
      error: jest.fn(),
    };
    
    // Apply mocks
    require('@/lib/supabase/client').createClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
        resetPasswordForEmail: mockResetPassword,
      },
    });
    
    require('next/navigation').useRouter.mockReturnValue(mockRouter);
    
    // Mock toast
    require('react-hot-toast').default.success = mockToast.success;
    require('react-hot-toast').default.error = mockToast.error;
  });
  
  test('renders login form', () => {
    render(<LoginPage />);
    
    // Check for main elements
    expect(screen.getByTestId('card-title')).toHaveTextContent('Sign In');
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/need an account/i)).toBeInTheDocument();
  });
  
  test('handles successful sign in', async () => {
    // Setup successful response
    mockSignIn.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    
    render(<LoginPage />);
    
    const user = userEvent.setup();
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify API was called with correct data
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    
    // Verify success actions
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('You have been signed in');
      expect(mockRouter.push).toHaveBeenCalledWith('/profile');
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });
  
  test('handles sign in error', async () => {
    // Setup error response
    mockSignIn.mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    });
    
    render(<LoginPage />);
    
    const user = userEvent.setup();
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify error handling
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });
  
  test('handles password reset request', async () => {
    // Setup successful response
    mockResetPassword.mockResolvedValue({
      data: {},
      error: null,
    });
    
    render(<LoginPage />);
    
    const user = userEvent.setup();
    
    // Enter email and click forgot password
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByText(/forgot password/i));
    
    // Verify API was called with correct data
    expect(mockResetPassword).toHaveBeenCalledWith('test@example.com', {
      redirectTo: expect.stringContaining('/auth/reset-password'),
    });
    
    // Verify success message
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Check your email for a password reset link');
    });
  });
  
  test('disables password reset button when email is empty', async () => {
    render(<LoginPage />);
    
    // Forgot password button should be disabled initially
    expect(screen.getByText(/forgot password/i)).toBeDisabled();
    
    const user = userEvent.setup();
    
    // Enter email and check button is enabled
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    expect(screen.getByText(/forgot password/i)).not.toBeDisabled();
    
    // Clear email and check button is disabled again
    await user.clear(screen.getByLabelText(/email/i));
    expect(screen.getByText(/forgot password/i)).toBeDisabled();
  });
});
