'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';

// Default placeholder values for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export function createActionClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, any>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, any>) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  const supabase = createActionClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    return { error: error.message };
  }
  
  return { success: true };
}

export async function signOut() {
  const supabase = createActionClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  
  const supabase = createActionClient();
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });
  
  if (error) {
    return { error: error.message };
  }
  
  return { success: true };
}

export async function getUserRoles() {
  'use server';
  
  const supabase = createActionClient();
  
  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { roles: [] };
  }
  
  // Get the user's roles
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      roles (
        name,
        permissions
      )
    `)
    .eq('user_id', user.id);
  
  if (error) {
    console.error("Error fetching user roles:", error);
    return { roles: [] };
  }
  
  // Extract the roles
  const roles = data.map(item => ({
    name: item.roles.name,
    permissions: item.roles.permissions,
  }));
  
  return { roles };
}