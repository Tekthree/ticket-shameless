/**
 * Supabase mock utilities for testing
 */

export const mockSupabaseClient = () => {
  const authMock = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
  };

  const storageMock = {
    from: jest.fn().mockReturnValue({
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      list: jest.fn(),
      remove: jest.fn(),
    }),
  };

  const fromMock = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    then: jest.fn(),
  });

  return {
    auth: authMock,
    from: fromMock,
    storage: storageMock,
    rpc: jest.fn(),
  };
};

export const mockSupabaseAuthResponse = (success = true, userData = null) => {
  if (success) {
    return {
      data: {
        user: userData || {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
          },
        },
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: Date.now() + 3600,
        },
      },
      error: null,
    };
  }
  
  return {
    data: { user: null, session: null },
    error: {
      message: 'Authentication error',
      status: 401,
    },
  };
};

export const mockSupabaseQueryResponse = (success = true, data = null, errorMessage = 'Database error') => {
  if (success) {
    return {
      data: data || [],
      error: null,
    };
  }
  
  return {
    data: null,
    error: {
      message: errorMessage,
      code: 'PGRST_ERROR',
    },
  };
};
