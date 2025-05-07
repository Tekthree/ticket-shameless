# Google OAuth Implementation Guide

This guide provides detailed instructions for implementing Google OAuth authentication with Supabase in the Ticket Shameless application.

## Prerequisites

1. **Google Cloud Platform Account**
   - Access to Google Cloud Console
   - Ability to create OAuth 2.0 credentials

2. **Supabase Project**
   - Admin access to Supabase dashboard
   - Ability to configure authentication providers

## Setup Process

### 1. Configure Google OAuth Credentials

1. **Create OAuth Credentials in Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Add authorized JavaScript origins:
     - Development: `http://localhost:3000`
     - Production: `https://your-production-domain.com`
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/auth/callback`
     - Production: `https://your-production-domain.com/auth/callback`
   - Click "Create" to generate client ID and client secret

2. **Enable Required Google APIs**
   - Navigate to "APIs & Services" > "Library"
   - Search for and enable "Google+ API" or "Google People API"
   - This allows access to user profile information

### 2. Configure Supabase Auth Provider

1. **Add Google Provider in Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to "Authentication" > "Providers"
   - Find "Google" in the list of providers and click "Enable"
   - Enter the Client ID and Client Secret from Google Cloud Console
   - Set the Authorized redirect URI to match what you configured in Google
   - Save the configuration

2. **Configure Site URL and Redirect URLs**
   - In Supabase dashboard, go to "Authentication" > "URL Configuration"
   - Set the Site URL to your application's base URL
   - Add any additional redirect URLs if needed
   - Save the configuration

### 3. Implement in Next.js Application

1. **Create Auth Components**

```tsx
// components/auth/GoogleSignInButton.tsx
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { FcGoogle } from "react-icons/fc";

export default function GoogleSignInButton() {
  const supabase = createClient();
  
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('Error signing in with Google:', error);
      }
    } catch (err) {
      console.error('Exception during Google sign-in:', err);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      type="button" 
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-2"
    >
      <FcGoogle className="h-5 w-5" />
      <span>Continue with Google</span>
    </Button>
  );
}
```

2. **Create Auth Callback Handler**

```tsx
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { addToEmailMarketing } from '@/lib/email/marketing';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const isLinking = requestUrl.searchParams.get('linking') === 'true';
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Get authenticated user securely
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Add user to email marketing database if not linking an existing account
        if (!isLinking) {
          await addToEmailMarketing({
            email: user.email || '',
            name: user.user_metadata?.full_name || '',
            source: 'google_oauth',
            subscribed: true
          });
        }
      }
    }
  }
  
  // Redirect to the appropriate page after authentication
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
```

3. **Update Login Form to Include Google Sign-In**

```tsx
// components/auth/LoginForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import GoogleSignInButton from './GoogleSignInButton';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter your credentials to access your account
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="/auth/forgot-password" className="text-sm text-blue-600 dark:text-blue-400">
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      
      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-xs text-gray-500 dark:text-gray-400">OR</span>
        <Separator className="flex-1" />
      </div>
      
      <GoogleSignInButton />
      
      <div className="text-center text-sm">
        Don't have an account?{' '}
        <a href="/auth/register" className="text-blue-600 dark:text-blue-400">
          Sign up
        </a>
      </div>
    </div>
  );
}
```

### 4. Handle User Profile Creation/Update

1. **Create Profile Sync Function**

```tsx
// lib/supabase/profile-sync.ts
import { createClient } from './server';
import { cookies } from 'next/headers';
import { addToEmailMarketing } from '@/lib/email/marketing';

export async function syncUserProfile(userId: string, userData: any) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Get authenticated user securely
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (existingProfile) {
    // Update existing profile
    await supabase
      .from('profiles')
      .update({
        full_name: userData.name || existingProfile.full_name,
        avatar_url: userData.avatar_url || existingProfile.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } else {
    // Create new profile
    await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: userData.name || '',
        avatar_url: userData.avatar_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    // Add to email marketing for new profiles
    if (user.email) {
      await addToEmailMarketing({
        email: user.email,
        name: userData.name || '',
        source: 'profile_creation',
        subscribed: true
      });
    }
  }
}
```

2. **Create Secure Authentication Helpers**

```tsx
// lib/supabase/auth.ts
import { createClient } from './client';

// Secure method to get authenticated user
// This contacts the Supabase Auth server to validate the token
export async function getAuthenticatedUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
  
  return user;
}

// Check if user is authenticated
export async function isAuthenticated() {
  const user = await getAuthenticatedUser();
  return !!user;
}

// A secure wrapper around getSession that validates with getUser
export async function getSecureSession() {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  
  // Validate the session by checking the user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { session: null };
  }
  
  return sessionData;
}
```

3. **Update Auth State Change Handler**

