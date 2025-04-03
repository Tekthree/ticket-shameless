import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Default placeholder values for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export function createClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, any>) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, any>) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
