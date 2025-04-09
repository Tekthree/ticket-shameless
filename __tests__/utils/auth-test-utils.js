/**
 * Authentication testing utilities
 * 
 * This file contains common mocks and helper functions for testing authentication components
 */

import React from 'react';
import { render } from '@testing-library/react';

// Mock successful authentication response
export const mockSuccessfulAuth = (mockSignIn) => {
  mockSignIn.mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  });
};

// Mock failed authentication response
export const mockFailedAuth = (mockSignIn, errorMessage = 'Invalid credentials') => {
  mockSignIn.mockResolvedValue({
    data: null,
    error: { message: errorMessage },
  });
};

// Mock successful password reset response
export const mockSuccessfulPasswordReset = (mockResetPassword) => {
  mockResetPassword.mockResolvedValue({
    data: {},
    error: null,
  });
};

// Mock failed password reset response
export const mockFailedPasswordReset = (mockResetPassword, errorMessage = 'Unable to reset password') => {
  mockResetPassword.mockResolvedValue({
    data: null,
    error: { message: errorMessage },
  });
};

// Setup common mocks for authentication tests
export const setupAuthMocks = () => {
  const mockSignIn = jest.fn();
  const mockResetPassword = jest.fn();
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
  };
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  };
  
  // Apply mocks
  jest.mock('@/lib/supabase/client', () => ({
    createClient: jest.fn().mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
        resetPasswordForEmail: mockResetPassword,
      },
    }),
  }), { virtual: true });
  
  jest.mock('next/navigation', () => ({
    useRouter: jest.fn().mockReturnValue(mockRouter),
  }), { virtual: true });
  
  jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
      success: mockToast.success,
      error: mockToast.error,
    },
  }), { virtual: true });
  
  return {
    mockSignIn,
    mockResetPassword,
    mockRouter,
    mockToast,
  };
};

// Custom render function with common UI component mocks
export const renderWithAuthMocks = (ui) => {
  // Mock UI components
  jest.mock('@/components/ui/card', () => ({
    Card: ({ children }) => <div data-testid="card">{children}</div>,
    CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
    CardTitle: ({ children }) => <h2 data-testid="card-title">{children}</h2>,
    CardDescription: ({ children }) => <p data-testid="card-description">{children}</p>,
    CardContent: ({ children }) => <div data-testid="card-content">{children}</div>,
    CardFooter: ({ children }) => <div data-testid="card-footer">{children}</div>,
  }), { virtual: true });

  jest.mock('@/components/ui/button', () => ({
    Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  }), { virtual: true });

  jest.mock('@/components/ui/input', () => ({
    Input: (props) => <input {...props} />,
  }), { virtual: true });

  jest.mock('@/components/ui/label', () => ({
    Label: ({ children, ...props }) => <label {...props}>{children}</label>,
  }), { virtual: true });

  jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }) => <a href={href}>{children}</a>,
  }), { virtual: true });
  
  return render(ui);
};