```tsx
// lib/supabase/auth-state-handler.ts
import { createClient } from './client';
import { getAuthenticatedUser } from './auth';

export function setupAuthStateChangeHandler() {
  const supabase = createClient();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN') {
        // Get authenticated user securely
        const user = await getAuthenticatedUser();
        
        if (user) {
          // Extract profile data from OAuth providers if available
          let userData = {
            name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
          };
          
          // Call server action to sync profile
          await fetch('/api/auth/sync-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userData }),
          });
        }
      }
    }
  );
  
  return subscription;
}
```

3. **Create Server Action for Profile Sync**

```tsx
// app/api/auth/sync-profile/route.ts
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { syncUserProfile } from '@/lib/supabase/profile-sync';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Get the authenticated user securely
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user data from request
    const { userData } = await request.json();
    
    // Sync the profile
    await syncUserProfile(user.id, userData);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error syncing profile:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 5. Implement Profile Linking

1. **Create Profile Connection Management UI**

```tsx
// components/profile/ConnectionsManager.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FcGoogle } from 'react-icons/fc';
import { createClient } from '@/lib/supabase/client';

export default function ConnectionsManager() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<string[]>([]);
  
  useEffect(() => {
    async function fetchUserProviders() {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.identities) {
          // Extract provider names from identities
          const connectedProviders = user.identities.map(
            identity => identity.provider
          );
          setProviders(connectedProviders);
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserProviders();
  }, []);
  
  const handleConnectGoogle = async () => {
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?linking=true`,
        },
      });
      
      if (error) {
        console.error('Error linking Google account:', error);
      }
    } catch (err) {
      console.error('Exception during Google account linking:', err);
    }
  };
  
  const isGoogleConnected = providers.includes('google');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Manage your connected accounts and login methods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <FcGoogle className="h-6 w-6" />
            <div>
              <p className="font-medium">Google</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isGoogleConnected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          
          {isGoogleConnected ? (
            <Button variant="outline" disabled>
              Connected
            </Button>
          ) : (
            <Button variant="outline" onClick={handleConnectGoogle}>
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Email Marketing Integration

1. **Create Email Marketing Helper**

```tsx
// lib/email/marketing.ts
import { createClient } from '@/lib/supabase/client';

interface EmailMarketingData {
  email: string;
  name?: string;
  source: string;
  subscribed: boolean;
}

export async function addToEmailMarketing(data: EmailMarketingData) {
  const supabase = createClient();
  
  // Validate email
  if (!data.email || !data.email.includes('@')) {
    console.error('Invalid email for marketing:', data.email);
    return { success: false, error: 'Invalid email' };
  }
  
  try {
    // Add or update email marketing record
    const { error } = await supabase.from('email_marketing').upsert({
      email: data.email,
      name: data.name || null,
      source: data.source,
      subscribed: data.subscribed,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'email',
      update: {
        name: data.name || undefined, // Only update if provided
        subscribed: data.subscribed, // Update subscription status
        updated_at: new Date().toISOString(),
      }
    });
    
    if (error) {
      console.error('Error adding to email marketing:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err: any) {
    console.error('Exception adding to email marketing:', err);
    return { success: false, error: err.message };
  }
}
```

## Security Considerations

1. **Token Validation**
   - Always validate tokens on the server side using `getAuthenticatedUser()`
   - Never use `getSession()` directly as it comes from client storage
   - Implement proper token refresh mechanisms
   - Use server-side validation for all authentication operations

2. **Role Assignment for OAuth Users**
   - Create a default role assignment process for new OAuth users
   - Consider implementing an approval workflow for certain roles

3. **Session Management**
   - Implement proper session timeout and refresh
   - Clear sensitive data on sign-out
   - Handle multiple devices and sessions appropriately

4. **Error Handling**
   - Provide clear error messages for authentication failures
   - Log authentication errors for monitoring
   - Implement rate limiting for authentication attempts

## Testing OAuth Integration

1. **Test Account Creation**
   - Verify new accounts are created properly with Google OAuth
   - Check that profile data is synced correctly

2. **Test Account Linking**
   - Verify existing accounts can link with Google
   - Test the unlinking process
   - Ensure account security is maintained

3. **Test Authentication Flow**
   - Verify redirect and callback handling
   - Test session persistence
   - Verify token refresh works correctly

4. **Test Error Scenarios**
   - Test with invalid credentials
   - Test with revoked access
   - Test with network failures

## Deployment Checklist

1. **Environment Configuration**
   - Update environment variables for production
   - Configure proper redirect URIs for production

2. **Security Headers**
   - Implement proper CSP headers
   - Set secure and httpOnly cookies
   - Configure CORS appropriately

3. **Monitoring**
   - Set up logging for authentication events
   - Monitor failed authentication attempts
   - Track OAuth usage metrics

4. **Documentation**
   - Document the authentication flow
   - Provide user guidance for OAuth sign-in
   - Create internal documentation for maintenance